# Nebula Blog
cd frontend
npm.cmd install
npm.cmd run dev

## Go + Gin 后端
先执行 backend/schema.sql，并启动 MySQL、Redis（默认 localhost:6379）和本地 MinIO（默认 localhost:9000）。
已有数据库需额外执行 `backend/migrations/001_add_user_img.sql`。

MinIO 默认配置：

```text
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=avatars
MINIO_USE_SSL=false
MINIO_PUBLIC_BASE_URL=http://localhost:8080/api/uploads
```

以上配置均可通过同名环境变量覆盖，bucket 会在后端启动时自动创建。

cd backend
go mod tidy
go run main.go

登录接口会把账号密码写入 Redis，键格式为 `login:{email}`，有效期 24 小时。
