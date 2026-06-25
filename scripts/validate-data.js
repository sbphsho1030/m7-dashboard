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

printErrors('latest.json validation errors', latestErrors);
printErrors('recent.json validation errors', recentErrors);
printErrors('history-index.json validation errors', indexErrors);
printErrors(`${monthlyPath} validation errors`, monthlyErrors);
printErrors('legacy history.json validation errors', legacyErrors);

if (latestErrors.length || recentErrors.length || indexErrors.length || monthlyErrors.length || legacyErrors.length) {
  console.error('\nM7 data validation failed.');
  process.exit(1);
}

console.log('M7 data validation passed.');
console.log(`latest: ${latest.latestDate} / ${latest.latestReportId}`);
console.log(`recent records: ${recent.records.length}`);
console.log(`history-index records: ${index.records.length}`);
console.log(`${monthlyPath} records: ${monthly.records.length}`);
if (legacyHistory) console.log(`legacy history records: ${legacyHistory.records.length}`);
