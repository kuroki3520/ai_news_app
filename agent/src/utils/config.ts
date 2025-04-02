import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import dotenv from 'dotenv';
import { Config } from '../types';

// プロジェクトルートの.envファイルを読み込む
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * config.yamlからアプリケーションの設定を読み込む
 * @returns {Config} 設定オブジェクト
 */
export function loadConfig(): Config {
  try {
    // プロジェクトルートのconfig.yamlファイルのパスを解決
    const configPath = path.resolve(__dirname, '../../../config.yaml');
    
    // ファイルを読み込む
    const fileContents = fs.readFileSync(configPath, 'utf8');
    
    // YAMLをJavaScriptオブジェクトにパース
    const config = yaml.load(fileContents) as Config;
    
    // 環境変数からAPIキーを取得
    if (config.gnews && config.gnews.apiKey === '${GNEWS_API_KEY}') {
      const gnewsApiKey = process.env.GNEWS_API_KEY;
      if (!gnewsApiKey) {
        throw new Error('GNEWS_API_KEY environment variable is not set');
      }
      config.gnews.apiKey = gnewsApiKey;
    }
    
    return config;
  } catch (error) {
    console.error('Failed to load config:', error);
    throw error;
  }
} 