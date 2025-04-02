import express from 'express';
import { loadConfig } from './utils/config';
import { generateAiNewsHandler } from './handlers/report';

// 環境変数からポート番号を取得（デフォルト: 3000）
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Expressアプリを作成
const app = express();

// JSONパーサーミドルウェアを設定
app.use(express.json());

// 設定ファイルを読み込む
try {
  // 起動時に設定ファイルの読み込みを試行（エラーチェック）
  loadConfig();
  console.log('Configuration loaded successfully');
} catch (error) {
  console.error('Failed to load configuration:', error);
  process.exit(1);
}

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// AIニュースレポート生成エンドポイント
app.post('/agent/generate-ai-news', generateAiNewsHandler);

// サーバーを起動
app.listen(PORT, () => {
  console.log(`Mastra AI News Agent server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Generate news endpoint: http://localhost:${PORT}/agent/generate-ai-news`);
}); 