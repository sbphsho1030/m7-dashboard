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

if (!inputPath) {
  console.error('Usage: node scripts/update-latest.js <new-latest.json> [--no-history] [--dry-run]');
  console.error('Example: node scripts/update-latest.js drafts/2026-06-26-latest.json');
  process.exit(1);
}

let nextLatest = readJson(inputPath);
nextLatest.updatedAt = nextLatest.updatedAt || new Date().toISOString();

let latestErrors = validateLatest(nextLatest);
if (latestErrors.length) {
  console.error('Input latest snapshot is invalid:');
  latestErrors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const existingHistory = fs.existsSync('data/history.json')
  ? readJson('data/history.json')
  : {
      schemaVersion: nextLatest.schemaVersion,
      project: 'm7-dashboard',
      description: 'Structured daily M7 decision records for GitHub Pages dashboard.',
      updatedAt: new Date().toISOString(),
      records: []
    };

let nextHistory = existingHistory;
if (!noHistory) {
  const preAnalyticsRecord = latestToHistoryRecord(nextLatest);
  nextHistory = upsertHistoryRecord(existingHistory, preAnalyticsRecord);
}

nextLatest = buildAnalytics(nextLatest, nextHistory).latest;
latestErrors = validateLatest(nextLatest);
if (latestErrors.length) {
  console.error('Analytics latest snapshot is invalid:');
  latestErrors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

if (!noHistory) {
  const analyticsRecord = latestToHistoryRecord(nextLatest);
  nextHistory = upsertHistoryRecord(existingHistory, analyticsRecord);
  const historyErrors = validateHistory(nextHistory, nextLatest);
  if (historyErrors.length) {
    console.error('Generated history.json is invalid:');
    historyErrors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
}

if (dryRun) {
  console.log('Dry run passed. No files written.');
  console.log(`Would update data/latest.json to ${nextLatest.latestDate} / ${nextLatest.latestReportId}`);
  console.log(`Analytics: max red streak ${nextLatest.analytics?.maxRedStreak ?? 0}`);
  if (!noHistory) console.log(`Would update data/history.json records: ${nextHistory.records.length}`);
  process.exit(0);
}

writeJson('data/latest.json', nextLatest);
if (!noHistory) writeJson('data/history.json', nextHistory);

console.log(`Updated data/latest.json: ${nextLatest.latestDate} / ${nextLatest.latestReportId}`);
console.log(`Analytics: max red streak ${nextLatest.analytics?.maxRedStreak ?? 0}`);
if (!noHistory) console.log(`Updated data/history.json records: ${nextHistory.records.length}`);
