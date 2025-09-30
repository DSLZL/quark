// 通用：基于 Prisma 收集某个目录的整棵子树（含自身）
// 采用批量广度优先策略，减少往返与锁竞争
export async function collectFolderSubtree(prisma, rootFid) {
  const folderSet = new Set([rootFid]);
  const queue = [rootFid];
  const BATCH = 50;

  while (queue.length > 0) {
    const batch = queue.splice(0, BATCH);
    // 仅查询目录结点，避免无谓扫描
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

  return folderSet;
}

