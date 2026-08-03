CREATE DATABASE IF NOT EXISTS neon_blog DEFAULT CHARACTER SET utf8mb4;
USE neon_blog;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(120) UNIQUE,
  password VARCHAR(255),
  nickname VARCHAR(80) NOT NULL DEFAULT '林墨',
  img VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  content TEXT,
  author VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS blog(
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(80) NOT NULL DEFAULT '林墨',
  likes INT NOT NULL DEFAULT 0,
  favorites INT NOT NULL DEFAULT 0,
  image_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_blog_created (created_at), INDEX idx_blog_likes (likes), INDEX idx_blog_favorites (favorites)
);
INSERT INTO blog(title,content,author,likes,favorites) SELECT '欢迎来到 Nebula Blog','记录思考，保持生长。这里是你的数字花园。','林墨',42,18 WHERE NOT EXISTS (SELECT 1 FROM blog);
INSERT INTO blog(title,content,author,likes,favorites) SELECT 'AI 时代的个人工作流实验','把 AI 融入创作的每个环节，持续记录真实实践。','Alex',35,22 WHERE (SELECT COUNT(*) FROM blog)=1;
INSERT INTO blog(title,content,author,likes,favorites) SELECT '在城市边缘寻找慢下来的勇气','向内探索，也是一种勇敢的出发。','苏晚',27,31 WHERE (SELECT COUNT(*) FROM blog)=2;
