import prisma from '../../utils/prisma';
import { getMountedIndex } from '../../utils/flexsearch';
import { collectFolderSubtree } from '../../utils/subtree';
import { withApiHandler, BadRequestError } from '../../utils/api-handler';

export default withApiHandler(async function handler(req, res) {
  const { pdir_fid, query, type = 'mixed' } = req.query;

  if (!pdir_fid || !query) {
    throw new BadRequestError('pdir_fid and query parameters are required.');
  }

  const index = await getMountedIndex();
  const searchResults = await index.search(query, { limit: 100 });

  if (!searchResults || searchResults.length === 0) {
    return {
      status: 200,
      message: 'OK',
      data: { list: [], total: 0 },
    };
  }

  // 使用通用子树收集工具
  const folderSet = await collectFolderSubtree(prisma, pdir_fid);

  const whereClause = {
    pdir_fid: { in: Array.from(folderSet) },
    fid: { in: searchResults },
  };

  if (type === 'folder') whereClause.dir = true;
  else if (type === 'file') whereClause.dir = false;

  const files = await prisma.file.findMany({ where: whereClause });

  // 保持与 FlexSearch 相关性顺序一致
  const orderMap = new Map(searchResults.map((id, idx) => [id, idx]));
  files.sort((a, b) => (orderMap.get(a.fid) ?? 0) - (orderMap.get(b.fid) ?? 0));

  return {
    status: 200,
    message: 'OK',
    data: {
      list: files.map((file) => ({ ...file, size: file.size.toString() })),
      total: files.length,
    },
  };
});
