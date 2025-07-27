import axios from 'axios';
import quarkConfig from '../../utils/config.js';

const getHeaders = (cookie) => ({
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://pan.quark.cn/',
    'User-Agent': quarkConfig.userAgent,
    'Cookie': cookie,
});

export default async function handler(req, res) {
    const { page = 1, size = 50 } = req.query;
    const cookie = process.env.QUARK_COOKIE;
    if (!cookie) {
        return res.status(500).json({ error: 'Server misconfiguration: QUARK_COOKIE is not set.' });
    }

    const url = `https://drive-pc.quark.cn/1/clouddrive/share/mypage/detail?pr=ucpro&fr=pc&uc_param_str=&_page=${page}&_size=${size}&_order_field=created_at&_order_type=desc&_fetch_total=1&_fetch_notify_follow=1`;

    try {
        const response = await axios.get(url, { headers: getHeaders(cookie) });
        const data = response.data;

        if (data.status !== 200) {
            const errorMsg = data.message === 'require login [guest]' ? 'Cookie已失效' : data.message;
            return res.status(401).json({ error: errorMsg });
        }

        if (data && data.data && data.data.list) {
            // 适配数据格式以匹配 FileList 组件的期望
            const adaptedList = data.data.list.map(item => ({
                fid: item.fid,
                file_name: item.title, // 分享的标题作为文件名
                file_type: 'folder', // 假设所有分享都是文件夹
                dir: true,
                size: item.total_size,
                updated_at: item.updated_at,
                // 添加一个特殊字段以表明这是分享项
                is_share_item: true,
                share_url: item.share_url.startsWith('http') ? item.share_url : `https://pan.quark.cn${item.share_url}`,
            }));
            res.status(200).json({ data: { list: adaptedList, total: data.metadata?._total || 0 } });
        } else {
            res.status(200).json({ data: { list: [], total: 0 } });
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        res.status(500).json({ error: `获取分享列表失败: ${errorMsg}` });
    }
}
