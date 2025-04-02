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
    // リクエストボディを検証
    const { period, callbackUrl } = req.body as GenerateReportRequest;
    
    if (!period) {
      res.status(400).json({ error: 'Missing required field: period' });
      return;
    }
    
    if (!callbackUrl) {
      res.status(400).json({ error: 'Missing required field: callbackUrl' });
      return;
    }
    
    // 即座に受付応答を返す
    res.status(202).json({ message: 'Task accepted' });
    
    // 以降の処理は非同期で実行（レスポンス後）
    setTimeout(async () => {
      try {
        // 設定を読み込む
        const config = loadConfig();
        
        // レポートを生成
        console.log(`Starting news report generation with period: ${period}`);
        const articles = await generateNewsReport(config, period);
        
        // 結果をコールバック
        await sendReportCallback(callbackUrl, articles);
      } catch (error) {
        console.error('Failed in async report generation:', error);
        
        // エラーをコールバック
        try {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await sendReportCallback(callbackUrl, []);
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