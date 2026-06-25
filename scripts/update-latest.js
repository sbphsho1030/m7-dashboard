#!/usr/bin/env node
import fs from 'node:fs';
import {
  readJson,
  writeJson,
  validateLatest,
  validateHistory,
  latestToHistoryRecord,
  upsertHistoryRecord
} from './lib/m7-data.js';
import { buildAnalytics } from './lib/m7-analytics.js';

const args = process.argv.slice(2);
const inputPath = args.find((arg) => !arg.startsWith('--'));
const noHistory = args.includes('--no-history');
const dryRun = args.includes('--dry-run');
const RECENT_RETENTION_DAYS = 90;

if (!inputPath) {
  console.error('Usage: node scripts/update-latest.js <new-latest.json> [--no-history] [--dry-run]');
  console.error('Example: node scripts/update-latest.js drafts/2026-06-26-latest.json');
  process.exit(1);
}

function readJsonOrDefault(filePath, fallback) {
  return fs.existsSync(filePath) ? readJson(filePath) : fallback;
}

function monthKey(dateString) {
  return dateString.slice(0, 7);
}

function monthPath(dateString) {
  return `data/history/${monthKey(dateString)}.json`;
}

function defaultHistoryContainer(schemaVersion, description) {
  return {
    schemaVersion,
    project: 'm7-dashboard',
    description,
    updatedAt: new Date().toISOString(),
    records: []
  };
}

function defaultMonthContainer(dateString, schemaVersion) {
  return {
    schemaVersion,
    project: 'm7-dashboard',
    month: monthKey(dateString),
    description: 'Monthly full daily records for M7 Dashboard.',
    updatedAt: new Date().toISOString(),
    records: []
  };
}

function daysBetween(newer, older) {
  const a = new Date(`${newer}T00:00:00Z`);
  const b = new Date(`${older}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000));
}

function trimRecent(records, latestDate, retentionDays = RECENT_RETENTION_DAYS) {
  return records
    .filter((record) => {
      const diff = daysBetween(latestDate, record.date);
      return diff === null || (diff >= 0 && diff <= retentionDays);
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function compactIndexRecord(record, latest) {
  const ranking = latest.ranking || [];
  const top = ranking.slice().sort((a, b) => (b.score ?? -1) - (a.score ?? -1))[0] || ranking[0] || {};
  return {
    date: record.date,
    reportId: record.reportId,
    headline: record.headline,
    recommendedAction: record.recommendedAction,
    topTicker: top.ticker || '',
    topScore: top.score ?? null,
    maxRedStreak: latest.analytics?.maxRedStreak ?? 0,
    monthFile: monthPath(record.date),
    fullReport: record.sourceReports?.fullReport || ''
  };
}

function upsertIndex(index, indexRecord) {
  const records = Array.isArray(index.records) ? index.records : [];
  const key = `${indexRecord.date}__${indexRecord.reportId}`;
  const filtered = records.filter((item) => `${item.date}__${item.reportId}` !== key);
  filtered.unshift(indexRecord);
  return {
    ...index,
    schemaVersion: 'M7-v1.2',
    project: 'm7-dashboard',
    description: 'Compact index for archive navigation. Does not contain full daily records.',
    updatedAt: new Date().toISOString(),
    records: filtered.sort((a, b) => String(b.date).localeCompare(String(a.date)))
  };
}

function validateHistoryIndex(index, latest) {
  const errors = [];
  if (!index || typeof index !== 'object' || Array.isArray(index)) return ['history-index.json must be an object.'];
  if (index.project !== 'm7-dashboard') errors.push('history-index.project must be "m7-dashboard".');
  if (!Array.isArray(index.records)) errors.push('history-index.records must be an array.');
  const keys = new Set();
  for (const [i, item] of (index.records || []).entries()) {
    if (!item.date || !item.reportId) errors.push(`history-index.records[${i}] must have date and reportId.`);
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

function printErrors(title, errors) {
  if (!errors.length) return;
  console.error(`\n${title}`);
  errors.forEach((error) => console.error(`- ${error}`));
}

let nextLatest = readJson(inputPath);
nextLatest.updatedAt = nextLatest.updatedAt || new Date().toISOString();
nextLatest.schemaVersion = nextLatest.schemaVersion || 'M7-v1.2';

let latestErrors = validateLatest(nextLatest);
if (latestErrors.length) {
  printErrors('Input latest snapshot is invalid', latestErrors);
  process.exit(1);
}

const monthlyPath = monthPath(nextLatest.latestDate);
const existingRecent = readJsonOrDefault(
  'data/recent.json',
  defaultHistoryContainer('M7-v1.2', 'Rolling recent cache for Dashboard delta and red-streak calculations.')
);
const existingMonth = readJsonOrDefault(monthlyPath, defaultMonthContainer(nextLatest.latestDate, nextLatest.schemaVersion));
const existingIndex = readJsonOrDefault('data/history-index.json', {
  schemaVersion: 'M7-v1.2',
  project: 'm7-dashboard',
  description: 'Compact index for archive navigation. Does not contain full daily records.',
  updatedAt: new Date().toISOString(),
  records: []
});

let nextRecent = existingRecent;
let nextMonth = existingMonth;
let nextIndex = existingIndex;
let legacyHistory = null;

if (!noHistory) {
  const preAnalyticsRecord = latestToHistoryRecord(nextLatest);
  const preRecent = upsertHistoryRecord(existingRecent, preAnalyticsRecord);
  preRecent.records = trimRecent(preRecent.records, nextLatest.latestDate);
  nextLatest = buildAnalytics(nextLatest, preRecent).latest;
}

latestErrors = validateLatest(nextLatest);
if (latestErrors.length) {
  printErrors('Analytics latest snapshot is invalid', latestErrors);
  process.exit(1);
}

if (!noHistory) {
  const analyticsRecord = latestToHistoryRecord(nextLatest);

  nextRecent = upsertHistoryRecord(existingRecent, analyticsRecord);
  nextRecent.schemaVersion = 'M7-v1.2';
  nextRecent.project = 'm7-dashboard';
  nextRecent.description = 'Rolling recent cache for Dashboard delta and red-streak calculations. Keep about 90 days.';
  nextRecent.retentionDays = RECENT_RETENTION_DAYS;
  nextRecent.records = trimRecent(nextRecent.records, nextLatest.latestDate);

  nextMonth = upsertHistoryRecord(existingMonth, analyticsRecord);
  nextMonth.schemaVersion = 'M7-v1.2';
  nextMonth.project = 'm7-dashboard';
  nextMonth.month = monthKey(nextLatest.latestDate);
  nextMonth.description = 'Monthly full daily records for M7 Dashboard.';
  nextMonth.records = nextMonth.records.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  nextIndex = upsertIndex(existingIndex, compactIndexRecord(analyticsRecord, nextLatest));

  legacyHistory = {
    schemaVersion: 'M7-v1.2-legacy',
    project: 'm7-dashboard',
    description: 'Legacy compatibility file. Full history is split into data/recent.json, data/history-index.json, and data/history/YYYY-MM.json.',
    updatedAt: new Date().toISOString(),
    records: [analyticsRecord]
  };

  const recentErrors = validateHistory(nextRecent, nextLatest);
  const monthErrors = validateHistory(nextMonth, nextLatest);
  const indexErrors = validateHistoryIndex(nextIndex, nextLatest);
  const legacyErrors = validateHistory(legacyHistory, nextLatest);

  printErrors('recent.json validation errors', recentErrors);
  printErrors(`${monthlyPath} validation errors`, monthErrors);
  printErrors('history-index.json validation errors', indexErrors);
  printErrors('legacy history.json validation errors', legacyErrors);

  if (recentErrors.length || monthErrors.length || indexErrors.length || legacyErrors.length) {
    console.error('\nM7 data validation failed.');
    process.exit(1);
  }
}

if (dryRun) {
  console.log('Dry run passed. No files written.');
  console.log(`Would update data/latest.json to ${nextLatest.latestDate} / ${nextLatest.latestReportId}`);
  console.log(`Analytics: max red streak ${nextLatest.analytics?.maxRedStreak ?? 0}`);
  if (!noHistory) {
    console.log(`Would update data/recent.json records: ${nextRecent.records.length}`);
    console.log(`Would update ${monthlyPath} records: ${nextMonth.records.length}`);
    console.log(`Would update data/history-index.json records: ${nextIndex.records.length}`);
  }
  process.exit(0);
}

writeJson('data/latest.json', nextLatest);
if (!noHistory) {
  writeJson('data/recent.json', nextRecent);
  writeJson(monthlyPath, nextMonth);
  writeJson('data/history-index.json', nextIndex);
  writeJson('data/history.json', legacyHistory);
}

console.log(`Updated data/latest.json: ${nextLatest.latestDate} / ${nextLatest.latestReportId}`);
console.log(`Analytics: max red streak ${nextLatest.analytics?.maxRedStreak ?? 0}`);
if (!noHistory) {
  console.log(`Updated data/recent.json records: ${nextRecent.records.length}`);
  console.log(`Updated ${monthlyPath} records: ${nextMonth.records.length}`);
  console.log(`Updated data/history-index.json records: ${nextIndex.records.length}`);
  console.log('Updated data/history.json as compact legacy compatibility file.');
}
