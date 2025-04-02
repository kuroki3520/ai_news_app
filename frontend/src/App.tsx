import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TaskStatus, Article } from './types';

// API のベース URL
const API_BASE_URL = 'http://localhost:8080/api';

const App: React.FC = () => {
  // 状態管理
  const [period, setPeriod] = useState<string>('24h');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<{
    reportId: string;
    generatedAt: string;
    articles: Article[];
  } | null>(null);

  // 最新レポートを取得
  const fetchLatestReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/reports/latest`);
      setReport(response.data);
    } catch (err) {
      console.error('Failed to fetch latest report:', err);
      setError('最新のレポートを取得できませんでした。');
    } finally {
      setLoading(false);
    }
  };

  // タスクステータスをポーリング
  const pollTaskStatus = async () => {
    if (!taskId) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/tasks/${taskId}/status`);
      const status = response.data.status as TaskStatus;
      
      setTaskStatus(status);
      
      // タスクが完了または失敗した場合のみポーリングを停止
      if (status === 'COMPLETED') {
        fetchLatestReport();
        setTaskId(null);
      } else if (status === 'FAILED') {
        setError('レポート生成に失敗しました。');
        setTaskId(null);
      }
    } catch (err) {
      console.error('Failed to poll task status:', err);
      setError('タスクステータスの取得に失敗しました。');
      setTaskId(null);
    }
  };

  // ポーリングのためのエフェクト
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (taskId) {
      intervalId = setInterval(pollTaskStatus, 3000); // 3秒ごとにポーリング
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [taskId]);

  // 初期ロード時に最新レポートを取得
  useEffect(() => {
    fetchLatestReport();
  }, []);

  // レポート生成リクエスト
  const requestReportGeneration = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_BASE_URL}/reports`, { period });
      
      setTaskId(response.data.taskId);
      setTaskStatus(response.data.status);
    } catch (err) {
      console.error('Failed to request report generation:', err);
      setError('レポート生成リクエストに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">AIニュースレポート</h1>
        <p className="text-gray-600 mb-4">最新のAI関連ニュースを自動で収集・整理します</p>
      </header>

      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-lg shadow mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <label htmlFor="period" className="mr-2 text-gray-700">期間:</label>
          <select
            id="period"
            className="border rounded p-2 bg-gray-50"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            disabled={loading || !!taskId}
          >
            <option value="24h">過去24時間</option>
            <option value="7d">過去7日間</option>
            <option value="30d">過去30日間</option>
          </select>
        </div>
        
        <button
          className={`px-4 py-2 rounded text-white ${
            loading || !!taskId
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={requestReportGeneration}
          disabled={loading || !!taskId}
        >
          {loading ? '処理中...' : taskId ? 'レポート生成中...' : '最新のAIニュースを更新'}
        </button>
      </div>

      {/* タスクステータス表示 */}
      {taskId && taskStatus && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded shadow-sm">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>
              <span className="font-medium text-blue-700">ステータス: </span>
              {taskStatus === 'PENDING' && '処理待ち'}
              {taskStatus === 'RUNNING' && 'レポート生成中...'}
              {taskStatus === 'COMPLETED' && 'レポート生成完了'}
              {taskStatus === 'FAILED' && 'レポート生成失敗'}
            </p>
          </div>
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded shadow-sm">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* レポート表示 */}
      {report && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">AIニュースレポート</h2>
            <p className="text-sm text-gray-600">生成日時: {formatDate(report.generatedAt)}</p>
          </div>

          {report.articles.length === 0 ? (
            <p className="text-gray-600 text-center py-4">記事がありません。</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {report.articles.map((article, index) => (
                <li key={index} className="py-4">
                  <div className="flex flex-col md:flex-row md:justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-blue-600 hover:text-blue-800 transition-colors mb-1">
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                          {article.title}
                        </a>
                      </h3>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">{article.source_name}</span> - {formatDate(article.published_at)}
                      </div>
                      {article.summary && (
                        <p className="text-gray-700">{article.summary}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default App; 