import axios from 'axios';
import quarkConfig from './config.js';

const getHeaders = (cookie) => ({
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://pan.quark.cn/',
    'User-Agent': quarkConfig.userAgent,
    'Cookie': cookie,
});

async function checkShareStatus(fid, cookie) {
    const headers = getHeaders(cookie);
    const url = `https://drive-pc.quark.cn/1/clouddrive/share/list?pr=ucpro&fr=pc&uc_param_str=&pdir_fid=${fid}&_size=1&_page=1`;

    try {
        const response = await axios.get(url, { headers });
        const data = response.data;
        // If the request is successful and returns a list, check if it's non-empty.
        // A non-empty list in the 'list' directory implies it's shared.
        return data && data.data && data.data.list && data.data.list.length > 0;
    } catch (error) {
        if (quarkConfig.enableDebugLogging) {
            const errorMsg = error.response?.data?.message || error.message;
            console.error(`Failed to check share status for fid ${fid}: ${errorMsg}`);
        }
        // In case of any error, assume the folder is not shared.
        return false;
    }
}

export async function fetchQuarkFiles(pdir_fid, cookie, page = 1, sort = 'file_name:asc') {
    const queryParams = {
        pr: 'ucpro',
        fr: 'pc',
        uc_param_str: '',
        pdir_fid: pdir_fid,
        _page: page,
        _size: quarkConfig.apiPageSize,
        _fetch_total: 1,
        _fetch_sub_dirs: 0,
    };

    if (quarkConfig.enableSorting) {
        queryParams._sort = `file_type:asc,${sort}`;
    }

    const params = new URLSearchParams(queryParams);
    const url = `https://drive-pc.quark.cn/1/clouddrive/file/sort?${params.toString()}`;

    const response = await axios.get(url, {
        headers: getHeaders(cookie),
    });

    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
        // This is likely an HTML error page from Quark (e.g., login page)
        throw new Error('Invalid response from Quark API. The cookie might be expired or invalid.');
    }

    if (!response.data || !response.data.data || !response.data.data.list) {
        // 如果响应中没有文件列表，直接返回原始数据
        return response.data;
    }

    let fileList = response.data.data.list;

    if (quarkConfig.enableShareDetection) {
        const folders = fileList.filter(file => file.dir);
        const shareStatusPromises = folders.map(folder => checkShareStatus(folder.fid, cookie));
        const shareStatuses = await Promise.all(shareStatusPromises);
        
        const shareStatusMap = new Map(folders.map((folder, index) => [folder.fid, shareStatuses[index]]));

        fileList = fileList.map(file => {
            if (file.dir) {
                return { ...file, is_shared: shareStatusMap.get(file.fid) || false };
            }
            return file;
        });
    }

    response.data.data.list = fileList;
    return response.data;
}
