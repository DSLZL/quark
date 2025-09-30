import { getCachedQuarkFiles } from '../../utils/quark-api';
import { cacheFilesToDb } from '../../utils/db-cache';
import { getMountedIndex } from '../../utils/flexsearch';
import prisma from '../../utils/prisma';
import { withApiHandler, BadRequestError } from '../../utils/api-handler';

// In-memory lock to prevent concurrent indexing for the same folder.
// This is a simple solution for a serverless environment. A more robust
// solution for stateful servers might use a Redis lock or similar.
const indexingInProgress = new Set();

export default withApiHandler(async function handler(req, res) {
    const { pdir_fid } = req.query;
    const cookie = process.env.QUARK_COOKIE;

    if (!pdir_fid || !cookie) {
        throw new BadRequestError('pdir_fid and cookie are required.');
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
        let totalFolders = 0;
        console.log(`[Lock Acquired] Starting recursive indexing for folder: ${pdir_fid}`);

        // 预先获取索引实例，避免循环中重复创建
        const index = await getMountedIndex();

        // 广度优先遍历整个目录树
        const queue = [pdir_fid];
        const visited = new Set();
        while (queue.length > 0) {
            const currentFolder = queue.shift();
            if (visited.has(currentFolder)) continue;
            visited.add(currentFolder);
            totalFolders += 1;

            let page = 1;
            let hasMore = true;
            while (hasMore) {
                const apiResult = await getCachedQuarkFiles(currentFolder, cookie, page, 'file_name:asc');
                if (apiResult.status !== 200 || !apiResult.data || !apiResult.data.list) {
                    hasMore = false;
                    break;
                }

                const files = apiResult.data.list;
                if (files.length > 0) {
                    // 缓存到数据库
                    await cacheFilesToDb(files);

                    // 添加到搜索索引；目录也加入以支持目录搜索
                    for (const file of files) {
                        await index.add(file.fid, file.file_name);
                        if (file.dir === true) {
                            // 子目录入队以递归处理
                            queue.push(file.fid);
                        }
                    }
                    totalFiles += files.length;
                    totalPages += 1;
                    console.log(`Indexed page ${page} for folder ${currentFolder} with ${files.length} items.`);
                }

                hasMore = files.length === 50;
                page += 1;
            }
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
});
