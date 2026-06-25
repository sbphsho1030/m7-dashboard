#!/usr/bin/env node
import path from 'node:path';
import { readJson, writeJson, validateLatest } from './lib/m7-data.js';

const inputPath = process.argv[2];
const outputPathArg = process.argv[3];

if (!inputPath) {
  console.error('Usage: node scripts/generate-draft.js <notes.json> [output-latest.json]');
  console.error('Example: node scripts/generate-draft.js inputs/2026-06-26-notes.json');
  process.exit(1);
}

const notes = readJson(inputPath);
const date = notes.date;
if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
  console.error('notes.date must be YYYY-MM-DD.');
  process.exit(1);
}

const outputPath = outputPathArg || path.join('drafts', `${date}-latest.json`);
const reportId = notes.reportId || `M7-Daily-${date}`;

const latest = {
  schemaVersion: notes.schemaVersion || 'M7-v1.0',
  project: 'm7-dashboard',
  updatedAt: notes.updatedAt || new Date().toISOString(),
  latestDate: date,
  latestReportId: reportId,
  sourceReports: {
    dashboard: 'index.html',
    fullReport: notes.fullReport || `reports/${date.slice(0, 4)}/${date.slice(5, 7)}/${date.slice(8, 10)}-full.html`,
    archive: 'archive.html'
  },
  summary: {
    headline: notes.headline,
    oneLineConclusion: notes.oneLineConclusion || notes.headline,
    recommendedAction: notes.recommendedAction || '觀察',
    directionality: notes.directionality || '未判定',
    killSwitchTriggered: Boolean(notes.killSwitchTriggered),
    nextActionMode: notes.nextActionMode || '條件式'
  },
  riskLights: notes.riskLights || {
    aiCapex: { light: 'yellow', label: 'AI Capex', summary: '待判定' },
    cloudGrowth: { light: 'yellow', label: 'Cloud Growth', summary: '待判定' },
    semiVolatility: { light: 'yellow', label: 'Semi Volatility', summary: '待判定' }
  },
  ranking: notes.ranking,
  eventWatch: notes.eventWatch || [],
  triggerRules: notes.triggerRules || {
    downgrade: ['Capex 上修', 'Cloud growth 放緩', 'FCF margin 下滑'],
    stopAdding: ['M7 同向轉紅', 'QQQ / Nasdaq 破位'],
    panicSellBan: '單日新聞或 index event 不得單獨觸發賣出。'
  },
  dataQuality: {
    marketDataRefreshed: Boolean(notes.marketDataRefreshed),
    status: notes.dataStatus || 'generated_from_daily_notes',
    note: notes.dataQualityNote || '由 daily notes 產生，請確認是否已重新抓取市場資料。'
  }
};

const errors = validateLatest(latest);
if (errors.length) {
  console.error('Generated latest draft is invalid:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

writeJson(outputPath, latest);
console.log(`Generated ${outputPath}`);
console.log(`date: ${latest.latestDate}`);
console.log(`reportId: ${latest.latestReportId}`);
