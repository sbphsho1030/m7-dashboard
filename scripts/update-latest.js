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

const args = process.argv.slice(2);
const inputPath = args.find((arg) => !arg.startsWith('--'));
const noHistory = args.includes('--no-history');
const dryRun = args.includes('--dry-run');

if (!inputPath) {
  console.error('Usage: node scripts/update-latest.js <new-latest.json> [--no-history] [--dry-run]');
  console.error('Example: node scripts/update-latest.js drafts/2026-06-26-latest.json');
  process.exit(1);
}

const nextLatest = readJson(inputPath);
nextLatest.updatedAt = nextLatest.updatedAt || new Date().toISOString();

const latestErrors = validateLatest(nextLatest);
if (latestErrors.length) {
  console.error('Input latest snapshot is invalid:');
  latestErrors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

let nextHistory = null;
if (!noHistory) {
  const existingHistory = fs.existsSync('data/history.json')
    ? readJson('data/history.json')
    : {
        schemaVersion: nextLatest.schemaVersion,
        project: 'm7-dashboard',
        description: 'Structured daily M7 decision records for GitHub Pages dashboard.',
        updatedAt: new Date().toISOString(),
        records: []
      };

  const record = latestToHistoryRecord(nextLatest);
  nextHistory = upsertHistoryRecord(existingHistory, record);

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
  if (nextHistory) console.log(`Would update data/history.json records: ${nextHistory.records.length}`);
  process.exit(0);
}

writeJson('data/latest.json', nextLatest);
if (nextHistory) writeJson('data/history.json', nextHistory);

console.log(`Updated data/latest.json: ${nextLatest.latestDate} / ${nextLatest.latestReportId}`);
if (nextHistory) console.log(`Updated data/history.json records: ${nextHistory.records.length}`);
