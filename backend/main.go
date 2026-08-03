package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	_ "github.com/go-sql-driver/mysql"
	server "neon-blog/cmd/server"
	"neon-blog/middleware"
)

var ctx = context.Background()

func main() {
	db, _ := sql.Open("mysql", "root:1234@tcp(127.0.0.1:3306)/neon_blog?parseTime=true")
	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
	minioClient, err := middleware.NewMinIO(ctx)
	if err != nil {
		log.Printf("MinIO 初始化失败，头像上传暂不可用: %v", err)
	}
	r := gin.Default()
	r.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "" {
			origin = "*"
		}
		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Vary", "Origin")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		if c.Request.Method == http.MethodOptions {
			c.Header("Access-Control-Max-Age", "86400")
			c.JSON(http.StatusOK, gin.H{"ok": true})
			c.Abort()
			return
		}
		c.Next()
	})
	r.GET("/api/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
	r.POST("/api/register", func(c *gin.Context) {
		var x struct{ Email, Password string }
		if c.BindJSON(&x) != nil || x.Email == "" || len(x.Password) < 6 {
			c.JSON(400, gin.H{"error": "邮箱不能为空，密码至少 6 位"})
			return
		}
		result, err := db.Exec("INSERT INTO users(email,password) VALUES(?,?)", x.Email, x.Password)
		if err != nil {
			c.JSON(409, gin.H{"error": "邮箱已注册"})
			return
		}
		rdb.Set(ctx, "login:"+x.Email, x.Password, 24*time.Hour)
		id, _ := result.LastInsertId()
		c.JSON(201, gin.H{"token": "cached", "id": id, "uuid": id, "email": x.Email, "nickname": "林墨"})
	})
	r.POST("/api/login", func(c *gin.Context) {
		var x struct{ Email, Password string }
		if c.BindJSON(&x) != nil {
			c.JSON(400, gin.H{"error": "bad request"})
			return
		}
		var stored, nickname, img string
		var id int64
		if err := db.QueryRow("SELECT id, password, nickname, COALESCE(img, '') FROM users WHERE email=?", x.Email).Scan(&id, &stored, &nickname, &img); err != nil || stored != x.Password {
			c.JSON(401, gin.H{"error": "邮箱或密码错误"})
			return
		}
		rdb.Set(ctx, "login:"+x.Email, x.Password, 24*time.Hour)
		c.JSON(200, gin.H{"token": "cached", "id": id, "uuid": id, "email": x.Email, "nickname": nickname, "img": img})
	})
	r.GET("/api/posts", func(c *gin.Context) {
		var n int
		db.QueryRow("SELECT COUNT(*) FROM posts").Scan(&n)
		c.JSON(http.StatusOK, gin.H{"count": n, "items": []string{"构建属于你的数字花园", "AI 时代的个人工作流实验"}})
	})
	server.UserHandler{DB: db, MinIO: minioClient}.Register(r)
	server.BlogHandler{DB: db}.Register(r)
	r.Run(":8080")
}
