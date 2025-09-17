import prisma from '../../utils/prisma';

export default async function handler(req, res) {
    const { pdir_fid, query } = req.query;

    if (!pdir_fid || !query) {
        return res.status(400).json({ error: 'pdir_fid and query parameters are required.' });
    }

    try {
        const take = 10;
        const results = [];
        const seen = new Set();

        // 收集当前目录的整棵子树（含自身）
        const folderSet = new Set([pdir_fid]);
        const queue = [pdir_fid];
        while (queue.length > 0) {
            const batch = queue.splice(0, 50);
            const childrenDirs = await prisma.file.findMany({
                where: { pdir_fid: { in: batch }, dir: true },
                select: { fid: true },
            });
            for (const dir of childrenDirs) {
                if (!folderSet.has(dir.fid)) {
                    folderSet.add(dir.fid);
                    queue.push(dir.fid);
                }
            }
        }

        // 1) 前缀优先（通常对用户更友好，且数据库更易优化）
        if (query.length >= 1) {
            const prefix = await prisma.file.findMany({
                where: {
                    pdir_fid: { in: Array.from(folderSet) },
                    file_name: {
                        startsWith: query,
                        mode: 'insensitive',
                    },
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
                    file_name: {
                        contains: query,
                        mode: 'insensitive',
                    },
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

        res.status(200).json(results);

    } catch (error) {
        console.error('Suggestion API error:', error);
        res.status(500).json({
            error: 'An unexpected server error occurred during suggestion fetching.',
            details: error.message,
        });
    }
}
