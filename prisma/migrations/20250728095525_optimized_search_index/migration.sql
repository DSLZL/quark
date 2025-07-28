-- CreateIndex
CREATE INDEX "File_file_name_idx" ON "File" USING GIST ("file_name" gist_trgm_ops);
