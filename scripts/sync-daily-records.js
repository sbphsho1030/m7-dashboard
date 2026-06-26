#!/usr/bin/env node
import { readJson, writeJson, latestToHistoryRecord } from './lib/m7-data.js';

function monthPath(dateString) {
  return `data/history/${dateString.slice(0, 7)}.json`;
}

function upsert(records, record) {
  const key = `${record.date}__${record.reportId}`;
  return [record, ...(Array.isArray(records) ? records : []).filter((item) => `${item.date}__${item.reportId}` !== key)];
}

function readOrDefault(path, fallback) {
  try {
    return readJson(path);
  } catch {
    return fallback;
  }
}

const latest = readJson('data/latest.json');
const record = latestToHistoryRecord(latest);
const monthlyPath = monthPath(latest.latestDate);

const recent = readOrDefault('data/recent.json', {
  schemaVersion: 'M7-v1.2',
  project: 'm7-dashboard',
  description: 'Rolling recent cache for Dashboard delta and red-streak calculations. Keep about 90 days.',
  retentionDays: 90,
  records: []
});
writeJson('data/recent.json', {
  ...recent,
  updatedAt: latest.updatedAt,
  records: upsert(recent.records, record).slice(0, recent.retentionDays || 90)
});

const monthly = readOrDefault(monthlyPath, {
  schemaVersion: 'M7-v1.2',
  project: 'm7-dashboard',
  month: latest.latestDate.slice(0, 7),
  description: 'Monthly full daily records for M7 Dashboard.',
  records: []
});
writeJson(monthlyPath, {
  ...monthly,
  updatedAt: latest.updatedAt,
  records: upsert(monthly.records, record)
});

const legacy = readOrDefault('data/history.json', {
  schemaVersion: 'M7-v1.2-legacy',
  project: 'm7-dashboard',
  description: 'Legacy compatibility file. Full history is split into data/recent.json, data/history-index.json, and data/history/YYYY-MM.json.',
  records: []
});
writeJson('data/history.json', {
  ...legacy,
  updatedAt: latest.updatedAt,
  records: upsert(legacy.records, record).slice(0, 30)
});

console.log(`Synced daily records for ${latest.latestDate} / ${latest.latestReportId}`);
console.log(`recent: data/recent.json`);
console.log(`monthly: ${monthlyPath}`);
console.log('legacy: data/history.json');
