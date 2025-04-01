package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// Ginルーターを作成 (デフォルトのミドルウェアを使用: logger, recovery)
	r := gin.Default()

	// /ping エンドポイントを定義
	r.GET("/ping", func(c *gin.Context) {
		// JSONレスポンスを返す
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	// サーバーをポート8080で起動
	// エラーが発生した場合はログに出力して終了
	if err := r.Run(":8080"); err != nil {
		panic(err)
	}
} 