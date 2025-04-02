package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/kuroki3520/ai_news_app/backend/db"
	"github.com/kuroki3520/ai_news_app/backend/models"
)

// CreateTask 新しいタスクを作成する
func CreateTask() (*models.Task, error) {
	// 新しいUUIDを生成
	taskID := uuid.New()

	// 新しいタスクを作成
	task := &models.Task{
		ID:          taskID,
		Status:      models.TaskStatusPending,
		RequestedAt: time.Now(),
		// CompletedAt と ReportID はnilのまま
	}

	// データベースに保存
	if err := db.DB.Create(task).Error; err != nil {
		return nil, fmt.Errorf("failed to create task: %v", err)
	}

	return task, nil
}

// GetTaskStatus タスクのステータスを取得する
func GetTaskStatus(taskID string) (*models.Task, error) {
	// 文字列からUUIDに変換
	id, err := uuid.Parse(taskID)
	if err != nil {
		return nil, fmt.Errorf("invalid task ID: %v", err)
	}

	// データベースからタスクを取得
	var task models.Task
	if err := db.DB.Where("id = ?", id).First(&task).Error; err != nil {
		return nil, fmt.Errorf("failed to get task: %v", err)
	}

	return &task, nil
}

// UpdateTaskStatus タスクのステータスを更新する
func UpdateTaskStatus(taskID string, status models.TaskStatus, reportID *uuid.UUID, errorMsg *string) error {
	// 文字列からUUIDに変換
	id, err := uuid.Parse(taskID)
	if err != nil {
		return fmt.Errorf("invalid task ID: %v", err)
	}

	// 更新データを準備
	updates := map[string]interface{}{
		"status": status,
	}

	// タスクが完了または失敗した場合は完了時間を設定
	if status == models.TaskStatusCompleted || status == models.TaskStatusFailed {
		now := time.Now()
		updates["completed_at"] = now
	}

	// レポートIDが指定された場合は設定
	if reportID != nil {
		updates["report_id"] = reportID
	}

	// エラーメッセージが指定された場合は設定
	if errorMsg != nil {
		updates["error_message"] = *errorMsg
	}

	// データベースのタスクを更新
	if err := db.DB.Model(&models.Task{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update task: %v", err)
	}

	return nil
} 