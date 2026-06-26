#!/usr/bin/env node
import fs from 'node:fs';
import { readJson, validateLatest, validateHistory } from './lib/m7-data.js';

const latestPath = process.argv[2] || 'data/latest.json';
const recentPath = process.argv[3] || 'data/recent.json';
const indexPath = process.argv[4] || 'data/history-index.json';

function monthPath(dateString) {
  return `data/history/${dateString.slice(0, 7)}.json`;
}

function printErrors(title, errors) {
  if (!errors.length) return;
  console.error(`\n${title}`);
  errors.forEach((error) => console.error(`- ${error}`));
}

function readOrError(filePath, ioErrors) {
  try {
    return readJson(filePath);
  } catch (error) {
    ioErrors.push(`Cannot read ${filePath}: ${error.message}`);
    return null;
  }
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
    if (!keys.has(latestKey)) errors.push(`history-index.records does not contain latest record ${latestKey}.`);
  }
  return errors;
}

function topScoreRecord(latest) {
  const ranking = latest?.ranking || [];
  return ranking.slice().sort((a, b) => (b.score ?? -1) - (a.score ?? -1))[0] || null;
}

function validateFullReport(latest) {
  const errors = [];
  const fullReport = latest?.sourceReports?.fullReport;
  if (!fullReport) return ['latest.sourceReports.fullReport is required.'];
  if (!fs.existsSync(fullReport)) return [`full report does not exist: ${fullReport}`];

  const html = fs.readFileSync(fullReport, 'utf8');
  const isFormal = String(latest?.dataQuality?.status || '').includes('formal') || String(latest?.summary?.headline || '').includes('正式');
  const forbiddenFormalTerms = ['pre-run', 'Pre-run', 'PRE-RUN', '等待正式版', '正式日更可覆蓋', '會覆蓋'];

  if (!html.includes(latest.latestDate)) errors.push(`full report ${fullReport} does not include latestDate ${latest.latestDate}.`);
  if (!html.includes(latest.latestReportId)) errors.push(`full report ${fullReport} does not include latestReportId ${latest.latestReportId}.`);
  if (latest.summary?.recommendedAction && !html.includes(latest.summary.recommendedAction)) {
    errors.push(`full report ${fullReport} does not include recommendedAction ${latest.summary.recommendedAction}.`);
  }

  const top = topScoreRecord(latest);
  if (top) {
    if (!html.includes(top.ticker)) errors.push(`full report ${fullReport} does not include topTicker ${top.ticker}.`);
    if (!html.includes(String(top.score))) errors.push(`full report ${fullReport} does not include topScore ${top.score}.`);
  }

  if (isFormal) {
    if (!html.includes('正式版')) errors.push(`formal full report ${fullReport} must include 正式版.`);
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

if (ioErrors.length) {
  printErrors('I/O errors', ioErrors);
  process.exit(1);
}

const latestErrors = validateLatest(latest);
const recentErrors = validateHistory(recent, latest);
const indexErrors = validateHistoryIndex(index, latest);
const monthlyErrors = validateHistory(monthly, latest);
const legacyErrors = legacyHistory ? validateHistory(legacyHistory, latest) : [];
const fullReportErrors = validateFullReport(latest);

printErrors('latest.json validation errors', latestErrors);
printErrors('recent.json validation errors', recentErrors);
printErrors('history-index.json validation errors', indexErrors);
printErrors(`${monthlyPath} validation errors`, monthlyErrors);
printErrors('legacy history.json validation errors', legacyErrors);
printErrors('full report reflexive validation errors', fullReportErrors);

if (latestErrors.length || recentErrors.length || indexErrors.length || monthlyErrors.length || legacyErrors.length || fullReportErrors.length) {
  console.error('\nM7 data validation failed.');
  process.exit(1);
}

console.log('M7 data validation passed.');
console.log(`latest: ${latest.latestDate} / ${latest.latestReportId}`);
console.log(`recent records: ${recent.records.length}`);
console.log(`history-index records: ${index.records.length}`);
console.log(`${monthlyPath} records: ${monthly.records.length}`);
console.log(`full report: ${latest.sourceReports.fullReport}`);
if (legacyHistory) console.log(`legacy history records: ${legacyHistory.records.length}`);
