package handler

import (
	"fmt"
	"net/http"
	"os"
	"quark-go/pkg/indexer"
	"quark-go/pkg/quark"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	cookie := os.Getenv("QUARK_COOKIE")
	if cookie == "" {
		http.Error(w, "Server misconfiguration: QUARK_COOKIE is not set.", http.StatusInternalServerError)
		return
	}

	rootFid := os.Getenv("QUARK_ROOT_FID")
	// If QUARK_ROOT_FID is not set, try to find the "游戏分享" folder.
	if rootFid == "" {
		// The top-level directory in Quark has a fixed fid "0".
		foundFid, err := quark.FindFolderFidByName("0", "游戏分享", cookie)
		if err != nil {
			// We don't return an HTTP error here because this runs in the background.
			// Instead, we log the error to the console.
			fmt.Printf("Cron job failed: Could not automatically find '游戏分享' folder. Please set QUARK_ROOT_FID. Error: %v\n", err)
			return
		}
		rootFid = foundFid
	}

	go indexer.ReIndex(rootFid, cookie)

	fmt.Fprintf(w, "<h1>Re-indexing started in background!</h1>")
}
