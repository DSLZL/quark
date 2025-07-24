package quark

import (
	"os"
)

// GetRootFid a helper function to get the root folder ID.
// It prioritizes the QUARK_ROOT_FID environment variable.
// If the environment variable is not set, it falls back to finding the "游戏分享" folder in the root directory (fid "0").
func GetRootFid(cookie string) (string, error) {
	if rootFid := os.Getenv("QUARK_ROOT_FID"); rootFid != "" {
		return rootFid, nil
	}

	// Warning: QUARK_ROOT_FID is not set. Falling back to searching for the folder, which may be slow.
	// The top-level directory in Quark has a fixed fid "0".
	foundFid, err := FindFolderFidByName("0", "游戏分享", cookie)
	if err != nil {
		return "", err
	}
	return foundFid, nil
}
