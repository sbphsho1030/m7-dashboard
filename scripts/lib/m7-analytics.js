const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(a, b) {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return null;
  return Math.round((da.getTime() - db.getTime()) / MS_PER_DAY);
}

function recordDate(record) {
  return record?.date || record?.latestDate || null;
}

function getRecordRanking(record) {
  return record?.m7Ranking || record?.ranking || [];
}

function getRiskLight(item) {
  return item?.riskLight || item?.light || null;
}

function compareDateDesc(a, b) {
  return String(recordDate(b)).localeCompare(String(recordDate(a)));
}

function nearestRecordOnOrBefore(records, targetDate, excludeDate) {
  return records
    .filter((record) => recordDate(record) && recordDate(record) !== excludeDate && recordDate(record) <= targetDate)
    .sort(compareDateDesc)[0] || null;
}

function rankMap(record) {
  const map = new Map();
  getRecordRanking(record).forEach((item) => {
    if (item?.ticker && Number.isInteger(item.rank)) map.set(item.ticker, item.rank);
  });
  return map;
}

function addDays(dateString, days) {
  const date = parseDate(dateString);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function redStreakDays(records, latestDate, ticker) {
  const sorted = records
    .filter((record) => recordDate(record) && recordDate(record) <= latestDate)
    .sort(compareDateDesc);

  let streak = 0;
  for (const record of sorted) {
    const item = getRecordRanking(record).find((x) => x.ticker === ticker);
    if (!item || getRiskLight(item) !== 'red') break;
    streak += 1;
  }
  return streak;
}

function formatRankDelta(delta) {
  if (delta === null || delta === undefined) return null;
  if (delta > 0) return `+${delta} ranking`;
  if (delta < 0) return `${delta} ranking`;
  return '0 ranking';
}

export function buildAnalytics(latest, history) {
  const records = Array.isArray(history?.records) ? history.records : [];
  const latestDate = latest.latestDate;
  const latestRecord = {
    date: latest.latestDate,
    reportId: latest.latestReportId,
    ranking: latest.ranking
  };
  const allRecords = [latestRecord, ...records.filter((record) => `${recordDate(record)}__${record.reportId}` !== `${latest.latestDate}__${latest.latestReportId}`)];
  const weekTarget = addDays(latestDate, -7);
  const monthTarget = addDays(latestDate, -30);
  const weekRecord = weekTarget ? nearestRecordOnOrBefore(records, weekTarget, latestDate) : null;
  const monthRecord = monthTarget ? nearestRecordOnOrBefore(records, monthTarget, latestDate) : null;
  const weekRanks = weekRecord ? rankMap(weekRecord) : null;
  const monthRanks = monthRecord ? rankMap(monthRecord) : null;

  const ranking = latest.ranking.map((item) => {
    const weekBase = weekRanks?.get(item.ticker);
    const monthBase = monthRanks?.get(item.ticker);
    const rankChangeWeek = Number.isInteger(weekBase) ? weekBase - item.rank : null;
    const rankChangeMonth = Number.isInteger(monthBase) ? monthBase - item.rank : null;
    const streak = redStreakDays(allRecords, latestDate, item.ticker);
    const notes = [];
    if (rankChangeWeek === null) notes.push('週排名基準不足');
    if (rankChangeMonth === null) notes.push('月排名基準不足');
    if (streak >= 3) notes.push(`紅燈連續 ${streak} 天，需檢查系統性風險`);
    if (!notes.length) notes.push('Delta 已計算');

    return {
      ...item,
      weeklyDelta: formatRankDelta(rankChangeWeek),
      monthlyDelta: formatRankDelta(rankChangeMonth),
      rankChangeWeek,
      rankChangeMonth,
      redStreakDays: streak,
      deltaNote: notes.join('；')
    };
  });

  const redNames = ranking.filter((item) => item.riskLight === 'red').map((item) => item.ticker);
  const yellowNames = ranking.filter((item) => item.riskLight === 'yellow').map((item) => item.ticker);
  const maxRedStreak = Math.max(0, ...ranking.map((item) => item.redStreakDays || 0));

  return {
    latest: {
      ...latest,
      ranking,
      analytics: {
        generatedAt: new Date().toISOString(),
        baseline: {
          weekTarget,
          monthTarget,
          weekRecord: weekRecord ? { date: recordDate(weekRecord), reportId: weekRecord.reportId } : null,
          monthRecord: monthRecord ? { date: recordDate(monthRecord), reportId: monthRecord.reportId } : null
        },
        redNames,
        yellowNames,
        maxRedStreak,
        notes: [
          weekRecord ? '週 Delta 已有基準資料' : '週 Delta 尚無 7 日前基準資料',
          monthRecord ? '月 Delta 已有基準資料' : '月 Delta 尚無 30 日前基準資料'
        ]
      }
    }
  };
}
