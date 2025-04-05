package models

import (
	"time"

	"github.com/google/uuid"
)

// TaskStatus は、タスクの状態を表す列挙型
type TaskStatus string

const (
	TaskStatusPending   TaskStatus = "PENDING"
	TaskStatusRunning   TaskStatus = "RUNNING"
	TaskStatusCompleted TaskStatus = "COMPLETED"
	TaskStatusFailed    TaskStatus = "FAILED"
)

// Task は、レポート生成タスクを表す構造体
type Task struct {
	ID           uuid.UUID  `json:"id" gorm:"primaryKey;type:uuid"`
	Status       TaskStatus `json:"status" gorm:"type:varchar(20)"`
	RequestedAt  time.Time  `json:"requested_at"`
	CompletedAt  *time.Time `json:"completed_at,omitempty" gorm:"default:null"`
	ReportID     *uuid.UUID `json:"report_id,omitempty" gorm:"type:uuid;default:null"`
	ErrorMessage string     `json:"error_message,omitempty" gorm:"type:text;default:null"`
}

// Article は、ニュース記事を表す構造体
type Article struct {
	Title       string  `json:"title"`
	URL         string  `json:"url"`
	SourceName  string  `json:"source_name"`
	PublishedAt string  `json:"published_at"`
	Summary     *string `json:"summary,omitempty"` // オプションのフィールド
}

// Report は、生成されたレポートを表す構造体
type Report struct {
	ID          uuid.UUID `json:"id" gorm:"primaryKey;type:uuid"`
	GeneratedAt string    `json:"generated_at"`
	Articles    []Article `json:"articles" gorm:"type:jsonb"`
}

// APIレスポンス用の構造体
type TaskResponse struct {
	TaskID string     `json:"taskId"`
	Status TaskStatus `json:"status"`
}

type TaskStatusResponse struct {
	Status TaskStatus `json:"status"`
}

type ReportResponse struct {
	ReportID    string    `json:"reportId"`
	GeneratedAt string    `json:"generatedAt"`
	Articles    []Article `json:"articles"`
}

// リクエスト用の構造体
type ReportRequest struct {
	Period string `json:"period"` // 例: "24h", "7d"
	Topic  string `json:"topic"`  // 例: "technology", "business"
}

// Mastra向けのコールバックリクエスト構造体
type ReportCallbackRequest struct {
	Status TaskStatus `json:"status"`
	Report *Report    `json:"report,omitempty"`
	Error  *string    `json:"error,omitempty"`
}
