import cache from './cache';
import { fetchQuarkFiles } from './quark-helpers';

export async function getCachedQuarkFiles(pdir_fid, cookie, page, sort) {
    const cacheKey = `files:${pdir_fid}-page:${page}-sort:${sort}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
        return structuredClone(cachedData);
    }

    const data = await fetchQuarkFiles(pdir_fid, cookie, page, sort);
    
    if (data?.status === 200) {
        cache.set(cacheKey, structuredClone(data));
    }
    
    // Clean up expired cache items occasionally
    if (Math.random() < 0.1) { // 10% chance to run cleanup
        cache.cleanup();
    }

    return data;
}
