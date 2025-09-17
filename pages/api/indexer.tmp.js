import { getCachedQuarkFiles } from '../../utils/quark-api';
import { cacheFilesToDb } from '../../utils/db-cache';
import { getMountedIndex } from '../../utils/flexsearch';
import prisma from '../../utils/prisma';

// In-memory lock to prevent concurrent indexing for the same folder.
// This is a simple solution for a serverless environment. A more robust
// solution for stateful servers might use a Redis lock or similar.
const indexingInProgress = new Set();

export default async function handler(req, res) {
    const { pdir_fid } = req.query;
    const cookie = process.env.QUARK_COOKIE;

    if (!pdir_fid || !cookie) {
        return res.status(400).json({ error: 'pdir_fid and cookie are required.' });
    }

    // 先尝试基于 Postgres 的顾问锁，确保多实例下互斥
    let dbLockAcquired = false;
    try {
        const lockResult = await prisma.$queryRaw`select pg_try_advisory_lock(hashtext(${pdir_fid})) as locked`;
        dbLockAcquired = Array.isArray(lockResult) ? !!lockResult[0]?.locked : false;
    } catch (e) {
        console.error('Failed to acquire advisory lock:', e);
    }

    // 本实例内的内存锁，避免同实例并发
    if (indexingInProgress.has(pdir_fid) || !dbLockAcquired) {
        return res.status(202).json({ message: `Indexing already in progress or lock not acquired for folder ${pdir_fid}.` });
    }

    // Respond immediately to the client that the process has started
    res.status(202).json({ message: 'Indexing process started in the background.' });

    try {
        // Set the lock
        indexingInProgress.add(pdir_fid);
        const startedAt = Date.now();
        let totalFiles = 0;
        let totalPages = 0;
        console.log(`[Lock Acquired] Starting background indexing for folder: ${pdir_fid}`);
        
        let page = 1;
        let hasMore = true;
        while (hasMore) {
            const apiResult = await getCachedQuarkFiles(pdir_fid, cookie, page, 'file_name:asc');
            if (apiResult.status !== 200 || !apiResult.data || !apiResult.data.list) {
                hasMore = false;
                break;
            }
            
            const files = apiResult.data.list;
            if (files.length > 0) {
                // Use the new, safer caching function
                await cacheFilesToDb(files);
                
                // Add files to FlexSearch index
                const index = await getMountedIndex();
                for (const file of files) {
                    await index.add(file.fid, file.file_name);
                }
                totalFiles += files.length;
                totalPages += 1;
                console.log(`Indexed page ${page} for folder ${pdir_fid} with ${files.length} files.`);
            }
            
            hasMore = files.length === 50;
            page++;
        }
        const durationMs = Date.now() - startedAt;
        console.log(`[Index Summary] folder=${pdir_fid} pages=${totalPages} files=${totalFiles} duration_ms=${durationMs}`);
    } catch (error) {
        console.error(`Error during background indexing for folder ${pdir_fid}:`, error);
    } finally {
        // Always release the locks
        indexingInProgress.delete(pdir_fid);
        console.log(`[Lock Released] Indexing lock removed for folder: ${pdir_fid}`);
        if (dbLockAcquired) {
            try {
                await prisma.$queryRaw`select pg_advisory_unlock(hashtext(${pdir_fid}))`;
            } catch (e) {
                console.error('Failed to release advisory lock:', e);
            }
        }
    }
}

