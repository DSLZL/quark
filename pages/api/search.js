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
            orderBy: {
                file_name: 'asc',
            },
            take: 100,
        });

        res.status(200).json({
            status: 200,
            message: 'OK',
            data: {
                list: results.map(file => ({ ...file, size: file.size.toString() })),
                total: results.length,
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
