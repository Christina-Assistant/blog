package server

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
)

type BlogHandler struct{ DB *sql.DB }
type blogInput struct {
	Title     string `json:"title"`
	Content   string `json:"content"`
	Author    string `json:"author"`
	Likes     *int   `json:"likes"`
	Favorites *int   `json:"favorites"`
	ImageURL  string `json:"imageUrl"`
}

func (h BlogHandler) Register(r *gin.Engine) {
	r.GET("/api/blog", h.list)
	r.GET("/api/blog/:id", h.get)
	r.POST("/api/blog", h.create)
	r.PUT("/api/blog/:id", h.update)
	r.DELETE("/api/blog/:id", h.delete)
}
func id(c *gin.Context) (int64, bool) {
	v, e := strconv.ParseInt(c.Param("id"), 10, 64)
	if e != nil || v < 1 {
		c.JSON(400, gin.H{"error": "无效的文章 ID"})
		return 0, false
	}
	return v, true
}
func (h BlogHandler) list(c *gin.Context) {
	o := "created_at DESC"
	if c.Query("sort") == "likes" {
		o = "likes DESC,created_at DESC"
	} else if c.Query("sort") == "favorites" {
		o = "favorites DESC,created_at DESC"
	}
	rows, e := h.DB.Query("SELECT id,title,content,author,likes,favorites,image_url,created_at FROM blog ORDER BY " + o)
	if e != nil {
		c.JSON(500, gin.H{"error": "读取文章失败"})
		return
	}
	defer rows.Close()
	a := []gin.H{}
	for rows.Next() {
		var i, l, f int64
		var t, x, u, img string
		var d interface{}
		if rows.Scan(&i, &t, &x, &u, &l, &f, &img, &d) == nil {
			a = append(a, gin.H{"id": i, "title": t, "content": x, "author": u, "likes": l, "favorites": f, "imageUrl": img, "createdAt": d})
		}
	}
	c.JSON(200, gin.H{"items": a})
}
func (h BlogHandler) get(c *gin.Context) {
	i, ok := id(c)
	if !ok {
		return
	}
	var x blogInput
	var d interface{}
	e := h.DB.QueryRow("SELECT title,content,author,likes,favorites,image_url,created_at FROM blog WHERE id=?", i).Scan(&x.Title, &x.Content, &x.Author, &x.Likes, &x.Favorites, &x.ImageURL, &d)
	if e == sql.ErrNoRows {
		c.JSON(404, gin.H{"error": "文章不存在"})
		return
	}
	if e != nil {
		c.JSON(500, gin.H{"error": "读取文章失败"})
		return
	}
	c.JSON(200, gin.H{"id": i, "title": x.Title, "content": x.Content, "author": x.Author, "likes": x.Likes, "favorites": x.Favorites, "imageUrl": x.ImageURL, "createdAt": d})
}
func (h BlogHandler) create(c *gin.Context) {
	var x blogInput
	if c.BindJSON(&x) != nil || x.Title == "" || x.Content == "" {
		c.JSON(400, gin.H{"error": "标题和内容不能为空"})
		return
	}
	if x.Author == "" {
		x.Author = "林墨"
	}
	l, f := 0, 0
	if x.Likes != nil {
		l = *x.Likes
	}
	if x.Favorites != nil {
		f = *x.Favorites
	}
	r, e := h.DB.Exec("INSERT INTO blog(title,content,author,likes,favorites,image_url) VALUES(?,?,?,?,?,?)", x.Title, x.Content, x.Author, l, f, x.ImageURL)
	if e != nil {
		c.JSON(500, gin.H{"error": "创建文章失败"})
		return
	}
	i, _ := r.LastInsertId()
	c.JSON(http.StatusCreated, gin.H{"id": i, "title": x.Title, "content": x.Content, "author": x.Author, "imageUrl": x.ImageURL, "likes": l, "favorites": f})
}
func (h BlogHandler) update(c *gin.Context) {
	i, ok := id(c)
	if !ok {
		return
	}
	var x blogInput
	if c.BindJSON(&x) != nil || x.Title == "" || x.Content == "" {
		c.JSON(400, gin.H{"error": "标题和内容不能为空"})
		return
	}
	if x.Author == "" {
		x.Author = "林墨"
	}
	l, f := 0, 0
	if x.Likes != nil {
		l = *x.Likes
	}
	if x.Favorites != nil {
		f = *x.Favorites
	}
	r, e := h.DB.Exec("UPDATE blog SET title=?,content=?,author=?,likes=?,favorites=?,image_url=? WHERE id=?", x.Title, x.Content, x.Author, l, f, x.ImageURL, i)
	if e != nil {
		c.JSON(500, gin.H{"error": "更新文章失败"})
		return
	}
	n, _ := r.RowsAffected()
	if n == 0 {
		c.JSON(404, gin.H{"error": "文章不存在"})
		return
	}
	c.JSON(200, gin.H{"id": i, "title": x.Title, "content": x.Content, "author": x.Author, "imageUrl": x.ImageURL, "likes": l, "favorites": f})
}
func (h BlogHandler) delete(c *gin.Context) {
	i, ok := id(c)
	if !ok {
		return
	}
	r, e := h.DB.Exec("DELETE FROM blog WHERE id=?", i)
	if e != nil {
		c.JSON(500, gin.H{"error": "删除文章失败"})
		return
	}
	n, _ := r.RowsAffected()
	if n == 0 {
		c.JSON(404, gin.H{"error": "文章不存在"})
		return
	}
	c.Status(http.StatusNoContent)
}
