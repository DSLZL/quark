-- Add composite indexes to optimize common queries (listing, suggestions)
CREATE INDEX IF NOT EXISTS "File_pdir_fid_dir_idx" ON "File"("pdir_fid", "dir");
CREATE INDEX IF NOT EXISTS "File_pdir_fid_updated_at_idx" ON "File"("pdir_fid", "updated_at");
CREATE INDEX IF NOT EXISTS "File_pdir_fid_file_name_idx" ON "File"("pdir_fid", "file_name");

