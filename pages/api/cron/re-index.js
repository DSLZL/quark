import prisma from '../../../utils/prisma';

// Helper function to introduce a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
    // 简单的 Bearer 鉴权，防止被外部滥用
    const auth = req.headers['authorization'];
    if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).end('Unauthorized');
    }

    try {
        console.log('Cron job started: Re-indexing all tracked folders.');

        // 1. Find all unique folder IDs (pdir_fid) that have been indexed.
        const distinctFolders = await prisma.file.findMany({
            select: {
                pdir_fid: true,
            },
            distinct: ['pdir_fid'],
        });

        const folderIds = distinctFolders.map(f => f.pdir_fid);
        console.log(`Found ${folderIds.length} unique folders to re-index.`);

        // 2. For each folder, trigger the background indexer.
        for (const pdir_fid of folderIds) {
            const indexerUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/api/indexer?pdir_fid=${pdir_fid}`;
            
            console.log(`Triggering re-indexing for folder: ${pdir_fid}`);
            // We don't await this, we just fire and forget.
            fetch(indexerUrl).catch(err => {
                console.error(`Failed to trigger background indexer for ${pdir_fid}:`, err);
            });

            // Add a small delay to avoid overwhelming the API or the Quark server
            await delay(500); // 0.5 second delay between each trigger
        }

        res.status(200).json({ message: `Successfully triggered re-indexing for ${folderIds.length} folders.` });

    } catch (error) {
        console.error('Cron job failed:', error);
        res.status(500).json({ error: 'Cron job execution failed.', details: error.message });
    }
}
