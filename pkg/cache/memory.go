package cache

import (
	"time"

	"github.com/patrickmn/go-cache"
)

var (
	// Create a cache with a default expiration time of 5 minutes, and which
	// purges expired items every 10 minutes
	c = cache.New(5*time.Minute, 10*time.Minute)
)

func Get(key string) (interface{}, bool) {
	return c.Get(key)
}

func Set(key string, value interface{}) {
	c.Set(key, value, cache.DefaultExpiration)
}
