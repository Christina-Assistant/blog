package server

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	"net/http"
)

type UserHandler struct{ DB *sql.DB }

func (h UserHandler) Register(r *gin.Engine) {
	r.PUT("/api/users/:uuid", h.update)
	r.DELETE("/api/users/:uuid", h.delete)
}
func (h UserHandler) update(c *gin.Context) {
	var x struct{ Nickname, Email, Password string }
	if c.BindJSON(&x) != nil || x.Nickname == "" || x.Email == "" {
		c.JSON(400, gin.H{"error": "昵称和邮箱不能为空"})
		return
	}
	id := c.Param("uuid")
	var err error
	if x.Password != "" {
		_, err = h.DB.Exec("UPDATE users SET nickname=?,email=?,password=? WHERE id=?", x.Nickname, x.Email, x.Password, id)
	} else {
		_, err = h.DB.Exec("UPDATE users SET nickname=?,email=? WHERE id=?", x.Nickname, x.Email, id)
	}
	if err != nil {
		c.JSON(409, gin.H{"error": "邮箱已被使用或用户不存在"})
		return
	}
	c.JSON(200, gin.H{"id": id, "nickname": x.Nickname, "email": x.Email})
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
