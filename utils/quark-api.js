import axios from 'axios';

// Simple in-memory cache with a TTL (Time-To-Live)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchQuarkFiles(pdir_fid, cookie, page = 1, sort = 'file_name:asc') {
    const params = new URLSearchParams({
        pr: 'ucpro',
        fr: 'pc',
        uc_param_str: '',
        pdir_fid: pdir_fid,
        _page: page,
        _size: 50,
        _fetch_total: 1,
        _fetch_sub_dirs: 0,
        _sort: `file_type:asc,${sort}`,
    });
    const url = `https://drive-pc.quark.cn/1/clouddrive/file/sort?${params.toString()}`;

    const response = await axios.get(url, {
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://pan.quark.cn/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Cookie': cookie,
        },
    });

    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
        // This is likely an HTML error page from Quark (e.g., login page)
        throw new Error('Invalid response from Quark API. The cookie might be expired or invalid.');
    }

    return response.data;
}

export async function getCachedQuarkFiles(pdir_fid, cookie, page, sort) {
    const cacheKey = `${pdir_fid}-${page}-${sort}`;
    const cachedItem = cache.get(cacheKey);

    if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_TTL)) {
        return JSON.parse(JSON.stringify(cachedItem.data));
    }

    const data = await fetchQuarkFiles(pdir_fid, cookie, page, sort);
    
    if (data.status === 200) {
        cache.set(cacheKey, {
            timestamp: Date.now(),
            data: JSON.parse(JSON.stringify(data)),
        });
    }
    
    // Clean up expired cache items occasionally
    if (Math.random() < 0.1) {
        for (const [key, value] of cache.entries()) {
            if (Date.now() - value.timestamp > CACHE_TTL) {
                cache.delete(key);
            }
        }
    }

    return data;
}
