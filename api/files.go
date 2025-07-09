package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"quark-go/pkg/cache"
	"quark-go/pkg/db"
	"quark-go/pkg/quark"
)

func FilesHandler(w http.ResponseWriter, r *http.Request) {
	cookie := os.Getenv("QUARK_COOKIE")
	if cookie == "" {
		http.Error(w, "Server misconfiguration: QUARK_COOKIE is not set.", http.StatusInternalServerError)
		return
	}

	query := r.URL.Query()
	pdirFid := query.Get("pdir_fid")
	if pdirFid == "" {
		http.Error(w, "pdir_fid parameter is required.", http.StatusBadRequest)
		return
	}

	page := query.Get("page")
	if page == "" {
		page = "1"
	}

	sort := query.Get("sort")
	if sort == "" {
		sort = "file_name:asc"
	}

	cacheKey := fmt.Sprintf("files:%s-page:%s-sort:%s", pdirFid, page, sort)
	if cachedData, found := cache.Get(cacheKey); found {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(cachedData)
		return
	}

	data, err := quark.FetchFiles(pdirFid, cookie, page, sort)
	if err != nil {
		http.Error(w, "Failed to fetch data from Quark API.", http.StatusBadGateway)
		return
	}

	if data.Status == 200 {
		if len(data.Data.List) > 0 {
			go db.CacheFiles(data.Data.List)
		}
		cache.Set(cacheKey, data)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}
