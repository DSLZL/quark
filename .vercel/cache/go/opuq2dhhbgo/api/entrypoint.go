package main

import (
	"fmt"
	"html/template"
	"net/http"
	"os"
	"quark-go/pkg/cache"
	"quark-go/pkg/quark"
	"quark-go/pkg/types"
)

const indexHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quark Go</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f0f2f5; color: #1c1e21; margin: 0; }
        .container { max-width: 800px; margin: 2rem auto; padding: 2rem; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { font-size: 1.5rem; color: #0056b3; border-bottom: 2px solid #f0f2f5; padding-bottom: 0.5rem; margin-bottom: 1rem; }
        ul { list-style: none; padding: 0; }
        li { display: flex; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f0f2f5; }
        li:last-child { border-bottom: none; }
        a { text-decoration: none; color: #0d6efd; font-weight: 500; }
        a:hover { text-decoration: underline; }
        .icon { margin-right: 1rem; width: 24px; height: 24px; }
        .file-name { flex-grow: 1; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Files in: {{.CurrentDir}}</h1>
        <ul>
            {{range .Files}}
            <li>
                <span class="icon">{{if .Dir}}&#128193;{{else}}&#128196;{{end}}</span>
                <span class="file-name">
                    {{if .Dir}}
                        <a href="/?pdir_fid={{.Fid}}">{{.FileName}}</a>
                    {{else}}
                        {{.FileName}}
                    {{end}}
                </span>
            </li>
            {{end}}
        </ul>
    </div>
</body>
</html>
`

type PageData struct {
	CurrentDir string
	Files      []types.QuarkFile
}

func IndexHandler(w http.ResponseWriter, r *http.Request) {
	cookie := os.Getenv("QUARK_COOKIE")
	if cookie == "" {
		http.Error(w, "Server misconfiguration: QUARK_COOKIE is not set.", http.StatusInternalServerError)
		return
	}

	pdirFid := r.URL.Query().Get("pdir_fid")
	if pdirFid == "" {
		var err error
		pdirFid, err = quark.GetRootFid(cookie)
		if err != nil {
			http.Error(w, "Could not get root FID: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	// Use the same caching logic as in files.go
	cacheKey := fmt.Sprintf("files:%s-page:1-sort:file_name:asc", pdirFid)
	var files []types.QuarkFile
	if cachedData, found := cache.Get(cacheKey); found {
		// Directly use cached file list
		files = cachedData.([]types.QuarkFile)
	} else {
		resp, err := quark.FetchFiles(pdirFid, cookie, "1", "file_name:asc")
		if err != nil {
			http.Error(w, "Failed to fetch files from Quark API: "+err.Error(), http.StatusBadGateway)
			return
		}
		if resp.Status != 200 {
			http.Error(w, "Quark API returned an error: "+resp.Message, http.StatusBadGateway)
			return
		}
		files = resp.Data.List
		// Cache the file list directly
		cache.Set(cacheKey, files)
	}

	data := PageData{
		CurrentDir: pdirFid, // In a real app, you'd get the folder name.
		Files:      files,
	}

	tmpl, err := template.New("index").Parse(indexHTML)
	if err != nil {
		http.Error(w, "failed to parse template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	err = tmpl.Execute(w, data)
	if err != nil {
		http.Error(w, "failed to execute template: "+err.Error(), http.StatusInternalServerError)
	}
}
