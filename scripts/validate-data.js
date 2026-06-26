#!/usr/bin/env node
import fs from 'node:fs';
import { M7_TICKERS, readJson, validateLatest, validateHistory } from './lib/m7-data.js';

const latestPath = process.argv[2] || 'data/latest.json';
const recentPath = process.argv[3] || 'data/recent.json';
const indexPath = process.argv[4] || 'data/history-index.json';
const triggerPath = process.argv[5] || 'data/validation-trigger.json';
const dailyPromptPath = 'prompts/m7-daily-update.prompt.md';
const fullReportTemplatePath = 'prompts/m7-full-report-template.md';

function monthPath(dateString) {
  return `data/history/${dateString.slice(0, 7)}.json`;
}

function printErrors(title, errors) {
  if (!errors.length) return;
  console.error(`\n${title}`);
  errors.forEach((error) => console.error(`- ${error}`));
}

function readOrError(filePath, ioErrors, parser = readJson) {
  try {
    return parser(filePath);
  } catch (error) {
    ioErrors.push(`Cannot read ${filePath}: ${error.message}`);
    return null;
  }
}

function readTextOrError(filePath, ioErrors) {
  return readOrError(filePath, ioErrors, (p) => fs.readFileSync(p, 'utf8'));
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function recordsOf(container) {
  return Array.isArray(container?.records) ? container.records : [];
}

function findRecord(container, date, reportId) {
  return recordsOf(container).find((record) => record?.date === date && record?.reportId === reportId) || null;
}

function topScoreRecord(latest) {
  const ranking = latest?.ranking || [];
  return ranking.slice().sort((a, b) => (b.score ?? -1) - (a.score ?? -1))[0] || null;
}

function getLatestIdentity(latest) {
  return {
    date: latest?.latestDate,
    reportId: latest?.latestReportId,
    updatedAt: latest?.updatedAt,
    dataQualityStatus: latest?.dataQuality?.status,
    marketDataFile: latest?.sourceReports?.marketData || latest?.dataQuality?.marketDataFile,
    fullReport: latest?.sourceReports?.fullReport
  };
}

function validatePromptFiles(dailyPromptText, fullReportTemplateText) {
  const errors = [];
  if (!dailyPromptText) errors.push(`${dailyPromptPath} is required.`);
  if (!fullReportTemplateText) errors.push(`${fullReportTemplatePath} is required.`);

  const dailyRequired = [
    'M7 Dashboard 的每日更新目標不是產生一篇新聞摘要',
    'Dashboard 回答：今天要不要動？',
    'Market data ingestion failure or incompleteness degrades dataQuality',
    'data/validation-trigger.json 必須是最後一步更新',
    '只要任一主要檔案未更新成功，不得宣告日更成功'
  ];
  const templateRequired = [
    'M7 Full Report Fixed Template',
    'The task may fill in daily content, data, sources, and analysis, but it must not delete sections',
    '## 一、今日總結',
    '## 六、七檔個股分析',
    '## 九、今日總排序與最終結論',
    'Forbidden Report Failures'
  ];

  for (const text of dailyRequired) {
    if (!dailyPromptText?.includes(text)) errors.push(`${dailyPromptPath} missing required rule text: ${text}`);
  }
  for (const text of templateRequired) {
    if (!fullReportTemplateText?.includes(text)) errors.push(`${fullReportTemplatePath} missing required template text: ${text}`);
  }

  return errors;
}

function validateHistoryIndex(index, latest) {
  const errors = [];
  if (!index || typeof index !== 'object' || Array.isArray(index)) return ['history-index.json must be an object.'];
  if (index.project !== 'm7-dashboard') errors.push('history-index.project must be "m7-dashboard".');
  if (!Array.isArray(index.records)) errors.push('history-index.records must be an array.');

  const keys = new Set();
  for (const [i, item] of (index.records || []).entries()) {
    if (!item.date || !item.reportId) errors.push(`history-index.records[${i}] must have date and reportId.`);
    if (!item.monthFile) errors.push(`history-index.records[${i}].monthFile is required.`);
    const key = `${item.date}__${item.reportId}`;
    if (keys.has(key)) errors.push(`Duplicate history-index record: ${key}.`);
    keys.add(key);
  }

  if (latest?.latestDate && latest?.latestReportId) {
    const latestKey = `${latest.latestDate}__${latest.latestReportId}`;
    const record = findRecord(index, latest.latestDate, latest.latestReportId);
    if (!record) {
      errors.push(`history-index.records does not contain latest record ${latestKey}.`);
    } else {
      const top = topScoreRecord(latest);
      if (record.dataQualityStatus !== latest?.dataQuality?.status) {
        errors.push(`history-index latest record dataQualityStatus (${record.dataQualityStatus}) does not match latest.dataQuality.status (${latest?.dataQuality?.status}).`);
      }
      if (top && record.topTicker !== top.ticker) errors.push(`history-index latest record topTicker (${record.topTicker}) does not match latest topTicker (${top.ticker}).`);
      if (top && record.topScore !== top.score) errors.push(`history-index latest record topScore (${record.topScore}) does not match latest topScore (${top.score}).`);
      if (record.fullReport !== latest?.sourceReports?.fullReport) errors.push('history-index latest record fullReport does not match latest.sourceReports.fullReport.');
      if (record.monthFile !== monthPath(latest.latestDate)) errors.push('history-index latest record monthFile does not match latest month file.');
    }
  }
  return errors;
}

function validateMarketData(marketData, latest) {
  const errors = [];
  const { date, dataQualityStatus } = getLatestIdentity(latest);
  if (!marketData || typeof marketData !== 'object' || Array.isArray(marketData)) return ['market data file must contain a JSON object.'];
  if (marketData.project !== 'm7-dashboard') errors.push('marketData.project must be "m7-dashboard".');
  if (marketData.date !== date) errors.push(`marketData.date (${marketData.date}) does not match latestDate (${date}).`);
  if (marketData.status !== dataQualityStatus) errors.push(`marketData.status (${marketData.status}) does not match latest.dataQuality.status (${dataQualityStatus}).`);
  if (!isObject(marketData.ingestionResult)) {
    errors.push('marketData.ingestionResult is required.');
  } else {
    ['attempted', 'completeOhlcv', 'degraded'].forEach((key) => {
      if (typeof marketData.ingestionResult[key] !== 'boolean') errors.push(`marketData.ingestionResult.${key} must be boolean.`);
    });
    if (typeof marketData.ingestionResult.reason !== 'string' || !marketData.ingestionResult.reason.trim()) {
      errors.push('marketData.ingestionResult.reason must be a non-empty string.');
    }
    if (marketData.ingestionResult.completeOhlcv === false && marketData.ingestionResult.degraded !== true) {
      errors.push('marketData.ingestionResult.degraded must be true when completeOhlcv is false.');
    }
  }
  if (!isObject(marketData.indices)) errors.push('marketData.indices must be an object.');
  if (!isObject(marketData.symbols)) {
    errors.push('marketData.symbols must be an object.');
  } else {
    for (const ticker of M7_TICKERS) {
      const quote = marketData.symbols[ticker];
      if (!isObject(quote)) {
        errors.push(`marketData.symbols.${ticker} is required.`);
        continue;
      }
      ['open', 'high', 'low', 'close', 'volume', 'changePercent'].forEach((field) => {
        if (!(field in quote)) errors.push(`marketData.symbols.${ticker}.${field} field must exist; use null if unavailable.`);
      });
      if (typeof quote.source !== 'string' || !quote.source.trim()) errors.push(`marketData.symbols.${ticker}.source is required.`);
    }
  }
  if (!String(marketData.qualityRule || '').includes('must not fabricate OHLCV')) {
    errors.push('marketData.qualityRule must state that missing OHLCV must not be fabricated.');
  }
  return errors;
}

function validateLatestRecordSync(container, label, latest) {
  const errors = [];
  const { date, reportId, dataQualityStatus, marketDataFile, fullReport } = getLatestIdentity(latest);
  const record = findRecord(container, date, reportId);
  if (!record) return [`${label} does not contain latest record ${date}__${reportId}.`];

  if (record.headline !== latest.summary?.headline) errors.push(`${label} latest record headline does not match latest.summary.headline.`);
  if (record.oneLineConclusion !== latest.summary?.oneLineConclusion) errors.push(`${label} latest record oneLineConclusion does not match latest.summary.oneLineConclusion.`);
  if (record.recommendedAction !== latest.summary?.recommendedAction) errors.push(`${label} latest record recommendedAction does not match latest.summary.recommendedAction.`);
  if (record.sourceReports?.fullReport !== fullReport) errors.push(`${label} latest record fullReport does not match latest.sourceReports.fullReport.`);
  if (record.sourceReports?.marketData !== marketDataFile) errors.push(`${label} latest record marketData reference does not match latest.`);
  if (record.dataQuality?.status !== dataQualityStatus) errors.push(`${label} latest record dataQuality.status does not match latest.`);
  return errors;
}

function validateValidationTrigger(trigger, latest) {
  const errors = [];
  const { date, reportId, updatedAt, dataQualityStatus, marketDataFile, fullReport } = getLatestIdentity(latest);
  if (!trigger || typeof trigger !== 'object' || Array.isArray(trigger)) return [`${triggerPath} must contain a JSON object.`];

  if (trigger.project !== 'm7-dashboard') errors.push('validation-trigger.project must be "m7-dashboard".');
  if (trigger.date !== date) errors.push(`validation-trigger.date (${trigger.date}) does not match latestDate (${date}).`);
  if (trigger.reportId !== reportId) errors.push(`validation-trigger.reportId (${trigger.reportId}) does not match latestReportId (${reportId}).`);
  if (trigger.dataQualityExpected !== dataQualityStatus) errors.push(`validation-trigger.dataQualityExpected (${trigger.dataQualityExpected}) does not match latest.dataQuality.status (${dataQualityStatus}).`);
  if (!trigger.updatedAt || String(trigger.updatedAt) < String(updatedAt)) {
    errors.push(`validation-trigger.updatedAt (${trigger.updatedAt}) must be equal to or later than latest.updatedAt (${updatedAt}).`);
  }

  const filesExpected = new Set(Array.isArray(trigger.filesExpected) ? trigger.filesExpected : []);
  const requiredFiles = [
    'index.html',
    latestPath,
    recentPath,
    indexPath,
    monthPath(date),
    'data/history.json',
    marketDataFile,
    fullReport,
    dailyPromptPath,
    fullReportTemplatePath
  ].filter(Boolean);

  for (const filePath of requiredFiles) {
    if (!filesExpected.has(filePath)) errors.push(`validation-trigger.filesExpected missing ${filePath}.`);
  }

  const rules = Array.isArray(trigger.marketDataRulesExpected) ? trigger.marketDataRulesExpected.join('\n') : '';
  if (!rules.includes('partial market data degrades dataQuality') || !rules.includes('missing OHLCV fields remain null')) {
    errors.push('validation-trigger.marketDataRulesExpected must include fallback and no-fabrication rules.');
  }

  const reflexive = Array.isArray(trigger.reflexiveChecksExpected) ? trigger.reflexiveChecksExpected.join('\n') : '';
  if (!reflexive.includes('Reflexive') && !reflexive.includes('反身')) {
    errors.push('validation-trigger.reflexiveChecksExpected must mention the reflexive check.');
  }

  return errors;
}

function validateFullReport(latest) {
  const errors = [];
  const fullReport = latest?.sourceReports?.fullReport;
  const dataQualityStatus = latest?.dataQuality?.status;
  const marketDataFile = latest?.sourceReports?.marketData || latest?.dataQuality?.marketDataFile;

  if (!fullReport) return ['latest.sourceReports.fullReport is required.'];
  if (!fs.existsSync(fullReport)) return [`full report does not exist: ${fullReport}`];

  const html = fs.readFileSync(fullReport, 'utf8');
  const isFormal = String(dataQualityStatus || '').includes('formal') || String(latest?.summary?.headline || '').includes('正式');
  const forbiddenFormalTerms = ['pre-run', 'Pre-run', 'PRE-RUN', '等待正式版', '正式日更可覆蓋', '會覆蓋'];
  const forbiddenSections = ['九、Dashboard / Task 成功標準', '六、個股分層', '五、壓力測試'];
  const requiredSections = [
    '一、今日總結',
    '二、M7 主決策表',
    '三、Market-data ingestion 結果',
    '四、現金流與 AI Capex 檢查',
    '五、市場與新聞摘要',
    '六、七檔個股分析',
    '七、前瞻性壓力測試',
    '八、反身性檢查',
    '九、今日總排序與最終結論',
    '十、資料來源與限制'
  ];
  const requiredConcepts = ['AI Capex', 'FCF', 'Micron', 'OHLCV', '不假造'];
  const requiredNavigation = ['回 Dashboard', '歷史報告', '上一日報告', '回到頁首'];
  const requiredSourceDomains = ['reuters.com', 'apnews.com', 'marketwatch.com'];

  if (!html.includes(latest.latestDate)) errors.push(`full report ${fullReport} does not include latestDate ${latest.latestDate}.`);
  if (!html.includes(latest.latestReportId)) errors.push(`full report ${fullReport} does not include latestReportId ${latest.latestReportId}.`);
  if (latest.updatedAt && !html.includes(latest.updatedAt)) errors.push(`full report ${fullReport} should include generated/updated timestamp ${latest.updatedAt}.`);
  if (dataQualityStatus && !html.includes(dataQualityStatus)) errors.push(`full report ${fullReport} does not include dataQuality.status ${dataQualityStatus}.`);
  if (marketDataFile && !html.includes(marketDataFile)) errors.push(`full report ${fullReport} does not reference market data file ${marketDataFile}.`);
  if (latest.summary?.recommendedAction && !html.includes(latest.summary.recommendedAction)) {
    errors.push(`full report ${fullReport} does not include recommendedAction ${latest.summary.recommendedAction}.`);
  }

  const top = topScoreRecord(latest);
  if (top) {
    if (!html.includes(top.ticker)) errors.push(`full report ${fullReport} does not include topTicker ${top.ticker}.`);
    if (!html.includes(String(top.score))) errors.push(`full report ${fullReport} does not include topScore ${top.score}.`);
  }

  for (const section of requiredSections) {
    if (!html.includes(section)) errors.push(`full report ${fullReport} missing required section: ${section}`);
  }
  for (const section of forbiddenSections) {
    if (html.includes(section)) errors.push(`full report ${fullReport} contains forbidden section: ${section}`);
  }
  for (const concept of requiredConcepts) {
    if (!html.includes(concept)) errors.push(`full report ${fullReport} missing required concept: ${concept}`);
  }
  for (const nav of requiredNavigation) {
    if (!html.includes(nav)) errors.push(`full report ${fullReport} missing navigation text: ${nav}`);
  }
  for (const domain of requiredSourceDomains) {
    if (!html.includes(domain)) errors.push(`full report ${fullReport} missing source link domain: ${domain}`);
  }
  if (!html.includes('target="_blank"') || !html.includes('rel="noopener"')) {
    errors.push(`full report ${fullReport} source links should open safely with target="_blank" and rel="noopener".`);
  }

  for (const ticker of ['GOOGL', 'NVDA', 'MSFT', 'META', 'AMZN', 'AAPL', 'TSLA']) {
    const tickerBlockPattern = new RegExp(`<h3[^>]*>${ticker}<\\/h3>[\\s\\S]{120,1600}?(Facts|Interpretation|Risk|Action|Observation|Score|新資金|風險)`, 'i');
    if (!tickerBlockPattern.test(html)) {
      errors.push(`full report ${fullReport} missing ticker-specific analysis block for ${ticker}.`);
    }
  }

  if (html.length < 18000) errors.push(`full report ${fullReport} is too short to be a complete research brief (${html.length} chars).`);

  if (isFormal) {
    for (const term of forbiddenFormalTerms) {
      if (html.includes(term)) errors.push(`formal full report ${fullReport} still contains forbidden pre-run term: ${term}`);
    }
  }

  return errors;
}

const ioErrors = [];
const latest = readOrError(latestPath, ioErrors);
const recent = readOrError(recentPath, ioErrors);
const index = readOrError(indexPath, ioErrors);
const monthlyPath = latest?.latestDate ? monthPath(latest.latestDate) : null;
const monthly = monthlyPath ? readOrError(monthlyPath, ioErrors) : null;
const legacyHistory = fs.existsSync('data/history.json') ? readOrError('data/history.json', ioErrors) : null;
const marketDataPath = latest?.sourceReports?.marketData || latest?.dataQuality?.marketDataFile || null;
const marketData = marketDataPath ? readOrError(marketDataPath, ioErrors) : null;
const trigger = readOrError(triggerPath, ioErrors);
const dailyPromptText = readTextOrError(dailyPromptPath, ioErrors);
const fullReportTemplateText = readTextOrError(fullReportTemplatePath, ioErrors);

if (ioErrors.length) {
  printErrors('I/O errors', ioErrors);
  process.exit(1);
}

const latestErrors = validateLatest(latest);
const recentErrors = validateHistory(recent, latest).concat(validateLatestRecordSync(recent, 'recent.json', latest));
const indexErrors = validateHistoryIndex(index, latest);
const monthlyErrors = validateHistory(monthly, latest).concat(validateLatestRecordSync(monthly, monthlyPath, latest));
const legacyErrors = legacyHistory ? validateHistory(legacyHistory, latest).concat(validateLatestRecordSync(legacyHistory, 'legacy history.json', latest)) : [];
const marketDataErrors = validateMarketData(marketData, latest);
const triggerErrors = validateValidationTrigger(trigger, latest);
const promptErrors = validatePromptFiles(dailyPromptText, fullReportTemplateText);
const fullReportErrors = validateFullReport(latest);

printErrors('latest.json validation errors', latestErrors);
printErrors('recent.json validation errors', recentErrors);
printErrors('history-index.json validation errors', indexErrors);
printErrors(`${monthlyPath} validation errors`, monthlyErrors);
printErrors('legacy history.json validation errors', legacyErrors);
printErrors(`${marketDataPath} validation errors`, marketDataErrors);
printErrors('validation-trigger.json validation errors', triggerErrors);
printErrors('prompt/template validation errors', promptErrors);
printErrors('full report validation errors', fullReportErrors);

const allErrors = [
  ...latestErrors,
  ...recentErrors,
  ...indexErrors,
  ...monthlyErrors,
  ...legacyErrors,
  ...marketDataErrors,
  ...triggerErrors,
  ...promptErrors,
  ...fullReportErrors
];

if (allErrors.length) {
  console.error('\nM7 data validation failed.');
  process.exit(1);
}

console.log('M7 data validation passed.');
console.log(`latest: ${latest.latestDate} / ${latest.latestReportId}`);
console.log(`dataQuality: ${latest.dataQuality.status}`);
console.log(`market data: ${marketDataPath}`);
console.log(`recent records: ${recent.records.length}`);
console.log(`history-index records: ${index.records.length}`);
console.log(`${monthlyPath} records: ${monthly.records.length}`);
console.log(`full report: ${latest.sourceReports.fullReport}`);
console.log(`validation trigger: ${triggerPath}`);
if (legacyHistory) console.log(`legacy history records: ${legacyHistory.records.length}`);
