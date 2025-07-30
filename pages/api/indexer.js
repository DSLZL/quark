import { getCachedQuarkFiles } from '../../utils/quark-api';
import { cacheFilesToDb } from '../../utils/db-cache';
import { getMountedIndex } from '../../utils/flexsearch';

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

    // Check if indexing is already in progress for this folder
    if (indexingInProgress.has(pdir_fid)) {
        return res.status(202).json({ message: `Indexing already in progress for folder ${pdir_fid}. Request ignored.` });
    }

    // Respond immediately to the client that the process has started
    res.status(202).json({ message: 'Indexing process started in the background.' });

    try {
        // Set the lock
        indexingInProgress.add(pdir_fid);
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
                console.log(`Added ${files.length} files to FlexSearch index for folder ${pdir_fid}.`);

                console.log(`Indexed page ${page} for folder ${pdir_fid} with ${files.length} files.`);
            }
            
            hasMore = files.length === 50;
            page++;
        }
        console.log(`Finished background indexing for folder: ${pdir_fid}`);
    } catch (error) {
        console.error(`Error during background indexing for folder ${pdir_fid}:`, error);
    } finally {
        // Always release the lock
        indexingInProgress.delete(pdir_fid);
        console.log(`[Lock Released] Indexing lock removed for folder: ${pdir_fid}`);
    }
}
