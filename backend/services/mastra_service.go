package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/kuroki3520/ai_news_app/backend/models"
)

// MastraエージェントのURL構造体
type MastraServiceConfig struct {
	BaseURL string
}

// NewMastraServiceConfig 新しいMastraサービス設定を作成する
func NewMastraServiceConfig() (*MastraServiceConfig, error) {
	// プロジェクトルートの.envファイルを読み込む
	err := godotenv.Load("../.env")
	if err != nil {
		// エラーログを出力するが、環境変数で設定されている可能性があるため処理は続行
		fmt.Println("Warning: .env file not found, using environment variables")
	}

	// 環境変数からMastraエージェントのURLを取得
	baseURL := os.Getenv("MASTRA_SERVICE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:3000" // デフォルト値
	}

	return &MastraServiceConfig{
		BaseURL: baseURL,
	}, nil
}

// MastraServiceRequest Mastraサービスへのリクエスト構造体
type MastraServiceRequest struct {
	Period     string `json:"period"`      // 例: "24h", "7d"
	CallbackURL string `json:"callbackUrl"` // コールバックURL
}

// RequestReportGeneration Mastraエージェントにレポート生成をリクエストする
func (c *MastraServiceConfig) RequestReportGeneration(taskID string, period string) error {
	// エンドポイントURLを構築
	url := fmt.Sprintf("%s/agent/generate-ai-news", c.BaseURL)

	// コールバックURLを構築
	callbackURL := fmt.Sprintf("http://localhost:8080/api/internal/report-callback/%s", taskID)
	
	// リクエストオブジェクトを作成
	requestBody := MastraServiceRequest{
		Period:     period,
		CallbackURL: callbackURL,
	}

	// リクエストボディをJSONに変換
	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request body: %v", err)
	}

	// HTTPリクエストを作成
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create HTTP request: %v", err)
	}

	// ヘッダーを設定
	req.Header.Set("Content-Type", "application/json")

	// HTTPクライアントを作成してリクエスト実行
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request to Mastra service: %v", err)
	}
	defer resp.Body.Close()

	// レスポンスのステータスコードをチェック
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		return fmt.Errorf("Mastra service returned non-OK status: %d", resp.StatusCode)
	}

	// タスクのステータスを更新
	return UpdateTaskStatus(taskID, models.TaskStatusRunning, nil, nil)
} 