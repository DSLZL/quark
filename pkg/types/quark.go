package types

type QuarkFile struct {
	Fid       string `json:"fid"`
	PdirFid   string `json:"pdir_fid"`
	FileName  string `json:"file_name"`
	Size      int64  `json:"size"`
	Dir       bool   `json:"dir"`
	UpdatedAt int64  `json:"updated_at"`
	CreatedAt int64  `json:"created_at"`
	IsShared  bool   `json:"is_shared,omitempty"`
}

type QuarkResponseData struct {
	List  []QuarkFile `json:"list"`
	Total int         `json:"total"`
}

type QuarkResponse struct {
	Status  int               `json:"status"`
	Message string            `json:"message"`
	Data    QuarkResponseData `json:"data"`
}
