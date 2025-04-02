package services

import (
	"fmt"

	"github.com/google/uuid"

	"github.com/kuroki3520/ai_news_app/backend/db"
	"github.com/kuroki3520/ai_news_app/backend/models"
)

// CreateReport 新しいレポートを作成する
func CreateReport(report *models.Report) error {
	// レポートをデータベースに保存
	if err := db.DB.Create(report).Error; err != nil {
		return fmt.Errorf("failed to create report: %v", err)
	}

	return nil
}

// GetLatestReport 最新のレポートを取得する
func GetLatestReport() (*models.Report, error) {
	var report models.Report
	if err := db.DB.Order("generated_at DESC").First(&report).Error; err != nil {
		return nil, fmt.Errorf("failed to get latest report: %v", err)
	}

	return &report, nil
}

// GetReportByID 指定されたIDのレポートを取得する
func GetReportByID(reportID string) (*models.Report, error) {
	// 文字列からUUIDに変換
	id, err := uuid.Parse(reportID)
	if err != nil {
		return nil, fmt.Errorf("invalid report ID: %v", err)
	}

	// レポートをデータベースから取得
	var report models.Report
	if err := db.DB.Where("id = ?", id).First(&report).Error; err != nil {
		return nil, fmt.Errorf("failed to get report: %v", err)
	}

	return &report, nil
}

// GetReportFromTask タスクに関連付けられたレポートを取得する
func GetReportFromTask(taskID string) (*models.Report, error) {
	// タスクを取得
	task, err := GetTaskStatus(taskID)
	if err != nil {
		return nil, err
	}

	// タスクにレポートが関連付けられていない場合
	if task.ReportID == nil {
		return nil, fmt.Errorf("no report associated with this task")
	}

	// レポートを取得
	return GetReportByID(task.ReportID.String())
} 