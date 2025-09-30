import prisma from '../../utils/prisma';
import { collectFolderSubtree } from '../../utils/subtree';
import { withApiHandler, BadRequestError } from '../../utils/api-handler';

export default withApiHandler(async function handler(req, res) {
  const { pdir_fid, query } = req.query;

  if (!pdir_fid || !query) {
    throw new BadRequestError('pdir_fid and query parameters are required.');
  }

  const take = 10;
  const results = [];
  const seen = new Set();

  // 使用通用子树收集工具
  const folderSet = await collectFolderSubtree(prisma, pdir_fid);

  // 1) 前缀优先（通常对用户更友好，且数据库更易优化）
  if (query.length >= 1) {
    const prefix = await prisma.file.findMany({
      where: {
        pdir_fid: { in: Array.from(folderSet) },
        file_name: { startsWith: query, mode: 'insensitive' },
      },
      select: { fid: true, file_name: true },
      orderBy: { file_name: 'asc' },
      take,
    });
    for (const r of prefix) {
      if (!seen.has(r.fid)) {
        results.push(r);
        seen.add(r.fid);
      }
    }
  }

  // 2) 若不足，再使用包含匹配补齐
  if (results.length < take) {
    const remain = take - results.length;
    const contain = await prisma.file.findMany({
      where: {
        pdir_fid: { in: Array.from(folderSet) },
        file_name: { contains: query, mode: 'insensitive' },
        fid: { notIn: Array.from(seen) },
      },
      select: { fid: true, file_name: true },
      orderBy: { file_name: 'asc' },
      take: remain,
    });
    for (const r of contain) {
      if (!seen.has(r.fid)) {
        results.push(r);
        seen.add(r.fid);
      }
    }
  }

  return results;
});
