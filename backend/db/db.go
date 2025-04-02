package db

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/kuroki3520/ai_news_app/backend/models"
)

var DB *gorm.DB

// Initialize データベース接続を初期化する
func Initialize() (*gorm.DB, error) {
	// プロジェクトルートの.envファイルを読み込む
	err := godotenv.Load("../.env")
	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// 環境変数からDB接続情報を取得
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "ai_news_app")
	sslMode := getEnv("DB_SSL_MODE", "disable")

	// 接続文字列の生成
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		dbHost, dbPort, dbUser, dbPassword, dbName, sslMode)

	// データベースへの接続
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	// モデルのマイグレーション
	err = db.AutoMigrate(&models.Task{}, &models.Report{})
	if err != nil {
		return nil, fmt.Errorf("failed to migrate database: %v", err)
	}

	// グローバル変数にDBインスタンスを格納
	DB = db
	return db, nil
}

// 環境変数を取得し、未設定の場合はデフォルト値を返す
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
} 