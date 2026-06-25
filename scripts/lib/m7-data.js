import fs from 'node:fs';
import path from 'node:path';

export const M7_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'];
export const VALID_LIGHTS = ['green', 'yellow', 'red', 'blue', 'purple'];

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function requireString(errors, value, label) {
  if (typeof value !== 'string' || value.trim() === '') errors.push(`${label} must be a non-empty string.`);
}

function requireBoolean(errors, value, label) {
  if (typeof value !== 'boolean') errors.push(`${label} must be boolean.`);
}

function requireScore(errors, value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    errors.push(`${label} must be a finite number from 0 to 100.`);
  }
}

function validateSourceReports(errors, sourceReports, label) {
  if (!isObject(sourceReports)) {
    errors.push(`${label} must be an object.`);
    return;
  }
  ['dashboard', 'fullReport', 'archive'].forEach((key) => requireString(errors, sourceReports[key], `${label}.${key}`));
}

function validateTriggerRules(errors, triggerRules, label) {
  if (!isObject(triggerRules)) {
    errors.push(`${label} must be an object.`);
    return;
  }
  if (!Array.isArray(triggerRules.downgrade) || triggerRules.downgrade.length === 0) errors.push(`${label}.downgrade must be a non-empty array.`);
  if (!Array.isArray(triggerRules.stopAdding) || triggerRules.stopAdding.length === 0) errors.push(`${label}.stopAdding must be a non-empty array.`);
  requireString(errors, triggerRules.panicSellBan, `${label}.panicSellBan`);
}

function validateDataQuality(errors, dataQuality, label) {
  if (!isObject(dataQuality)) {
    errors.push(`${label} must be an object.`);
    return;
  }
  requireBoolean(errors, dataQuality.marketDataRefreshed, `${label}.marketDataRefreshed`);
  requireString(errors, dataQuality.status, `${label}.status`);
  requireString(errors, dataQuality.note, `${label}.note`);
}

export function validateLatest(latest) {
  const errors = [];
  if (!isObject(latest)) return ['latest.json must contain a JSON object.'];

  requireString(errors, latest.schemaVersion, 'latest.schemaVersion');
  if (latest.project !== 'm7-dashboard') errors.push('latest.project must be "m7-dashboard".');
  requireString(errors, latest.updatedAt, 'latest.updatedAt');
  if (!isDateString(latest.latestDate)) errors.push('latest.latestDate must be YYYY-MM-DD.');
  requireString(errors, latest.latestReportId, 'latest.latestReportId');
  validateSourceReports(errors, latest.sourceReports, 'latest.sourceReports');

  if (!isObject(latest.summary)) {
    errors.push('latest.summary must be an object.');
  } else {
    requireString(errors, latest.summary.headline, 'latest.summary.headline');
    requireString(errors, latest.summary.oneLineConclusion, 'latest.summary.oneLineConclusion');
    requireString(errors, latest.summary.recommendedAction, 'latest.summary.recommendedAction');
    requireString(errors, latest.summary.directionality, 'latest.summary.directionality');
    requireBoolean(errors, latest.summary.killSwitchTriggered, 'latest.summary.killSwitchTriggered');
    requireString(errors, latest.summary.nextActionMode, 'latest.summary.nextActionMode');
  }

  if (!isObject(latest.riskLights) || Object.keys(latest.riskLights || {}).length === 0) {
    errors.push('latest.riskLights must be a non-empty object.');
  } else {
    for (const [key, risk] of Object.entries(latest.riskLights)) {
      if (!isObject(risk)) {
        errors.push(`latest.riskLights.${key} must be an object.`);
        continue;
      }
      requireString(errors, risk.label, `latest.riskLights.${key}.label`);
      requireString(errors, risk.summary, `latest.riskLights.${key}.summary`);
      if (!VALID_LIGHTS.includes(risk.light)) errors.push(`latest.riskLights.${key}.light must be one of ${VALID_LIGHTS.join(', ')}.`);
    }
  }

  if (!Array.isArray(latest.ranking) || latest.ranking.length !== 7) {
    errors.push('latest.ranking must contain exactly 7 records.');
  } else {
    const tickers = new Set();
    const ranks = new Set();
    latest.ranking.forEach((item, index) => {
      const label = `latest.ranking[${index}]`;
      if (!isObject(item)) {
        errors.push(`${label} must be an object.`);
        return;
      }
      if (!Number.isInteger(item.rank) || item.rank < 1 || item.rank > 7) errors.push(`${label}.rank must be 1-7.`);
      ranks.add(item.rank);
      if (!M7_TICKERS.includes(item.ticker)) errors.push(`${label}.ticker must be one of ${M7_TICKERS.join(', ')}.`);
      tickers.add(item.ticker);
      requireString(errors, item.company, `${label}.company`);
      requireString(errors, item.rating, `${label}.rating`);
      requireScore(errors, item.score, `${label}.score`);
      requireString(errors, item.scoreBand, `${label}.scoreBand`);
      requireString(errors, item.scoreReason, `${label}.scoreReason`);
      requireString(errors, item.newCapitalStance, `${label}.newCapitalStance`);
      requireString(errors, item.triggerStatus, `${label}.triggerStatus`);
      if (!VALID_LIGHTS.includes(item.riskLight)) errors.push(`${label}.riskLight must be one of ${VALID_LIGHTS.join(', ')}.`);
    });
    if (tickers.size !== 7) errors.push('latest.ranking must include 7 unique M7 tickers.');
    if (ranks.size !== 7) errors.push('latest.ranking ranks must be unique 1-7.');
  }

  if (!Array.isArray(latest.eventWatch)) errors.push('latest.eventWatch must be an array, use [] if no event.');
  validateTriggerRules(errors, latest.triggerRules, 'latest.triggerRules');
  validateDataQuality(errors, latest.dataQuality, 'latest.dataQuality');

  return errors;
}

function validateHistoryRecord(errors, record, index) {
  const label = `history.records[${index}]`;
  if (!isObject(record)) {
    errors.push(`${label} must be an object.`);
    return;
  }
  if (!isDateString(record.date)) errors.push(`${label}.date must be YYYY-MM-DD.`);
  requireString(errors, record.reportId, `${label}.reportId`);
  validateSourceReports(errors, record.sourceReports, `${label}.sourceReports`);
  requireString(errors, record.headline, `${label}.headline`);
  requireString(errors, record.oneLineConclusion, `${label}.oneLineConclusion`);
  requireString(errors, record.recommendedAction, `${label}.recommendedAction`);

  if (!isObject(record.marketRegime)) {
    errors.push(`${label}.marketRegime must be an object.`);
  } else {
    if (!isObject(record.marketRegime.directionality)) errors.push(`${label}.marketRegime.directionality must be an object.`);
    if (!isObject(record.marketRegime.killSwitch)) errors.push(`${label}.marketRegime.killSwitch must be an object.`);
    if (!Array.isArray(record.marketRegime.riskLights)) errors.push(`${label}.marketRegime.riskLights must be an array.`);
    if (isObject(record.marketRegime.killSwitch)) requireBoolean(errors, record.marketRegime.killSwitch.triggered, `${label}.marketRegime.killSwitch.triggered`);
  }

  if (!Array.isArray(record.m7Ranking) || record.m7Ranking.length !== 7) {
    errors.push(`${label}.m7Ranking must contain exactly 7 records.`);
  }

  validateTriggerRules(errors, record.triggerRules, `${label}.triggerRules`);
  validateDataQuality(errors, record.dataQuality, `${label}.dataQuality`);
}

export function validateHistory(history, latest = null) {
  const errors = [];
  if (!isObject(history)) return ['history.json must contain a JSON object.'];
  requireString(errors, history.schemaVersion, 'history.schemaVersion');
  if (history.project !== 'm7-dashboard') errors.push('history.project must be "m7-dashboard".');
  requireString(errors, history.updatedAt, 'history.updatedAt');
  if (!Array.isArray(history.records) || history.records.length === 0) {
    errors.push('history.records must be a non-empty array.');
  } else {
    const keys = new Set();
    history.records.forEach((record, index) => {
      validateHistoryRecord(errors, record, index);
      if (record?.date && record?.reportId) {
        const key = `${record.date}__${record.reportId}`;
        if (keys.has(key)) errors.push(`Duplicate history record: ${key}.`);
        keys.add(key);
      }
    });
    if (latest?.latestDate && latest?.latestReportId) {
      const latestKey = `${latest.latestDate}__${latest.latestReportId}`;
      if (!keys.has(latestKey)) errors.push(`history.records does not contain latest record ${latestKey}.`);
    }
  }
  return errors;
}

export function latestToHistoryRecord(latest) {
  return {
    date: latest.latestDate,
    reportId: latest.latestReportId,
    sourceReports: latest.sourceReports,
    headline: latest.summary.headline,
    oneLineConclusion: latest.summary.oneLineConclusion,
    recommendedAction: latest.summary.recommendedAction,
    marketRegime: {
      directionality: {
        status: latest.summary.directionality,
        label: latest.summary.directionality,
        interpretation: latest.summary.headline
      },
      killSwitch: {
        triggered: latest.summary.killSwitchTriggered,
        label: latest.summary.killSwitchTriggered ? '已觸發' : '未觸發',
        reason: latest.summary.headline
      },
      riskLights: Object.entries(latest.riskLights || {}).map(([key, value]) => ({ key, ...value }))
    },
    m7Ranking: (latest.ranking || []).map((item) => ({
      rank: item.rank,
      ticker: item.ticker,
      company: item.company,
      rating: item.rating,
      score: item.score,
      scoreBand: item.scoreBand,
      scoreReason: item.scoreReason,
      scoreBreakdown: item.scoreBreakdown || null,
      role: item.role || '',
      newCapitalStance: item.newCapitalStance,
      researchAction: item.researchAction || item.triggerStatus,
      riskLight: item.riskLight,
      mainRisk: item.mainRisk || '',
      signal: item.signal || '',
      delta: {
        week: item.weeklyDelta ?? null,
        month: item.monthlyDelta ?? null,
        rankChangeWeek: item.rankChangeWeek ?? null,
        rankChangeMonth: item.rankChangeMonth ?? null,
        note: item.deltaNote || 'Delta 尚未接入。'
      },
      redStreakDays: item.redStreakDays || 0,
      triggerStatus: item.triggerStatus,
      eventNotes: item.eventNotes || []
    })),
    eventWatch: latest.eventWatch || [],
    triggerRules: latest.triggerRules,
    nextDataTasks: latest.nextDataTasks || [],
    dataQuality: latest.dataQuality
  };
}

export function upsertHistoryRecord(history, record) {
  const key = `${record.date}__${record.reportId}`;
  const records = Array.isArray(history.records) ? history.records : [];
  const filtered = records.filter((item) => `${item.date}__${item.reportId}` !== key);
  filtered.unshift(record);
  return {
    ...history,
    updatedAt: new Date().toISOString(),
    records: filtered
  };
}
