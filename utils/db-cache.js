import prisma from './prisma';

// This function is now centralized and removes the transaction wrapper
// to reduce the likelihood of database deadlocks under high concurrency.
export async function cacheFilesToDb(files) {
    if (!files || files.length === 0) {
        return;
    }

    // Execute upserts individually instead of in a single large transaction.
    // This is less atomic but greatly reduces lock contention.
    for (const file of files) {
        try {
            const data = {
                fid: file.fid,
                pdir_fid: file.pdir_fid,
                file_name: file.file_name,
                size: BigInt(file.size || 0),
                dir: file.dir === true,
                updated_at: new Date(file.updated_at || 0),
                created_at: new Date(file.created_at || 0),
            };
            await prisma.file.upsert({
                where: { fid: file.fid },
                update: data,
                create: data,
            });
        } catch (error) {
            // Log individual errors but don't stop the whole process.
            console.error(`Failed to upsert file ${file.fid}:`, error.message);
        }
    }
    console.log(`Processed caching for ${files.length} files.`);
}
