// ニュース記事の型
export interface Article {
  title: string;
  url: string;
  source_name: string;
  published_at: string;
  summary?: string;
}

// GNewsの記事レスポンス型
export interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

// GNewsのAPIレスポンス型
export interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

// RSSフィードのアイテム型
export interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  content?: string;
  source?: {
    name: string;
    url: string;
  };
}

// 設定ファイルの型
export interface Config {
  gnews: {
    apiKey: string;
    language: string;
    country: string;
  };
  rss: {
    feeds: string[];
  };
  keywords: string[];
}

// 生成レポートリクエストの型
export interface GenerateReportRequest {
  period: string;
  callbackUrl: string;
}

// コールバックレポートの型
export interface CallbackReport {
  status: 'COMPLETED' | 'FAILED';
  report?: {
    generatedAt: string;
    articles: Article[];
  };
  error?: string;
} 