/**
 * 指定された期間の開始日時を計算する
 * @param {string} period 期間指定 (例: "24h", "7d", "30d")
 * @returns {Date} 期間の開始日時
 */
export function calculatePeriodStartDate(period: string): Date {
  const now = new Date();
  const match = period.match(/^(\d+)([hd])$/);
  
  if (!match) {
    throw new Error(`Invalid period format: ${period}. Expected format like "24h" or "7d"`);
  }
  
  const [, value, unit] = match;
  const numValue = parseInt(value, 10);
  
  if (unit === 'h') {
    // 時間単位の場合
    now.setHours(now.getHours() - numValue);
  } else if (unit === 'd') {
    // 日単位の場合
    now.setDate(now.getDate() - numValue);
  }
  
  return now;
}

/**
 * ISO 8601形式の日付文字列を作成
 * @param {Date} date 変換する日付
 * @returns {string} ISO 8601形式の日付文字列
 */
export function formatDateISO(date: Date): string {
  return date.toISOString();
}

/**
 * 日付がperiod内か判定
 * @param {string} dateStr 日付文字列
 * @param {Date} startDate 期間の開始日時
 * @returns {boolean} true:期間内, false:期間外
 */
export function isDateWithinPeriod(dateStr: string, startDate: Date): boolean {
  try {
    const date = new Date(dateStr);
    return date >= startDate;
  } catch (error) {
    console.error(`Invalid date format: ${dateStr}`, error);
    return false;
  }
} 