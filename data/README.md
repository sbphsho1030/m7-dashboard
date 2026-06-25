# M7 Dashboard Data Layer｜v1.2

Active data files:

- `latest.json`: latest dashboard snapshot; overwritten daily.
- `recent.json`: rolling recent cache for Dashboard delta and red-streak calculation.
- `history-index.json`: compact archive index.
- `history/YYYY-MM.json`: monthly full daily records.
- `history.json`: legacy compatibility file; no longer the main history database.
- `schema.json`: schema reference.

Dashboard reads:

- `latest.json`
- `recent.json`

Archive reads:

- `history-index.json`

Daily flow:

```bash
node scripts/generate-draft.js inputs/YYYY-MM-DD-notes.json
node scripts/update-latest.js drafts/YYYY-MM-DD-latest.json
npm run validate
```

Required ranking fields:

- `rank`
- `ticker`
- `company`
- `rating`
- `score`
- `scoreBand`
- `scoreReason`
- `newCapitalStance`
- `riskLight`
- `triggerStatus`

Validation is implemented in `scripts/lib/m7-data.js` and `scripts/validate-data.js`.
Analytics is implemented in `scripts/lib/m7-analytics.js`.
