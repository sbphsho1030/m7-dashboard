# M7 Dashboard Validator Guide

Use the local validator after every manual or GPT-assisted daily update. It checks the static display payloads and confirms the rollup/readback source-of-truth files are present.

## Requirements

The validator requires Node.js.

Check that Node.js is available before running the validator:

```bash
node --version
```

If `node` is not found, install Node.js or fix your PATH so the `node` command is available in your shell.

This repository uses ES Module mode through `package.json`, so the validator intentionally uses a `.js` file with `import` syntax. You do not need to rename it to `.cjs`.

## Run

From the repository root:

```bash
node tools/validate-m7-data.js
```

The validator does not fetch market data, create schedules, start a backend, or change GitHub Pages settings.

## When To Run

Run it:

- after adding or editing `docs/data/daily/YYYY-MM-DD/dashboard.json`
- after adding or editing `docs/data/daily/YYYY-MM-DD/full-report.json`
- after updating `docs/data/latest.json`
- after updating `docs/data/calendar-manifest.json`
- after updating `docs/context/active/previous-daily.json`
- after updating `docs/context/staging/current-week.json`
- before staging or committing a daily update

## What It Checks

The validator checks:

- `docs/data/latest.json` exists and parses
- `docs/data/calendar-manifest.json` exists and parses
- latest and calendar manifest dashboard paths exist
- optional full report paths exist when present
- each dashboard has the required dashboard fields
- each dashboard has exactly three Top3 items
- every Top3 item has the required Top3 fields
- every `evidenceProfile` has the existing required fields
- supplemental `evidenceProfile` field names are not misspelled
- every full report has `notForReadback: true`
- `docs/context/active/previous-daily.json` exists and parses
- `docs/context/staging/current-week.json` exists and parses

It also warns when legacy display mirrors exist:

- `docs/data/previous-daily.json`
- `docs/data/current-week.json`

These mirror files must not be used as rollup or readback source-of-truth files.

## Results

Pass output means the checked files are structurally valid. Warnings should be reviewed, but they do not block validation.

Fail output lists:

- file
- field
- reason

Fix the listed files, then run the validator again.

## Common Fixes

If a referenced dashboard is missing, either create the expected `dashboard.json` or remove the manifest/latest pointer.

If a full report is missing, either create `full-report.json` or remove `fullReportJson` from latest and manifest entries.

If `top3` is not exactly three items, rerun the Dashboard signal filter and keep only the final Green Top3.

If `evidenceProfile` is missing required fields, add `sourceItemCount`, `recurrence`, `whySelected`, and `whatChanged`.

If supplemental evidence fields are misspelled, use only `sourceType`, `evidenceStrength`, `freshness`, and `contradictionRisk`.
