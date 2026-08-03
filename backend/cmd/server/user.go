package server

import (
	"database/sql"
	"fmt"
	"io"
	"mime"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"neon-blog/middleware"
)

const maxAvatarSize = 5 << 20

type UserHandler struct {
	DB    *sql.DB
	MinIO *middleware.MinIO
}

func (h UserHandler) Register(r *gin.Engine) {
	r.PUT("/api/users/:uuid", h.update)
	r.POST("/api/users/:uuid/avatar", h.uploadAvatar)
	r.DELETE("/api/users/:uuid", h.delete)
	r.GET("/api/uploads/*objectPath", h.serveUpload)
}

func (h UserHandler) update(c *gin.Context) {
	var x struct {
		Nickname string `json:"nickname"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if c.BindJSON(&x) != nil || x.Nickname == "" || x.Email == "" {
		c.JSON(400, gin.H{"error": "昵称和邮箱不能为空"})
		return
	}
	id := c.Param("uuid")
	var err error
	if x.Password != "" {
		_, err = h.DB.Exec("UPDATE users SET nickname=?, email=?, password=? WHERE id=?", x.Nickname, x.Email, x.Password, id)
	} else {
		_, err = h.DB.Exec("UPDATE users SET nickname=?, email=? WHERE id=?", x.Nickname, x.Email, id)
	}
	if err != nil {
		c.JSON(409, gin.H{"error": "邮箱已被使用或用户不存在"})
		return
	}
	c.JSON(200, gin.H{"id": id, "nickname": x.Nickname, "email": x.Email})
}

func (h UserHandler) uploadAvatar(c *gin.Context) {
	if h.MinIO == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "图片存储服务未启动"})
		return
	}

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxAvatarSize+(1<<20))
	fileHeader, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请选择不超过 5MB 的图片"})
		return
	}
	if fileHeader.Size > maxAvatarSize {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "头像不能超过 5MB"})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无法读取图片"})
		return
	}
	defer file.Close()

	header := make([]byte, 512)
	readSize, err := file.Read(header)
	if err != nil && err != io.EOF {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无法读取图片"})
		return
	}
	contentType := http.DetectContentType(header[:readSize])
	if !allowedImageType(contentType) {
		c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "仅支持 JPG、PNG、GIF 或 WebP 图片"})
		return
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "处理图片失败"})
		return
	}

	extension := extensionFor(contentType)
	objectName := fmt.Sprintf("users/%s/%d%s", c.Param("uuid"), time.Now().UnixNano(), extension)
	imageURL, err := h.MinIO.Upload(c.Request.Context(), objectName, file, fileHeader.Size, contentType)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "上传头像失败，请确认 MinIO 已启动"})
		return
	}

	var oldImage string
	err = h.DB.QueryRow("SELECT COALESCE(img, '') FROM users WHERE id=?", c.Param("uuid")).Scan(&oldImage)
	if err == sql.ErrNoRows {
		_ = h.MinIO.Delete(c.Request.Context(), objectName)
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}
	if err != nil {
		_ = h.MinIO.Delete(c.Request.Context(), objectName)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "读取用户失败"})
		return
	}
	if _, err = h.DB.Exec("UPDATE users SET img=? WHERE id=?", imageURL, c.Param("uuid")); err != nil {
		_ = h.MinIO.Delete(c.Request.Context(), objectName)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存头像失败"})
		return
	}

	if oldObject := h.MinIO.ObjectNameFromURL(oldImage); oldObject != "" {
		_ = h.MinIO.Delete(c.Request.Context(), oldObject)
	}
	c.JSON(http.StatusOK, gin.H{"img": imageURL})
}

func (h UserHandler) serveUpload(c *gin.Context) {
	if h.MinIO == nil {
		c.Status(http.StatusServiceUnavailable)
		return
	}
	objectName := strings.TrimPrefix(c.Param("objectPath"), "/")
	if objectName == "" || strings.Contains(objectName, "..") {
		c.Status(http.StatusBadRequest)
		return
	}
	object, info, err := h.MinIO.Get(c.Request.Context(), objectName)
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}
	defer object.Close()
	c.Header("Cache-Control", "public, max-age=86400")
	c.DataFromReader(http.StatusOK, info.Size, info.ContentType, object, nil)
}

func allowedImageType(contentType string) bool {
	switch contentType {
	case "image/jpeg", "image/png", "image/gif", "image/webp":
		return true
	default:
		return false
	}
}

func extensionFor(contentType string) string {
	if extensions, err := mime.ExtensionsByType(contentType); err == nil && len(extensions) > 0 {
		return extensions[0]
	}
	return ".img"
}

func (h UserHandler) delete(c *gin.Context) {
	res, err := h.DB.Exec("DELETE FROM users WHERE id=?", c.Param("uuid"))
	if err != nil {
		c.JSON(500, gin.H{"error": "注销失败"})
		return
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		c.JSON(404, gin.H{"error": "用户不存在"})
		return
	}
	c.Status(http.StatusNoContent)
}
