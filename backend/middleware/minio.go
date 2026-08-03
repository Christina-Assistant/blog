package middleware

import (
	"context"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const defaultAvatarBucket = "avatars"

type MinIO struct {
	client        *minio.Client
	bucket        string
	publicBaseURL string
}

func NewMinIO(ctx context.Context) (*MinIO, error) {
	endpoint := envOrDefault("MINIO_ENDPOINT", "localhost:9000")
	accessKey := envOrDefault("MINIO_ACCESS_KEY", "minioadmin")
	secretKey := envOrDefault("MINIO_SECRET_KEY", "minioadmin")
	bucket := envOrDefault("MINIO_BUCKET", defaultAvatarBucket)
	useSSL := strings.EqualFold(os.Getenv("MINIO_USE_SSL"), "true")

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("create minio client: %w", err)
	}

	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return nil, fmt.Errorf("check minio bucket: %w", err)
	}
	if !exists {
		if err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
			return nil, fmt.Errorf("create minio bucket: %w", err)
		}
	}

	return &MinIO{
		client:        client,
		bucket:        bucket,
		publicBaseURL: strings.TrimRight(envOrDefault("MINIO_PUBLIC_BASE_URL", "http://localhost:8080/api/uploads"), "/"),
	}, nil
}

func (m *MinIO) Upload(ctx context.Context, objectName string, reader io.Reader, size int64, contentType string) (string, error) {
	_, err := m.client.PutObject(ctx, m.bucket, objectName, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("upload minio object: %w", err)
	}
	return m.publicBaseURL + "/" + objectName, nil
}

func (m *MinIO) Get(ctx context.Context, objectName string) (*minio.Object, minio.ObjectInfo, error) {
	object, err := m.client.GetObject(ctx, m.bucket, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, minio.ObjectInfo{}, fmt.Errorf("get minio object: %w", err)
	}
	info, err := object.Stat()
	if err != nil {
		object.Close()
		return nil, minio.ObjectInfo{}, fmt.Errorf("stat minio object: %w", err)
	}
	return object, info, nil
}

func (m *MinIO) Delete(ctx context.Context, objectName string) error {
	if objectName == "" {
		return nil
	}
	return m.client.RemoveObject(ctx, m.bucket, objectName, minio.RemoveObjectOptions{})
}

func (m *MinIO) ObjectNameFromURL(url string) string {
	prefix := m.publicBaseURL + "/"
	if strings.HasPrefix(url, prefix) {
		return strings.TrimPrefix(url, prefix)
	}
	return ""
}

func envOrDefault(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}
