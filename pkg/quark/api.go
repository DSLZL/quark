package quark

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"quark-go/pkg/types"
)

const (
	userAgent   = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
	apiPageSize = 200
)

func FetchFiles(pdirFid, cookie, page, sort string) (*types.QuarkResponse, error) {
	queryParams := url.Values{}
	queryParams.Set("pr", "ucpro")
	queryParams.Set("fr", "pc")
	queryParams.Set("uc_param_str", "")
	queryParams.Set("pdir_fid", pdirFid)
	queryParams.Set("_page", page)
	queryParams.Set("_size", fmt.Sprintf("%d", apiPageSize))
	queryParams.Set("_fetch_total", "1")
	queryParams.Set("_fetch_sub_dirs", "0")
	queryParams.Set("_sort", fmt.Sprintf("file_type:asc,%s", sort))

	apiURL := "https://drive-pc.quark.cn/1/clouddrive/file/sort?" + queryParams.Encode()

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Referer", "https://pan.quark.cn/")
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Cookie", cookie)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var quarkResp types.QuarkResponse
	if err := json.Unmarshal(body, &quarkResp); err != nil {
		return nil, err
	}

	return &quarkResp, nil
}

// FindFolderFidByName searches for a folder with a specific name within a parent directory.
func FindFolderFidByName(parentFid, folderName, cookie string) (string, error) {
	page := 1
	for {
		// We use a simplified sort here as we only need the file name.
		resp, err := FetchFiles(parentFid, cookie, fmt.Sprintf("%d", page), "file_name:asc")
		if err != nil {
			return "", fmt.Errorf("error fetching files for pdir_fid %s: %w", parentFid, err)
		}

		if resp.Status != 200 {
			return "", fmt.Errorf("quark API returned an error: %s", resp.Message)
		}

		for _, file := range resp.Data.List {
			if file.Dir && file.FileName == folderName {
				return file.Fid, nil
			}
		}

		// If the number of returned files is less than the page size,
		// it means we have reached the last page.
		if len(resp.Data.List) < apiPageSize {
			break
		}

		page++
	}

	return "", fmt.Errorf("folder '%s' not found in parent directory '%s'", folderName, parentFid)
}
