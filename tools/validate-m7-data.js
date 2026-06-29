#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const docsRoot = path.join(repoRoot, "docs");

const errors = [];
const warnings = [];

const REQUIRED_DASHBOARD_FIELDS = [
  "schemaVersion",
  "dataStatus",
  "date",
  "title",
  "summary",
  "top3"
];

const REQUIRED_TOP3_FIELDS = [
  "topic",
  "summary",
  "companies",
  "theme",
  "type",
  "persistence",
  "thesisImpact",
  "actionBias",
  "direction",
  "horizon",
  "watchSignals",
  "confidence",
  "evidenceProfile"
];

const REQUIRED_EVIDENCE_FIELDS = [
  "sourceItemCount",
  "recurrence",
  "whySelected",
  "whatChanged"
];

const SUPPLEMENTAL_EVIDENCE_FIELDS = [
  "sourceType",
  "evidenceStrength",
  "freshness",
  "contradictionRisk"
];

const ALLOWED_EVIDENCE_FIELDS = new Set([
  ...REQUIRED_EVIDENCE_FIELDS,
  ...SUPPLEMENTAL_EVIDENCE_FIELDS
]);

function sitePath(relativePath) {
  return String(relativePath || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

function fullPath(relativePath) {
  return path.join(docsRoot, sitePath(relativePath));
}

function reportError(file, field, reason) {
  errors.push({ file, field, reason });
}

function reportWarning(file, field, reason) {
  warnings.push({ file, field, reason });
}

function fileExists(relativePath) {
  return fs.existsSync(fullPath(relativePath));
}

function readJson(relativePath) {
  const normalized = sitePath(relativePath);
  const target = fullPath(normalized);

  if (!fs.existsSync(target)) {
    reportError(normalized, "(file)", "File does not exist.");
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(target, "utf8"));
  } catch (error) {
    reportError(normalized, "(json)", `Invalid JSON: ${error.message}`);
    return null;
  }
}

function requireObject(value, file, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    reportError(file, field, "Expected an object.");
    return false;
  }
  return true;
}

function requireFields(object, fields, file, prefix = "") {
  for (const field of fields) {
    if (!(field in object)) {
      reportError(file, `${prefix}${field}`, "Required field is missing.");
    }
  }
}

function validateEvidenceProfile(profile, file, index) {
  const prefix = `top3[${index}].evidenceProfile.`;

  if (!requireObject(profile, file, `top3[${index}].evidenceProfile`)) {
    return;
  }

  requireFields(profile, REQUIRED_EVIDENCE_FIELDS, file, prefix);

  for (const key of Object.keys(profile)) {
    if (!ALLOWED_EVIDENCE_FIELDS.has(key)) {
      reportWarning(
        file,
        `${prefix}${key}`,
        "Unknown evidenceProfile field. If this is a supplemental field, check for a spelling mismatch."
      );
    }
  }
}

function validateTop3Item(item, file, index) {
  if (!requireObject(item, file, `top3[${index}]`)) {
    return;
  }

  requireFields(item, REQUIRED_TOP3_FIELDS, file, `top3[${index}].`);

  if ("companies" in item && !Array.isArray(item.companies)) {
    reportError(file, `top3[${index}].companies`, "Expected an array.");
  }

  if ("watchSignals" in item && !Array.isArray(item.watchSignals)) {
    reportError(file, `top3[${index}].watchSignals`, "Expected an array.");
  }

  if ("evidenceProfile" in item) {
    validateEvidenceProfile(item.evidenceProfile, file, index);
  }
}

function validateDashboard(relativePath) {
  const file = sitePath(relativePath);
  const dashboard = readJson(file);
  if (!dashboard) {
    return;
  }

  if (!requireObject(dashboard, file, "(root)")) {
    return;
  }

  requireFields(dashboard, REQUIRED_DASHBOARD_FIELDS, file);

  if (!Array.isArray(dashboard.top3)) {
    reportError(file, "top3", "Expected an array with exactly 3 items.");
    return;
  }

  if (dashboard.top3.length !== 3) {
    reportError(file, "top3", `Expected exactly 3 items, found ${dashboard.top3.length}.`);
  }

  dashboard.top3.forEach((item, index) => validateTop3Item(item, file, index));
}

function validateFullReport(relativePath) {
  const file = sitePath(relativePath);
  const report = readJson(file);
  if (!report) {
    return;
  }

  if (!requireObject(report, file, "(root)")) {
    return;
  }

  if (report.notForReadback !== true) {
    reportError(file, "notForReadback", "Full Report must set notForReadback: true.");
  }
}

function validatePointerPath(ownerFile, field, relativePath, options = {}) {
  const normalized = sitePath(relativePath);

  if (!normalized) {
    if (!options.optional) {
      reportError(ownerFile, field, "Path is missing.");
    }
    return null;
  }

  if (String(relativePath).startsWith("/")) {
    reportError(ownerFile, field, "Path must be site-root relative and must not start with '/'.");
  }

  if (!fileExists(normalized)) {
    reportError(ownerFile, field, `Referenced file does not exist: ${normalized}`);
    return null;
  }

  return normalized;
}

function validateLatest() {
  const latestFile = "data/latest.json";
  const latest = readJson(latestFile);
  if (!latest || !requireObject(latest, latestFile, "(root)")) {
    return [];
  }

  const dashboards = [];
  const dashboardPath = validatePointerPath(latestFile, "dashboardJson", latest.dashboardJson);
  if (dashboardPath) {
    dashboards.push(dashboardPath);
  }

  const fullReportPath = validatePointerPath(latestFile, "fullReportJson", latest.fullReportJson, { optional: true });
  if (fullReportPath) {
    validateFullReport(fullReportPath);
  }

  return dashboards;
}

function validateCalendarManifest() {
  const manifestFile = "data/calendar-manifest.json";
  const manifest = readJson(manifestFile);
  if (!manifest || !requireObject(manifest, manifestFile, "(root)")) {
    return [];
  }

  if (!Array.isArray(manifest.items)) {
    reportError(manifestFile, "items", "Expected an array.");
    return [];
  }

  const dashboards = [];

  manifest.items.forEach((item, index) => {
    if (!requireObject(item, manifestFile, `items[${index}]`)) {
      return;
    }

    const dashboardPath = validatePointerPath(manifestFile, `items[${index}].dashboardJson`, item.dashboardJson);
    if (dashboardPath) {
      dashboards.push(dashboardPath);
    }

    const fullReportPath = validatePointerPath(
      manifestFile,
      `items[${index}].fullReportJson`,
      item.fullReportJson,
      { optional: true }
    );
    if (fullReportPath) {
      validateFullReport(fullReportPath);
    }
  });

  return dashboards;
}

function validateContext() {
  readJson("context/active/previous-daily.json");
  readJson("context/staging/current-week.json");

  if (fileExists("data/previous-daily.json")) {
    reportWarning(
      "data/previous-daily.json",
      "(file)",
      "Legacy/display mirror exists. Do not use it as the previous daily readback source."
    );
  }

  if (fileExists("data/current-week.json")) {
    reportWarning(
      "data/current-week.json",
      "(file)",
      "Legacy/display mirror exists. Do not use it as weekly staging or rollup source."
    );
  }

  const rollingContext = readJson("data/rolling-context.json");
  if (!rollingContext || !requireObject(rollingContext, "data/rolling-context.json", "(root)")) {
    return;
  }

  const previousPath = sitePath(rollingContext.previousDaily && rollingContext.previousDaily.path);
  const currentWeekPath = sitePath(rollingContext.currentWeek && rollingContext.currentWeek.path);

  if (previousPath === "data/previous-daily.json") {
    reportWarning(
      "data/rolling-context.json",
      "previousDaily.path",
      "Points at a legacy/display mirror. Rollup/readback source of truth is context/active/previous-daily.json."
    );
  }

  if (currentWeekPath === "data/current-week.json") {
    reportWarning(
      "data/rolling-context.json",
      "currentWeek.path",
      "Points at a legacy/display mirror. Weekly staging source of truth is context/staging/current-week.json."
    );
  }
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function printList(title, items) {
  if (!items.length) {
    return;
  }

  console.log(`\n${title}`);
  for (const item of items) {
    console.log(`- ${item.file} :: ${item.field} :: ${item.reason}`);
  }
}

function main() {
  console.log("M7 data validator");
  console.log(`Repo: ${repoRoot}`);

  const dashboardPaths = unique([
    ...validateLatest(),
    ...validateCalendarManifest()
  ]);

  dashboardPaths.forEach(validateDashboard);
  validateContext();

  printList("Warnings", warnings);
  printList("Errors", errors);

  if (errors.length) {
    console.log(`\nFAIL: ${errors.length} error(s), ${warnings.length} warning(s).`);
    process.exitCode = 1;
    return;
  }

  console.log(`\nPASS: M7 data validation passed with ${warnings.length} warning(s).`);
}

main();
