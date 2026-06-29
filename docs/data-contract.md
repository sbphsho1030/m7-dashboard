# M7 Dashboard v1.3 Data Contract

This contract defines the manual daily data flow for the static M7 Dashboard. All paths are relative to the `docs/` site root. Sample files must keep `dataStatus: "sample"` until replaced by real, user-provided daily inputs.

## Source Of Truth

`docs/context/` is the only source of truth for rollup, readback, and the memory chain.

`docs/data/` is the source for website display, Archive, latest pointers, and daily payloads.

Required source split:

- `docs/context/active/previous-daily.json` is the only previous daily readback source.
- `docs/context/staging/current-week.json` is the only weekly staging source.
- Future weekly / monthly / quarterly / halfyear / yearly rollups must use files under `docs/context/`.
- `docs/data/previous-daily.json` and `docs/data/current-week.json`, if present, are legacy / display mirrors only. They must not be used as rollup or readback sources.
- No prompt may read both `docs/data/previous-daily.json` and `docs/context/active/previous-daily.json`.
- No prompt may read both `docs/data/current-week.json` and `docs/context/staging/current-week.json`.

## File Naming

Daily content:

- `data/daily/YYYY-MM-DD/dashboard.json`
- `data/daily/YYYY-MM-DD/full-report.json`

Site pointers and context:

- `data/latest.json`
- `data/calendar-manifest.json`
- `data/rolling-context.json`

Rollup and readback context:

- `context/active/previous-daily.json`
- `context/staging/current-week.json`
- `context/weekly/`
- `context/monthly/`
- `context/quarterly/`
- `context/halfyear/`
- `context/yearly/`

Legacy / display mirrors:

- `data/previous-daily.json`
- `data/current-week.json`

Compatibility files retained for the current site shell:

- `data/calendar/index.json`
- `data/calendar/YYYY-MM.json`

## latest.json

Purpose: tells the fixed `index.html` which date to open by default.

Required fields:

- `schemaVersion`: use `m7-latest-v1.3`
- `dataStatus`: `sample` or `manual`
- `date`: `YYYY-MM-DD`
- `title`: display title
- `dashboardJson`: path to the dated dashboard JSON
- `fullReportJson`: path to the dated full report JSON, or omit/null if unavailable
- `notes`: plain-language process note

## calendar-manifest.json

Purpose: lets Archive show only dates with data.

Required fields:

- `schemaVersion`: use `m7-calendar-manifest-v1.3`
- `dataStatus`: `sample` or `manual`
- `availableMonths`: array of `YYYY-MM`
- `defaultMonth`: default `YYYY-MM`
- `items`: array of dated entries

Each item:

- `date`
- `title`
- `dashboardJson`
- `fullReportJson`, optional
- `dataStatus`

## dashboard.json

Purpose: the website display daily Dashboard payload rendered by the static site.

Required fields:

- `schemaVersion`: use `m7-dashboard-v1.3`
- `dataStatus`: `sample` or `manual`
- `date`
- `title`
- `summary`
- `top3`: exactly three Top3 objects

Dashboard filtering:

- Dashboard may show at most three Top3 items.
- Raw daily observations may exceed three items, but only Green signal items may become Top3 candidates.
- Yellow items may be retained in an observation pool outside Dashboard; Red items must not enter Dashboard.

Top3 object fields:

- `topic`
- `summary`
- `companies`
- `theme`
- `type`
- `persistence`
- `thesisImpact`
- `actionBias`
- `direction`
- `horizon`
- `watchSignals`
- `confidence`
- `evidenceProfile`

`evidenceProfile` fields:

- `sourceItemCount`
- `recurrence`
- `whySelected`
- `whatChanged`

`evidenceProfile` supplemental fields for new data:

- `sourceType`: source category, such as company filing, earnings call, news, analyst note, supply-chain check, policy update, or user-provided note.
- `evidenceStrength`: qualitative strength, such as low, medium, high, or mixed.
- `freshness`: how recent the evidence is relative to the market date.
- `contradictionRisk`: whether known evidence conflicts with the selected interpretation.

Do not rename existing `evidenceProfile` fields. Existing sample JSON that lacks the supplemental fields remains compatible; new manual data should include them when available.

## Signal Filter Contract

Green:

- May enter Top3 candidates.
- Requires a clear topic, relevant companies/theme, specific thesisImpact, actionable watchSignals, and enough evidence to avoid one-day noise.

Yellow:

- May enter an observation pool.
- Should not enter Dashboard Top3 by default.
- Used for early, weak, ambiguous, or insufficiently repeated signals.

Red:

- Must not enter Dashboard.
- Used for unsupported claims, pure short-term price noise, duplicate low-value headlines, irrelevant company mentions, or items without usable watchSignals.

Scoring inputs:

- source quality and sourceType
- sourceItemCount
- recurrence and persistence
- freshness
- contradictionRisk
- theme and company relevance
- thesisImpact clarity
- evidenceStrength
- watchSignals specificity

This filter is intended to prevent daily seven-stock noise from polluting the Dashboard. A company mention or price move alone is not enough to enter Top3.

## full-report.json

Purpose: the website display Full Report payload. It is a permanent readable daily report. It may be displayed by the site, but future rollups must not read it.

Required fields:

- `schemaVersion`: use `m7-full-report-v1.3`
- `dataStatus`: `sample` or `manual`
- `date`
- `title`
- `summary`
- `sections`: array of `{ "heading": "...", "body": "..." }`
- `notForReadback`: must be `true`

Section rules:

- Sections are dynamic and should be generated only when the day's Top3 or important extension topics need narrative explanation.
- A Full Report may be short when there is little to add.
- Do not create empty or filler sections to preserve a fixed format.
- Full Report is permanently retained for display, but it must not be used for future rollup or readback.

## What Changed Contract

What Changed may compare only:

- today's `docs/data/daily/YYYY-MM-DD/dashboard.json` Top3
- previous `docs/context/active/previous-daily.json` Top3

It must not read Full Report and must not infer freely from long-form historical content.

Supported change types:

- new topic: present today, absent from previous Top3.
- continuing topic: same or closely related topic/theme/company exposure continues.
- downgraded topic: previous Top3 remains relevant but falls out of today's Top3, or drops from Green to Yellow.
- disappeared topic: previous Top3 no longer has sufficient evidence or watchSignals.
- thesisImpact changed: the topic's thesisImpact clearly changes.
- actionBias changed: the topic's actionBias clearly changes.
- evidenceProfile changed: source count, source type, evidence strength, freshness, contradiction risk, recurrence, or whatChanged changes.

## context/active/previous-daily.json

Purpose: the only daily memory read by the next daily update. Do not read `data/previous-daily.json` for rollup or readback.

Required fields:

- `schemaVersion`: use `m7-top3-v1.3`
- `dataStatus`
- `marketDate`
- `sourceDashboard`
- `top3`

The `top3` array uses the same Top3 object schema as `dashboard.json`.

## context/staging/current-week.json

Purpose: weekly staging. Daily Top3 items are appended here; Weekly rollup reads only this file. Do not read `data/current-week.json` for rollup or readback.

Required fields:

- `schemaVersion`: use `m7-weekly-staging-v1.3`
- `dataStatus`
- `weekId`
- `status`: usually `collecting`, `ready`, or `closed`
- `dailyTop3`: array of daily entries

Each daily entry:

- `marketDate`
- `sourceDashboard`
- `items`: Top3 objects

## rolling-context.json

Purpose: clear display-facing pointers for the rollup chain. The authoritative rollup files still live under `docs/context/`.

Required fields:

- `schemaVersion`: use `m7-rolling-context-v1.3`
- `dataStatus`
- `previousDaily`
- `currentWeek`
- `latestWeekly`
- `latestMonthly`
- `latestQuarterly`
- `latestHalfYear`
- `latestYearly`
- `lastProcessedMarketDate`
- `nextRollupTriggers`

Rollup files that do not exist yet should be `null`.

## Daily Top3 Sync Rule

When a daily Dashboard Top3 changes, update all three authoritative/display surfaces together:

- `docs/data/daily/YYYY-MM-DD/dashboard.json`
- `docs/context/active/previous-daily.json`
- `docs/context/staging/current-week.json`

If legacy mirrors are retained, `docs/data/previous-daily.json` and `docs/data/current-week.json` may be updated for display compatibility only, but they remain non-authoritative.

## Guardrails

- Do not fetch market data in this static site.
- Do not produce investment advice.
- Do not modify `index.html`, `assets/app.js`, or `assets/style.css` during a normal daily data update.
- Do not use root-absolute content paths such as `/content/...`.
- Do not write hard-coded repository names into fetch paths.
- Full Report is permanently retained, but it is not used for readback.
- Do not read both context and data mirror versions of previous daily or current week in the same prompt.
