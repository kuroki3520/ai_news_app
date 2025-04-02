// タスクのステータス
export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

// 記事の型定義
export interface Article {
  title: string;
  url: string;
  source_name: string;
  published_at: string;
  summary?: string;
}

// レポートの型定義
export interface Report {
  reportId: string;
  generatedAt: string;
  articles: Article[];
}

// タスクレスポンスの型定義
export interface TaskResponse {
  taskId: string;
  status: TaskStatus;
}

// タスクステータスレスポンスの型定義
export interface TaskStatusResponse {
  status: TaskStatus;
} 