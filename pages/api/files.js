import { getCachedQuarkFiles } from '../../utils/quark-api';
import { cacheFilesToDb } from '../../utils/db-cache';
import { withApiHandler, BadRequestError, UpstreamError } from '../../utils/api-handler';

export default withApiHandler(async function handler(req, res) {
  const cookie = process.env.QUARK_COOKIE;
  if (!cookie) {
    const err = new Error('Server misconfiguration: QUARK_COOKIE is not set.');
    err.status = 500;
    throw err;
  }

  const { pdir_fid, page = 1, sort = 'file_name:asc' } = req.query;

  if (!pdir_fid) {
    throw new BadRequestError('pdir_fid parameter is required.');
  }

  const data = await getCachedQuarkFiles(pdir_fid, cookie, page, sort);

  if (data.status !== 200) {
    const errorMessage = data.message === 'require login [guest]' ? 'Cookie已失效或未配置' : data.message;
    const err = new UpstreamError(`Failed to fetch data from Quark API: ${errorMessage}`);
    err.status = 502;
    throw err;
  }

  // 后台缓存当前页数据，加速后续访问
  if (data.data && data.data.list && data.data.list.length > 0) {
    cacheFilesToDb(data.data.list).catch((err) => {
      console.error('Error in background DB cache for page:', err);
    });
  }

  return data;
});
