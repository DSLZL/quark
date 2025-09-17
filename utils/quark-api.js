import axios from 'axios';

// 简单的内存缓存（TTL + LRU 容量上限）
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 200;   // LRU 容量上限

function evictLRUIfNeeded() {
    while (cache.size > MAX_CACHE_ENTRIES) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
    }
}

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
        evictLRUIfNeeded();
    }
    
    // 轻量过期清理（非关键路径）
    for (const [key, value] of cache) {
        if (Date.now() - value.timestamp > CACHE_TTL) {
            cache.delete(key);
        } else {
            break; // Map 为插入有序，遇到未过期即可提前退出
        }
    }

    return data;
}
