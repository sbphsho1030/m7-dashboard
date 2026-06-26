#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const errors = [];
const warnings = [];

function read(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    errors.push(`Missing required file: ${rel}`);
    return null;
  }
  return fs.readFileSync(full, 'utf8');
}

function readJson(rel) {
  const text = read(rel);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    errors.push(`Invalid JSON: ${rel} (${err.message})`);
    return null;
  }
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function warn(condition, message) {
  if (!condition) warnings.push(message);
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function normalize(text) {
  return text.replace(/\s+/g, ' ');
}

function findLatestFullReport() {
  const latest = readJson('data/latest.json');
  const index = readJson('data/history-index.json');

  const candidates = [];

  if (latest?.sourceReports?.fullReport) {
    candidates.push(latest.sourceReports.fullReport);
  }

  if (latest?.sourceReports?.fullReportPath) {
    candidates.push(latest.sourceReports.fullReportPath);
  }

  if (Array.isArray(index?.records)) {
    for (const record of index.records) {
      if (record.fullReport) candidates.push(record.fullReport);
    }
  }

  const unique = [...new Set(candidates)].filter(Boolean);
  for (const rel of unique) {
    if (fs.existsSync(path.join(root, rel))) return rel;
  }

  errors.push(`Cannot resolve latest full report from data/latest.json or data/history-index.json. Candidates: ${unique.join(', ') || '(none)'}`);
  return null;
}

function validateGovernanceFiles() {
  const required = [
    'prompts/m7-product-rules.md',
    'prompts/m7-change-log.md',
    'prompts/m7-full-report-template.md',
  ];

  for (const rel of required) {
    const text = read(rel);
    if (!text) continue;
    warn(text.length > 300, `${rel} is unexpectedly short.`);
  }
}

function validateDashboard() {
  const html = read('index.html');
  if (!html) return;
  const compact = normalize(html).toLowerCase();

  assert(html.includes('M7 Decision Control Dashboard'), 'index.html title must include "M7 Decision Control Dashboard".');
  assert(!compact.includes('<iframe'), 'index.html must not contain <iframe. Dashboard cannot be an iframe shell.');
  assert(html.includes('fullReportLink') || html.includes('sourceReports.fullReport'), 'index.html should expose or derive a Full Report link.');
  assert(html.includes('data/latest.json') || html.includes('latest.json'), 'index.html should read or reference data/latest.json.');
}

function validateFullReport(rel) {
  const html = read(rel);
  if (!html) return;

  const compact = normalize(html);
  const lower = compact.toLowerCase();

  assert(!lower.includes('<iframe'), `${rel} must not contain <iframe.`);

  const topPart = html.slice(0, Math.min(html.length, 7000));
  const bottomPart = html.slice(Math.max(0, html.length - 5000));

  assert(topPart.includes('回 Dashboard'), `${rel} top navigation must include 回 Dashboard.`);
  assert(topPart.includes('歷史報告'), `${rel} top navigation must include 歷史報告.`);
  assert(topPart.includes('上一日報告') || topPart.includes('archive.html'), `${rel} top navigation must include 上一日報告 or explain/link archive when previous report is unavailable.`);
  assert(bottomPart.includes('回 Dashboard'), `${rel} bottom navigation must include 回 Dashboard.`);
  assert(bottomPart.includes('歷史報告'), `${rel} bottom navigation must include 歷史報告.`);
  assert(bottomPart.includes('回到頁首') || bottomPart.includes('#top'), `${rel} bottom navigation must include 回到頁首 / #top.`);

  const sections = [
    '一、今日總結',
    '二、M7 主決策表',
    '三、Market-data ingestion 結果',
    '四、現金流與 AI Capex 檢查',
    '五、市場與新聞摘要',
    '六、七檔個股分析',
    '七、前瞻性壓力測試',
    '八、反身性檢查',
    '九、今日總排序與最終結論',
    '十、資料來源與限制',
  ];

  for (const section of sections) {
    assert(html.includes(section), `${rel} missing required section: ${section}`);
  }

  const tickers = ['GOOGL', 'NVDA', 'MSFT', 'META', 'AMZN', 'AAPL', 'TSLA'];
  for (const ticker of tickers) {
    assert(html.includes(ticker), `${rel} missing ticker-specific coverage for ${ticker}.`);
  }

  assert(includesAny(html, ['dataQuality.status', 'dataQuality=', 'formal_partial_market_data', 'formal_full_market_data', 'repo_format_test']), `${rel} must include data-quality status.`);
  assert(includesAny(html, ['不假造 OHLCV', 'missing OHLCV was not fabricated', '不補猜', '缺失欄位保持 null', '缺失欄位維持 null']), `${rel} must explicitly state that missing OHLCV is not fabricated.`);

  const anchorCount = (html.match(/<a\s+/gi) || []).length;
  const safeAnchorCount = (html.match(/<a\s+[^>]*target=["']_blank["'][^>]*rel=["']noopener["']/gi) || []).length;
  warn(anchorCount === 0 || safeAnchorCount > 0, `${rel} has links, but none use target="_blank" rel="noopener".`);
}

function validateArchive() {
  const index = readJson('data/history-index.json');
  if (!index) return;

  assert(index.schemaVersion, 'data/history-index.json must include schemaVersion.');
  assert(Array.isArray(index.records), 'data/history-index.json must include records array.');

  if (Array.isArray(index.records)) {
    for (const record of index.records) {
      const reportId = String(record.reportId || '');
      const status = String(record.dataQualityStatus || '');
      const headline = String(record.headline || '');
      const looksLikeTest = /test|測試|repo_format_test|full dashboard test/i.test(`${reportId} ${status} ${headline}`);
      warn(!looksLikeTest, `Archive record may be test-only; confirm it should be formal: ${record.date || '(no date)'} ${reportId}`);
    }
  }
}

function validateAllFormalReportsIfRequested() {
  if (!process.argv.includes('--all')) return;
  const reportsRoot = path.join(root, 'reports');
  if (!fs.existsSync(reportsRoot)) return;

  const files = [];
  function walk(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (item.endsWith('-full.html')) files.push(path.relative(root, full).replace(/\\/g, '/'));
    }
  }
  walk(reportsRoot);
  for (const file of files) validateFullReport(file);
}

validateGovernanceFiles();
validateDashboard();
const latestFullReport = findLatestFullReport();
if (latestFullReport) validateFullReport(latestFullReport);
validateArchive();
validateAllFormalReportsIfRequested();

console.log('M7 layout validation');
console.log(`Latest full report: ${latestFullReport || '(not resolved)'}`);

if (warnings.length) {
  console.log('\nWarnings:');
  for (const item of warnings) console.log(`- ${item}`);
}

if (errors.length) {
  console.error('\nErrors:');
  for (const item of errors) console.error(`- ${item}`);
  process.exit(1);
}

console.log('\nPASS: Dashboard / Full Report / Archive layout gate passed.');
