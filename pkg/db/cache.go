package db

import (
	"context"
	"fmt"
	"os"
	"quark-go/pkg/types"
	"time"

	"github.com/jackc/pgx/v4"
)

func CacheFiles(files []types.QuarkFile) error {
	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		return err
	}
	defer conn.Close(context.Background())

	for _, file := range files {
		updatedAt := time.Unix(file.UpdatedAt, 0)
		createdAt := time.Unix(file.CreatedAt, 0)

		query := `
			INSERT INTO "File" (fid, pdir_fid, file_name, size, dir, updated_at, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (fid) DO UPDATE SET
				pdir_fid = $2,
				file_name = $3,
				size = $4,
				dir = $5,
				updated_at = $6,
				created_at = $7;
		`
		_, err := conn.Exec(context.Background(), query, file.Fid, file.PdirFid, file.FileName, file.Size, file.Dir, updatedAt, createdAt)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Failed to upsert file %s: %v\n", file.Fid, err)
		}
	}

	return nil
}
