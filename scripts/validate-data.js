#!/usr/bin/env node
import { readJson, validateLatest, validateHistory } from './lib/m7-data.js';

const latestPath = process.argv[2] || 'data/latest.json';
const historyPath = process.argv[3] || 'data/history.json';

function printErrors(title, errors) {
  if (!errors.length) return;
  console.error(`\n${title}`);
  errors.forEach((error) => console.error(`- ${error}`));
}

let latest;
let history;
const ioErrors = [];

try {
  latest = readJson(latestPath);
} catch (error) {
  ioErrors.push(`Cannot read ${latestPath}: ${error.message}`);
}

try {
  history = readJson(historyPath);
} catch (error) {
  ioErrors.push(`Cannot read ${historyPath}: ${error.message}`);
}

if (ioErrors.length) {
  printErrors('I/O errors', ioErrors);
  process.exit(1);
}

const latestErrors = validateLatest(latest);
const historyErrors = validateHistory(history, latest);

printErrors('latest.json validation errors', latestErrors);
printErrors('history.json validation errors', historyErrors);

if (latestErrors.length || historyErrors.length) {
  console.error('\nM7 data validation failed.');
  process.exit(1);
}

console.log('M7 data validation passed.');
console.log(`latest: ${latest.latestDate} / ${latest.latestReportId}`);
console.log(`history records: ${history.records.length}`);
