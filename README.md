# Nebula Blog
cd frontend
npm.cmd install
npm.cmd run dev

## Go + Gin 后端
先执行 backend/schema.sql，并启动 MySQL、Redis（默认 localhost:6379）。
cd backend
go mod tidy
go run main.go

登录接口会把账号密码写入 Redis，键格式为 `login:{email}`，有效期 24 小时。
