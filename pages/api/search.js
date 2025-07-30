import prisma from '../../utils/prisma';
import { getMountedIndex } from '../../utils/flexsearch';

export default async function handler(req, res) {
    const { pdir_fid, query } = req.query;

    if (!pdir_fid || !query) {
        return res.status(400).json({ error: 'pdir_fid and query parameters are required.' });
    }

    try {
        const index = await getMountedIndex();
        const searchResults = await index.search(query, { limit: 100 });

        if (!searchResults || searchResults.length === 0) {
            return res.status(200).json({
                status: 200,
                message: 'OK',
                data: {
                    list: [],
                    total: 0,
                },
            });
        }

        const files = await prisma.file.findMany({
            where: {
                pdir_fid: pdir_fid,
                fid: {
                    in: searchResults,
                },
            },
        });

        res.status(200).json({
            status: 200,
            message: 'OK',
            data: {
                list: files.map(file => ({ ...file, size: file.size.toString() })),
                total: files.length,
            },
        });

    } catch (error) {
        console.error('Search API error:', error);
        res.status(500).json({
            error: 'An unexpected server error occurred during search.',
            details: error.message,
        });
    }
}
