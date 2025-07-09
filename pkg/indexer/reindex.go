package indexer

import (
	"fmt"
	"quark-go/pkg/db"
	"quark-go/pkg/quark"
)

func ReIndex(pdirFid, cookie string) {
	page := 1
	for {
		resp, err := quark.FetchFiles(pdirFid, cookie, fmt.Sprintf("%d", page), "file_name:asc")
		if err != nil {
			fmt.Printf("Error fetching files for pdir_fid %s: %v\n", pdirFid, err)
			return
		}

		if resp.Status != 200 || len(resp.Data.List) == 0 {
			break
		}

		db.CacheFiles(resp.Data.List)

		for _, file := range resp.Data.List {
			if file.Dir {
				ReIndex(file.Fid, cookie)
			}
		}

		if len(resp.Data.List) < 200 {
			break
		}

		page++
	}
}
