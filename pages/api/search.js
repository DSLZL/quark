import prisma from '../../utils/prisma';
import { getCachedQuarkFiles } from '../../utils/quark-api';

// This function queries the Quark API directly, fetching all pages for a comprehensive search.
const searchInApi = async (pdir_fid, cookie, query) => {
    if (!cookie) return [];
    
    let allFiles = [];
    let page = 1;
    let hasMore = true;
    // Safety break to prevent infinite loops in case of unexpected API behavior.
    const maxPages = 100; // Corresponds to 5000 files

    while (hasMore && page <= maxPages) {
        const apiResult = await getCachedQuarkFiles(pdir_fid, cookie, page, 'file_name:asc');
        if (apiResult.status !== 200 || !apiResult.data || !apiResult.data.list) {
            hasMore = false;
            break;
        }
        allFiles.push(...apiResult.data.list);
        hasMore = apiResult.data.list.length === 50;
        page++;
    }
    return allFiles.filter(file => file.file_name.toLowerCase().includes(query.toLowerCase()));
};

export default async function handler(req, res) {
    const { pdir_fid, query } = req.query;
    const cookie = process.env.QUARK_COOKIE;

    if (!pdir_fid || !query) {
        return res.status(400).json({ error: 'pdir_fid and query parameters are required.' });
    }

    try {
        // 1. Prioritize searching in the database. It's much faster.
        const dbResults = await prisma.file.findMany({
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

        // 2. If the database has results, we can trust it's reasonably up-to-date.
        if (dbResults.length > 0) {
            return res.status(200).json({
                status: 200,
                message: 'OK (from database)',
                data: {
                    list: dbResults.map(file => ({ ...file, size: file.size.toString() })),
                    total: dbResults.length,
                },
            });
        }

        // 3. If DB has no results, it might be because it's not indexed yet.
        // Fallback to a live API search.
        const apiResults = await searchInApi(pdir_fid, cookie, query);

        // 4. Return the API results. This will correctly be an empty array if nothing is found.
        return res.status(200).json({
            status: 200,
            message: 'OK (from API fallback)',
            data: {
                list: apiResults,
                total: apiResults.length,
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
