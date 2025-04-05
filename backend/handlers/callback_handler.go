package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/kuroki3520/ai_news_app/backend/models"
	"github.com/kuroki3520/ai_news_app/backend/services"
)

// HandleReportCallback Mastraエージェントからのコールバックを処理するハンドラー
func HandleReportCallback(c *gin.Context) {
	taskID := c.Param("taskId")

	// リクエストボディを解析
	var req models.ReportCallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// タスクの存在を確認
	_, err := services.GetTaskStatus(taskID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	// タスクのステータスに応じた処理
	switch req.Status {
	case models.TaskStatusCompleted:
		// レポートが存在することを確認
		if req.Report == nil {
			errMsg := "Report is missing in the callback"
			_ = services.UpdateTaskStatus(taskID, models.TaskStatusFailed, nil, &errMsg)
			c.JSON(http.StatusBadRequest, gin.H{"error": errMsg})
			return
		}

		// レポートのIDが未設定の場合は生成
		if req.Report.ID == uuid.Nil {
			req.Report.ID = uuid.New()
		}

		// レポートの生成時間が未設定の場合は現在時刻を設定
		if req.Report.GeneratedAt == "" {
			req.Report.GeneratedAt = time.Now().Format(time.RFC3339Nano)
		}

		// レポートをデータベースに保存
		err = services.CreateReport(req.Report)
		if err != nil {
			errMsg := "Failed to save report: " + err.Error()
			_ = services.UpdateTaskStatus(taskID, models.TaskStatusFailed, nil, &errMsg)
			c.JSON(http.StatusInternalServerError, gin.H{"error": errMsg})
			return
		}

		// タスクの状態を更新 (完了、レポートIDを設定)
		err = services.UpdateTaskStatus(taskID, models.TaskStatusCompleted, &req.Report.ID, nil)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task status"})
			return
		}

	case models.TaskStatusFailed:
		// エラーメッセージがある場合はそれを使用
		var errMsg *string
		if req.Error != nil {
			errMsg = req.Error
		} else {
			defaultMsg := "Report generation failed"
			errMsg = &defaultMsg
		}

		// タスクの状態を更新 (失敗、エラーメッセージを設定)
		err = services.UpdateTaskStatus(taskID, models.TaskStatusFailed, nil, errMsg)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task status"})
			return
		}

	default:
		// 不明なステータスの場合
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	// 成功レスポンスを返す
	c.JSON(http.StatusOK, gin.H{"message": "Callback processed successfully"})
}
