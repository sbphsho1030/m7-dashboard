# M7 Dashboard Data Layer｜v1.1

Data files:

- `latest.json`: latest dashboard snapshot.
- `history.json`: historical records.
- `schema.json`: schema reference.

Dashboard reads latest/history and displays:

- Action Score
- M7 ranking
- Weekly / monthly ranking delta
- Red-light streak days
- Data quality

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

Daily flow:

```bash
node scripts/generate-draft.js inputs/YYYY-MM-DD-notes.json
node scripts/update-latest.js drafts/YYYY-MM-DD-latest.json
npm run validate
```

Validation is implemented in `scripts/lib/m7-data.js`.
Analytics is implemented in `scripts/lib/m7-analytics.js`.
