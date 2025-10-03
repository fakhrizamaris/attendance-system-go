// FILE: pkg/utils/exif.go
package utils

import (
	"os"
	"time"

	"github.com/rwcarlsen/goexif/exif"
)

func ExtractExifGPS(filePath string) (*float64, *float64, *time.Time, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, nil, nil, err
	}
	defer file.Close()

	x, err := exif.Decode(file)
	if err != nil {
		return nil, nil, nil, err
	}

	lat, lon, err := x.LatLong()
	if err != nil {
		return nil, nil, nil, err
	}

	timestamp, err := x.DateTime()
	if err != nil {
		timestamp = time.Time{}
	}

	return &lat, &lon, &timestamp, nil
}