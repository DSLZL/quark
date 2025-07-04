import { getCachedQuarkFiles } from '../../utils/quark-api';
import { cacheFilesToDb } from '../../utils/db-cache';

export default async function handler(req, res) {
    const cookie = process.env.QUARK_COOKIE;
    if (!cookie) {
        return res.status(500).json({ error: 'Server misconfiguration: QUARK_COOKIE is not set.' });
    }

    const { pdir_fid, page = 1, sort = 'file_name:asc' } = req.query;

    if (!pdir_fid) {
        return res.status(400).json({ error: 'pdir_fid parameter is required.' });
    }

    try {
        const data = await getCachedQuarkFiles(pdir_fid, cookie, page, sort);
        
        if (data.status !== 200) {
            const errorMessage = data.message === 'require login [guest]' ? 'Cookie已失效' : data.message;
            return res.status(502).json({ error: 'Failed to fetch data from Quark API.', details: errorMessage });
        }
        
        // We are now triggering the indexer from the frontend.
        // This endpoint is only responsible for serving file pages.
        // We can still cache the page we fetched to speed up initial view.
        if (data.data && data.data.list && data.data.list.length > 0) {
            cacheFilesToDb(data.data.list).catch(err => {
                console.error("Error in background DB cache for page:", err);
            });
        }
        
        res.status(200).json(data);

    } catch (error) {
        console.error('API route error:', error);
        res.status(500).json({ 
            error: 'An unexpected server error occurred.', 
            details: error.message,
        });
    }
}
