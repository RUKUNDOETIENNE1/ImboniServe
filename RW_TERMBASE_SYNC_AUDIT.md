# RW Termbase Synchronization Audit

**Generated:** 2026-08-01T20:15:29.328Z

---

## Architecture

```
en.json (structural template + English fallback)
  │
  ├── VERIFIED_KINYARWANDA_TERMBASE.json (canonical Kinyarwanda translations)
  │     │
  │     └── Matched by full dot-path (e.g. "common.welcome")
  │
  ├── Existing rw.json (preserved translations for non-termbase keys)
  │
  ├── Git HEAD rw.json (recovery source for lost translations)
  │
  └── rw.json (output: same structure as en.json, fully populated)
```

## Files

| File | Path | Role |
|------|------|------|
| English source | `src/locales/en.json` | Structural template + fallback |
| Verified termbase | `src/locales/VERIFIED_KINYARWANDA_TERMBASE.json` | Canonical Kinyarwanda translations |
| Runtime localization | `src/locales/rw.json` | Application runtime file (output) |

## File Comparison

| Metric | en.json | fr.json | rw.json | Termbase |
|--------|---------|---------|---------|----------|
| Lines | 2652 | 2703 | 2652 | 3208 |
| Size (KB) | 113.3 | 127.6 | 123.8 | 139.8 |
| Top-level sections | 59 | 60 | 59 | 216 |
| Leaf keys | 2161 | 2196 | 2161 | 2677 |

## Synchronization Results

| Metric | Value |
|--------|-------|
| Total en.json leaf keys (target) | 2161 |
| rw.json leaf keys (output) | 2161 |
| Translated from verified termbase | 1374 |
| Preserved from existing rw.json | 787 |
| Recovered from git HEAD rw.json | 0 |
| English fallback (untranslated) | 0 |
| Termbase keys matching en.json paths | 1374 |
| Termbase keys NOT matching en.json paths | 1303 |
| en.json keys missing from termbase | 787 |

## Coverage

```
en.json leaf keys:                      2161
rw.json leaf keys:                      2161
Structure matches en.json:              YES (built from en.json template)

Translated from verified termbase:      1374 (63.58%)
Preserved from existing rw.json:        787
Recovered from git HEAD:                0
English fallback (untranslated):        0

Total translated:                       2161 (100.00%)
Total untranslated (English fallback):  0

Termbase coverage of en.json:           63.58%
Overall translation coverage:           100.00%
```

## Consistency Validation

| Check | Result |
|-------|--------|
| Valid JSON | PASS |
| No duplicate keys | PASS |
| No missing placeholders | PASS |
| No placeholder mismatches | PASS |
| No interpolation mismatches | PASS |
| No HTML mismatches | PASS |
| No Markdown corruption | PASS |
| UTF-8 encoding verified | PASS |
| Structure matches en.json | PASS |
| All en.json keys present in rw.json | PASS |

## Synchronization Rules Applied

1. **Structural template:** rw.json is built from en.json's exact structure (same keys, same nesting).
2. **Termbase priority:** For each en.json leaf key, if the termbase has a translation at the same dot-path, use it.
3. **Preserve existing:** If the termbase doesn't have the key but current rw.json does, preserve the existing translation.
4. **Git recovery:** If neither termbase nor current rw.json has the key, check git HEAD rw.json.
5. **English fallback:** If no Kinyarwanda translation exists anywhere, use the English value from en.json.
6. **No foreign keys:** Termbase keys that don't match en.json paths are excluded from rw.json and listed in the reserve.
7. **No invented content:** No machine translation or invented terminology.

## Structural Notes

The verified termbase has 216 top-level sections, while en.json has 59.
The termbase uses a flatter structure where many en.json nested sections appear as top-level keys.
Only 1374 of 2677 termbase leaf keys match en.json paths exactly.
The remaining 1303 termbase keys could not be mapped and are documented in the reserve list.

---

**Certification:** This synchronization is certified as complete and valid. rw.json mirrors en.json structure with all keys populated.
