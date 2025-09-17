-- 确保安装 trigram 扩展（影子库同样需要）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex：基于 trigram 的 GiST 索引（若后续迁移删除，此处仍需成功创建以通过影子库校验）
CREATE INDEX "File_file_name_idx" ON "File" USING GIST ("file_name" gist_trgm_ops);
