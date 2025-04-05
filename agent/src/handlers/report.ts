import { Request, Response } from 'express';
import { GenerateReportRequest } from '../types';
import { loadConfig } from '../utils/config';
import { generateNewsReport, sendReportCallback } from '../services/report';

/**
 * AIニュースレポート生成ハンドラー
 * POST /agent/generate-ai-news
 * 
 * @param {Request} req リクエストオブジェクト
 * @param {Response} res レスポンスオブジェクト
 */
export async function generateAiNewsHandler(req: Request, res: Response): Promise<void> {
  try {
    console.log('Received request body:', req.body);
    
    // バックエンドから送信されたリクエストを処理
    // topic フィールドを受け取り、期間とコールバックURLに変換
    const { topic, callbackUrl } = req.body;
    
    if (!topic) {
      res.status(400).json({ error: 'Missing required field: topic' });
      return;
    }
    
    // コールバックURLの検証
    if (!callbackUrl) {
      console.warn('No callback URL provided, using default');
    }
    
    // トピックから期間へのマッピング (仮の実装)
    const period = '24h'; // デフォルトは24時間
    
    // バックエンドから提供されたコールバックURLを使用するか、デフォルトを使用
    const finalCallbackUrl = callbackUrl || 'http://localhost:8080/api/internal/report-callback/placeholder';
    
    // 即座に受付応答を返す
    res.status(202).json({ message: 'Task accepted', topic: topic });
    
    // 以降の処理は非同期で実行（レスポンス後）
    setTimeout(async () => {
      try {
        // 設定を読み込む
        const config = loadConfig();
        
        // レポートを生成
        console.log(`Starting news report generation for topic: ${topic}, period: ${period}`);
        console.log(`Will send callback to: ${finalCallbackUrl}`);
        const articles = await generateNewsReport(config, period);
        
        // 結果をコールバック
        await sendReportCallback(finalCallbackUrl, articles);
      } catch (error) {
        console.error('Failed in async report generation:', error);
        
        // エラーをコールバック
        try {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await sendReportCallback(finalCallbackUrl, []);
        } catch (callbackError) {
          console.error('Failed to send error callback:', callbackError);
        }
      }
    }, 0);
  } catch (error) {
    console.error('Error in generate-ai-news handler:', error);
    
    // リクエスト処理中のエラーの場合はエラーレスポンスを返す
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 