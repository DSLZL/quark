import prisma from '../../utils/prisma';
import { getMountedIndex } from '../../utils/flexsearch';

export default async function handler(req, res) {
    const { pdir_fid, query, type = 'mixed' } = req.query;

    if (!pdir_fid || !query) {
        return res.status(400).json({ error: 'pdir_fid and query parameters are required.' });
    }

    try {
        const index = await getMountedIndex();
        const searchResults = await index.search(query, { limit: 100 });

        if (!searchResults || searchResults.length === 0) {
            return res.status(200).json({
                status: 200,
                message: 'OK',
                data: {
                    list: [],
                    total: 0,
                },
            });
        }

        // 收集当前分享文件夹的全部子目录（含自身），用于在数据库中过滤整棵子树
        const folderSet = new Set([pdir_fid]);
        const queue = [pdir_fid];
        // 批量广度优先，利用 Prisma 的 IN 查询一次扩展多个父目录
        while (queue.length > 0) {
            const batch = queue.splice(0, 50);
            const childrenDirs = await prisma.file.findMany({
                where: {
                    pdir_fid: { in: batch },
                    dir: true,
                },
                select: { fid: true },
            });
            for (const dir of childrenDirs) {
                if (!folderSet.has(dir.fid)) {
                    folderSet.add(dir.fid);
                    queue.push(dir.fid);
                }
            }
        }

        const whereClause = {
            pdir_fid: { in: Array.from(folderSet) },
            fid: { in: searchResults },
        };

        if (type === 'folder') {
            whereClause.dir = true;
        } else if (type === 'file') {
            whereClause.dir = false;
        }
        // 'mixed' doesn't need an explicit 'dir' condition

        const files = await prisma.file.findMany({
            where: whereClause,
        });

        // 保持与 FlexSearch 返回的相关性顺序一致
        const orderMap = new Map(searchResults.map((id, idx) => [id, idx]));
        files.sort((a, b) => (orderMap.get(a.fid) ?? 0) - (orderMap.get(b.fid) ?? 0));

        res.status(200).json({
            status: 200,
            message: 'OK',
            data: {
                list: files.map(file => ({ ...file, size: file.size.toString() })),
                total: files.length,
            },
        });

    } catch (error) {
        console.error('Search API error:', error);
        res.status(500).json({
            error: 'An unexpected server error occurred during search.',
            details: error.message,
        });
    }
}
