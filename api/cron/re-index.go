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

	rootFid, err := quark.GetRootFid(cookie)
	if err != nil {
		fmt.Printf("Cron job failed: Could not get root FID. Error: %v\n", err)
		return
	}

	go indexer.ReIndex(rootFid, cookie)

	fmt.Fprintf(w, "<h1>Re-indexing started in background!</h1>")
}
