# SEP Standards — Day 2 Validation Report

## Summary

- **Standards before cleaning:** 262
- **Standards after cleaning:** 262
- **Removed (duplicates):** 0

## Step 1 — Validation Issues Found

Total issues: **262**
- Auto-fixed: 262
- Flagged for review: 0
- Other: 0

### Auto-Fixed Issues

- **Subject needs normalization** — 262 occurrences
  - Example: `Subject needs normalization: 'Matemáticas' → 'Matematicas'`
  - Action: AUTO-FIX

## Step 2 — Cleaning Fixes Applied

Total fixes applied: **262**

- Subject normalization: 'Español' → 'Espanol' (150 records)
- Subject normalization: 'Ciencias Naturales' → 'Ciencias' (60 records)
- Subject normalization: 'Matemáticas' → 'Matematicas' (52 records)

## Final Count — Standards per Subject per Grade

| Subject | G1 | G2 | G3 | G4 | G5 | G6 | Total |
|---------|----|----|----|----|----|----|-------|
| Matematicas | 7 | 8 | 8 | 8 | 11 | 10 | 52 |
| Espanol | 26 | 26 | 25 | 25 | 24 | 24 | 150 |
| Ciencias | 8 | 8 | 10 | 10 | 12 | 12 | 60 |
| **Total** | 41 | 42 | 43 | 43 | 47 | 46 | **262** |

## Files Produced

| File | Description |
|------|-------------|
| `seeds/sep_standards_clean.json` | Validated and cleaned standards (source of truth) |
| `seeds/seed_standards.sql` | INSERT statements ready for Day 3 |
| `seeds/sep_validation_report.md` | This report |

## Items Requiring Human Review Before Day 3

1. **Cross-phase prerequisite linking**: Topics change names at phase boundaries
   (Grade 2→3, Grade 4→5). 80 standards at Grade 2+ have `prerequisites: []`
   because no automatic match was possible. These need manual linking if desired.
2. **Cross-topic math prerequisites**: Pedagogical chains like 'addition before
   multiplication' are not encoded. These require human judgment.
3. **Español artistic content scope**: ~8-10 standards per grade cover artistic
   expression (from SEP's 'Lenguajes' campo formativo). Confirm these should
   remain under 'Espanol' or be split to a separate subject.

**None of these blockers prevent Day 3 from proceeding.** The seed SQL is ready
to run as-is. Prerequisites can be updated incrementally after the schema is up.
