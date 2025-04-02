import axios from 'axios';
import { Article, GNewsResponse, Config } from '../types';
import { formatDateISO } from '../utils/date';

/**
 * GNews APIからニュース記事を取得する
 * @param {Config} config 設定オブジェクト
 * @param {Date} fromDate この日付以降の記事を取得
 * @returns {Promise<Article[]>} 取得した記事のリスト
 */
export async function fetchNewsFromGNews(config: Config, fromDate: Date): Promise<Article[]> {
  try {
    // キーワードをクエリに変換（OR検索）
    const keywords = config.keywords.join(' OR ');
    
    // GNews API URL
    const url = 'https://gnews.io/api/v4/search';
    
    // パラメータ
    const params = {
      q: keywords,
      lang: config.gnews.language,
      country: config.gnews.country,
      max: 100, // 最大取得数
      apikey: config.gnews.apiKey,
      from: formatDateISO(fromDate),
    };
    
    console.log(`Fetching news from GNews API with params: ${JSON.stringify(params, null, 2)}`);
    
    // リクエスト送信
    const response = await axios.get<GNewsResponse>(url, { params });
    
    console.log(`GNews API returned ${response.data.totalArticles} articles`);
    
    // レスポンスから記事を変換
    const articles = response.data.articles.map(article => ({
      title: article.title,
      url: article.url,
      source_name: article.source.name,
      published_at: article.publishedAt,
      // 必要に応じて概要を追加（初期実装では不要）
      // summary: article.description,
    }));
    
    return articles;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(`GNews API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
      console.error('Failed to fetch news from GNews API:', error);
    }
    return []; // エラー時は空の配列を返す
  }
} 