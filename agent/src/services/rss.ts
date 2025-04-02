import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { Article, RssItem, Config } from '../types';
import { isDateWithinPeriod } from '../utils/date';

/**
 * RSSフィードからニュース記事を取得する
 * @param {Config} config 設定オブジェクト
 * @param {Date} fromDate この日付以降の記事を取得
 * @returns {Promise<Article[]>} 取得した記事のリスト
 */
export async function fetchNewsFromRss(config: Config, fromDate: Date): Promise<Article[]> {
  const allArticles: Article[] = [];
  
  // 各RSSフィードから記事を取得
  const feedPromises = config.rss.feeds.map(async (feedUrl) => {
    try {
      console.log(`Fetching news from RSS feed: ${feedUrl}`);
      
      // RSSフィードを取得
      const response = await axios.get(feedUrl);
      
      // XMLをJavaScriptオブジェクトにパース
      const result = await parseStringPromise(response.data, { explicitArray: false });
      
      // フィードのフォーマットに応じて処理
      let items: RssItem[] = [];
      let sourceName = '';
      
      if (result.rss && result.rss.channel) {
        // 標準的なRSSフィード
        sourceName = result.rss.channel.title || 'Unknown Source';
        items = Array.isArray(result.rss.channel.item) 
          ? result.rss.channel.item 
          : result.rss.channel.item ? [result.rss.channel.item] : [];
      } else if (result.feed) {
        // Atom形式のフィード
        sourceName = result.feed.title || 'Unknown Source';
        items = Array.isArray(result.feed.entry) 
          ? result.feed.entry.map((entry: any) => ({
              title: entry.title,
              link: entry.link?._?.href || entry.link,
              pubDate: entry.published || entry.updated,
              description: entry.summary || entry.content,
            })) 
          : result.feed.entry ? [{
              title: result.feed.entry.title,
              link: result.feed.entry.link?._?.href || result.feed.entry.link,
              pubDate: result.feed.entry.published || result.feed.entry.updated,
              description: result.feed.entry.summary || result.feed.entry.content,
            }] : [];
      }
      
      // 記事を変換してフィルタリング
      const articles = items
        .filter(item => {
          // 期間内の記事のみ取得
          const pubDate = item.pubDate;
          return isDateWithinPeriod(pubDate, fromDate);
        })
        .filter(item => {
          // キーワードに一致する記事のみ取得
          const title = item.title?.toLowerCase() || '';
          const description = item.description?.toLowerCase() || '';
          const content = item.content?.toLowerCase() || '';
          
          return config.keywords.some(keyword => {
            const lowerKeyword = keyword.toLowerCase();
            return title.includes(lowerKeyword) || 
                  description.includes(lowerKeyword) || 
                  content.includes(lowerKeyword);
          });
        })
        .map(item => ({
          title: item.title || 'No Title',
          url: item.link,
          source_name: sourceName,
          published_at: item.pubDate,
          // 必要に応じて概要を追加（初期実装では不要）
          // summary: item.description,
        }));
      
      console.log(`RSS feed ${feedUrl} returned ${articles.length} filtered articles`);
      
      return articles;
    } catch (error) {
      console.error(`Failed to fetch news from RSS feed ${feedUrl}:`, error);
      return []; // エラー時は空の配列を返す
    }
  });
  
  // 全てのフィードからの結果を待機
  const results = await Promise.all(feedPromises);
  
  // 結果を結合
  results.forEach(articles => {
    allArticles.push(...articles);
  });
  
  return allArticles;
} 