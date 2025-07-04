import prisma from '../../utils/prisma';

export default async function handler(req, res) {
    const { pdir_fid, query } = req.query;

    if (!pdir_fid || !query) {
        return res.status(400).json({ error: 'pdir_fid and query parameters are required.' });
    }

    try {
        const results = await prisma.file.findMany({
            where: {
                pdir_fid: pdir_fid,
                file_name: {
                    contains: query,
                    mode: 'insensitive',
                },
            },
            select: {
                fid: true,
                file_name: true,
            },
            orderBy: {
                _relevance: {
                    fields: ['file_name'],
                    search: query,
                    sort: 'asc',
                }
            },
            take: 10,
        });

        res.status(200).json(results);

    } catch (error) {
        console.error('Suggestion API error:', error);
        res.status(500).json({
            error: 'An unexpected server error occurred during suggestion fetching.',
            details: error.message,
        });
    }
}
