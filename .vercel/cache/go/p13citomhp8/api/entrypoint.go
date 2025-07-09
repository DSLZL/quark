package main

import (
	"embed"
	"html/template"
	"net/http"
)

//go:embed templates/index.html
var content embed.FS

func IndexHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFS(content, "templates/index.html")
	if err != nil {
		http.Error(w, "failed to parse template: "+err.Error(), http.StatusInternalServerError)
		return
	}

	err = tmpl.Execute(w, nil)
	if err != nil {
		http.Error(w, "failed to execute template: "+err.Error(), http.StatusInternalServerError)
	}
}
