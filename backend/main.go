package main

import (
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/kuroki3520/ai_news_app/backend/db"
	"github.com/kuroki3520/ai_news_app/backend/handlers"
)

func main() {
	// データベース接続を初期化
	_, err := db.Initialize()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Ginルーターを作成 (デフォルトのミドルウェアを使用: logger, recovery)
	r := gin.Default()

	// CORSミドルウェアを設定
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, // フロントエンドのURL
		AllowMethods:     []string{"GET", "POST"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// APIグループを作成
	api := r.Group("/api")
	{
		// レポート関連のエンドポイント
		api.POST("/reports", handlers.CreateReportTask)
		api.GET("/reports/latest", handlers.GetLatestReport)
		api.GET("/reports/:reportId", handlers.GetReport)

		// タスク状態関連のエンドポイント
		api.GET("/tasks/:taskId/status", handlers.GetTaskStatus)

		// 内部API (Mastraエージェントからのコールバック用)
		internal := api.Group("/internal")
		{
			internal.POST("/report-callback/:taskId", handlers.HandleReportCallback)
		}
	}

	// ヘルスチェック用エンドポイント
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	// サーバーをポート8080で起動
	// エラーが発生した場合はログに出力して終了
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
} 