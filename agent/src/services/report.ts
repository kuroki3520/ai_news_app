import axios from 'axios';
import { Article, Config, CallbackReport } from '../types';
import { calculatePeriodStartDate } from '../utils/date';
import { fetchNewsFromGNews } from './gnews';
import { fetchNewsFromRss } from './rss';

/**
 * 重複記事を除去する
 * @param {Article[]} articles 記事リスト
 * @returns {Article[]} 重複除去後の記事リスト
 */
function removeDuplicateArticles(articles: Article[]): Article[] {
  // URLをキーにして重複を除去
  const uniqueUrls = new Set<string>();
  return articles.filter(article => {
    if (uniqueUrls.has(article.url)) {
      return false;
    }
    uniqueUrls.add(article.url);
    return true;
  });
}

/**
 * 記事を日付の降順でソートする
 * @param {Article[]} articles 記事リスト
 * @returns {Article[]} ソート後の記事リスト
 */
function sortArticlesByDate(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => {
    const dateA = new Date(a.published_at);
    const dateB = new Date(b.published_at);
    return dateB.getTime() - dateA.getTime(); // 降順
  });
}

/**
 * 指定された期間のニュースレポートを生成する
 * @param {Config} config 設定オブジェクト
 * @param {string} period 期間指定 (例: "24h", "7d")
 * @returns {Promise<Article[]>} 生成されたレポートの記事リスト
 */
export async function generateNewsReport(config: Config, period: string): Promise<Article[]> {
  console.log('[generateNewsReport] Starting report generation...');
  try {
    // 期間の開始日時を計算
    const fromDate = calculatePeriodStartDate(period);
    console.log(`[generateNewsReport] Generating news report from ${fromDate.toISOString()} to now`);
    
    // GNews APIから記事を取得
    console.log('[generateNewsReport] Fetching news from GNews API...');
    const gnewsArticles = await fetchNewsFromGNews(config, fromDate);
    console.log(`[generateNewsReport] Fetched ${gnewsArticles.length} articles from GNews API`);
    
    // RSSフィードから記事を取得
    console.log('[generateNewsReport] Fetching news from RSS feeds...');
    const rssArticles = await fetchNewsFromRss(config, fromDate);
    console.log(`[generateNewsReport] Fetched ${rssArticles.length} articles from RSS feeds`);
    
    // 全ての記事を結合
    const allArticles = [...gnewsArticles, ...rssArticles];
    console.log(`[generateNewsReport] Combined total articles: ${allArticles.length}`);
    
    // 重複を除去
    const uniqueArticles = removeDuplicateArticles(allArticles);
    console.log(`[generateNewsReport] Removed duplicates: ${allArticles.length} -> ${uniqueArticles.length} articles`);
    
    // 日付でソート
    const sortedArticles = sortArticlesByDate(uniqueArticles);
    console.log(`[generateNewsReport] Generated report with ${sortedArticles.length} articles`);
    
    console.log(`[generateNewsReport] Report generation successful. Returning ${sortedArticles.length} articles.`);
    return sortedArticles;
  } catch (error) {
    console.error('[generateNewsReport] Failed to generate news report:', error);
    throw error;
  }
}

/**
 * レポートをバックエンドにコールバックする
 * @param {string} callbackUrl コールバックURL
 * @param {Article[]} articles 記事リスト
 * @returns {Promise<void>}
 */
export async function sendReportCallback(callbackUrl: string, articles: Article[]): Promise<void> {
  console.log('[sendReportCallback] Starting report callback...');
  try {
    console.log(`[sendReportCallback] Sending report callback to ${callbackUrl} with ${articles.length} articles`);
    
    // レポートデータを作成
    const reportData: CallbackReport = {
      status: 'COMPLETED',
      report: {
        generatedAt: new Date().toISOString(),
        articles,
      },
    };
    
    // コールバックURLにPOSTリクエスト
    await axios.post(callbackUrl, reportData);
    
    console.log('[sendReportCallback] Report callback sent successfully.');
  } catch (error) {
    console.error('[sendReportCallback] Failed to send report callback (primary attempt):', error);
    
    // エラー時は失敗ステータスを送信
    try {
      console.log('[sendReportCallback] Attempting to send error callback...');
      const errorReport: CallbackReport = {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      await axios.post(callbackUrl, errorReport);
      console.log('[sendReportCallback] Error report callback sent.');
    } catch (callbackError) {
      console.error('[sendReportCallback] Failed to send error callback:', callbackError);
    }
  }
} 