package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/kuroki3520/ai_news_app/backend/models"
	"github.com/kuroki3520/ai_news_app/backend/services"
)

// CreateReportTask レポート生成タスクを作成するハンドラー
func CreateReportTask(c *gin.Context) {
	// リクエストボディからパラメータを取得
	var req models.ReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// デフォルト値の設定
	if req.Period == "" {
		req.Period = "24h" // デフォルトは24時間
	}

	// topicのデフォルト値設定
	if req.Topic == "" {
		req.Topic = "technology" // デフォルトはtechnology
	}

	// タスクを作成
	task, err := services.CreateTask()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
		return
	}

	// Mastraサービスの設定を取得
	mastraConfig, err := services.NewMastraServiceConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get Mastra service configuration"})
		return
	}

	// Mastraエージェントにレポート生成をリクエスト
	err = mastraConfig.RequestReportGeneration(task.ID.String(), req.Period, req.Topic)
	if err != nil {
		// エラーが発生した場合はタスクのステータスを失敗に更新
		errMsg := err.Error()
		_ = services.UpdateTaskStatus(task.ID.String(), models.TaskStatusFailed, nil, &errMsg)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to request report generation"})
		return
	}

	// レスポンスを返す
	c.JSON(http.StatusAccepted, models.TaskResponse{
		TaskID: task.ID.String(),
		Status: task.Status,
	})
}

// GetTaskStatus タスクの状態を取得するハンドラー
func GetTaskStatus(c *gin.Context) {
	taskID := c.Param("taskId")

	// タスクを取得
	task, err := services.GetTaskStatus(taskID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	// レスポンスを返す
	c.JSON(http.StatusOK, models.TaskStatusResponse{
		Status: task.Status,
	})
}

// GetLatestReport 最新のレポートを取得するハンドラー
func GetLatestReport(c *gin.Context) {
	// 最新のレポートを取得
	report, err := services.GetLatestReport()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No reports found"})
		return
	}

	// レスポンスを返す
	c.JSON(http.StatusOK, models.ReportResponse{
		ReportID:    report.ID.String(),
		GeneratedAt: report.GeneratedAt,
		Articles:    report.Articles,
	})
}

// GetReport 指定されたIDのレポートを取得するハンドラー
func GetReport(c *gin.Context) {
	reportID := c.Param("reportId")

	// レポートを取得
	report, err := services.GetReportByID(reportID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Report not found"})
		return
	}

	// レスポンスを返す
	c.JSON(http.StatusOK, models.ReportResponse{
		ReportID:    report.ID.String(),
		GeneratedAt: report.GeneratedAt,
		Articles:    report.Articles,
	})
}
