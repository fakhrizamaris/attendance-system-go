// attendance-backend/internal/handlers/location_handler.go
package handlers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/gin-gonic/gin"
)

type LocationHandler struct {
	GoogleAPIKey string
}

func (h *LocationHandler) ReverseGeocode(c *gin.Context) {
	lat := c.Query("lat")
	lon := c.Query("lon")

	if lat == "" || lon == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lat and lon are required"})
		return
	}

	url := fmt.Sprintf("https://maps.googleapis.com/maps/api/geocode/json?latlng=%s,%s&language=id&key=%s", lat, lon, h.GoogleAPIKey)

	resp, err := http.Get(url)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghubungi Google Maps API"})
		return
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(body, &result)

	// Kirim kembali hasil dari Google ke frontend
	c.JSON(http.StatusOK, result)
}