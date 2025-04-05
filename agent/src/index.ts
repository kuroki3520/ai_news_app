import express from 'express';
import { loadConfig } from './utils/config'; // ★コメントアウト解除
import { generateAiNewsHandler } from './handlers/report';

// 環境変数からポート番号を取得（デフォルト: 3000）
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  try {
    console.log('Starting server initialization with health check...'); // ログ変更
    // Expressアプリを作成
    const app = express();
    console.log('Express app created.');

    // JSONパーサーミドルウェアを設定 (念のため残す)
    app.use(express.json());
    console.log('JSON parser middleware set.');

    // 設定ファイルを読み込む (コメントアウト解除)
    console.log('Loading configuration...'); // ★コメントアウト解除
    const config = loadConfig();                           // ★コメントアウト解除
    console.log('Configuration loaded successfully.'); // ★コメントアウト解除

    // ヘルスチェックエンドポイント
    app.get('/health', (req, res) => {                      // ★コメントアウト解除
      console.log('Health check endpoint hit.');           // ★コメントアウト解除
      res.status(200).json({ status: 'ok' });               // ★コメントアウト解除
    });                                                    // ★コメントアウト解除
    console.log('Health check endpoint configured.');        // ★コメントアウト解除

    // AIニュースレポート生成エンドポイント (コメントアウトのまま)
    app.post('/agent/generate-ai-news', generateAiNewsHandler);
    console.log('AI News generation endpoint configured.');

    // サーバーを起動
    const server = app.listen(PORT, () => {
      console.log(`Server with health check running on port ${PORT}`); // ログ変更
      console.log(`Health check: http://localhost:${PORT}/health`);      // ★コメントアウト解除
      console.log(`AI News generation: http://localhost:${PORT}/agent/generate-ai-news [POST]`);
      console.log('Server started successfully.');
    });

    // サーバーエラーハンドリング
    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });

    console.log('Server with health check setup complete. Waiting for requests...'); // ログ変更

  } catch (error) {
    console.error('Failed during server initialization with health check or runtime:', error); // ログ変更
    process.exit(1);
  }
}

// グローバルな未ハンドル例外のキャッチ
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// グローバルな未ハンドルPromise拒否のキャッチ
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// サーバー起動関数の呼び出し
startServer(); 