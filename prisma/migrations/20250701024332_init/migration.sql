-- CreateTable
CREATE TABLE "File" (
    "fid" TEXT NOT NULL,
    "pdir_fid" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "dir" BOOLEAN NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("fid")
);

-- CreateIndex
CREATE INDEX "File_pdir_fid_idx" ON "File"("pdir_fid");
