import axios from 'axios';
import quarkConfig from './config.js';

const getHeaders = (cookie) => ({
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://pan.quark.cn/',
    'User-Agent': quarkConfig.userAgent,
    'Cookie': cookie,
});

async function fetchAllSharedFids(cookie) {
    const headers = getHeaders(cookie);
    const url = 'https://drive-pc.quark.cn/1/clouddrive/share/mypage/detail?pr=ucpro&fr=pc&uc_param_str=&_page=1&_size=1000&_order_field=created_at&_order_type=desc&_fetch_total=1&_fetch_notify_follow=1';

    try {
        const response = await axios.get(url, { headers });
        const data = response.data;
        if (data && data.data && data.data.list) {
            // 提取所有分享项的 fid，并放入一个 Set 中以便快速查找
            const fids = new Set(data.data.list.map(item => item.fid));
            return fids;
        }
        return new Set();
    } catch (error) {
        if (quarkConfig.enableDebugLogging) {
            const errorMsg = error.response?.data?.message || error.message;
            console.error(`Failed to fetch all shared fids: ${errorMsg}`);
        }
        return new Set();
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

    const [response, sharedFids] = await Promise.all([
        axios.get(url, { headers: getHeaders(cookie) }),
        quarkConfig.enableShareDetection ? fetchAllSharedFids(cookie) : Promise.resolve(new Set())
    ]);

    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from Quark API. The cookie might be expired or invalid.');
    }

    if (!response.data || !response.data.data || !response.data.data.list) {
        return response.data;
    }

    let fileList = response.data.data.list;

    if (quarkConfig.enableShareDetection) {
        fileList = fileList.map(file => {
            if (file.dir) {
                return { ...file, is_shared: sharedFids.has(file.fid) };
            }
            return file;
        });
    }

    response.data.data.list = fileList;
    return response.data;
}
