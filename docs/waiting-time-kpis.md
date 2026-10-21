# DOH waiting-time KPI integration

Source: user-supplied **Waiting Times JAWDA Guidance for Specialized and General Hospitals, version 9.1**, September 2026, effective **Q3 2026**. This implementation is pinned to that version; it does not claim to incorporate later amendments. The source definitions from pages 7–24 are available inside each indicator's upload screen, including diagnosis codes and exclusions.

## Using the integration

1. Open **Indicator workspace** as a QualityManager, SuperAdmin or admin.
2. Expand **Add DOH waiting-time KPIs · Guidance v9.1**, choose applicable services and add them for a quarter from Q3 2026 onwards. Existing indicator codes are preserved, not overwritten.
3. Department staff select an indicator and download its CSV column template. CSV and XLSX are supported.
4. Upload the source records, select **Analyze uploaded data**, review counts, exclusions, performance and waiting statistics, then submit for quality validation. Approval remains a separate step.

No real patient performance is supplied with this integration. Values are derived only when source records are uploaded. Example: 18 eligible patients seen within 30 minutes out of 20 eligible patients gives numerator **18**, denominator **20**, performance **90%**.

## Numerators, denominators and targets

All percentage measures calculate **numerator / denominator × 100**, after population selection and the applicable exclusions. Time thresholds are inclusive. There are 28 selectable results because the sepsis, transfer and specialty measures are reported separately. Letter suffixes identify local sub-indicators, not new DOH parent codes.

| Code | Numerator | Denominator before exclusions | Target |
| --- | --- | --- | --- |
| WT003 | Physician seen within 30 minutes of registration | Eligible outpatient physician registrations | ≥90% |
| WT005 | Elective admission within 28 calendar days; DTA day = 1 | Elective acute-care inpatient admissions | ≥90% |
| WT006 | Primary PCI within 90 minutes of arrival | Eligible adult emergency AMI/ST-elevation or LBBB population per p.9 | ≥90% |
| WT007 | Head CT interpreted within 45 minutes of arrival | Adults with positive/confirmed stroke at discharge, exact p.10 ICD list | ≥90% |
| WT008 | Doctor seen within 30 minutes of registration | Physician-involved ED/UCC encounters | ≥90% |
| WT009 | Departure within 240 minutes of registration | ED/UCC encounters | ≥90% |
| WT010 | Index encounters with a return within 7 days after discharge | Eligible ED/UCC index encounters; exclude repeats within 7 days | Lower is better; no numeric threshold |
| WT011 | Left after registration without being seen by a doctor | All ED/UCC encounters | ≤3% |
| WT012 | ED/UCC departure within 60 minutes of decision to admit | Patients admitted from ED/UCC regardless of length of stay | ≥90% |
| WT013 | Admitted to hospital regardless of length of stay | ED/UCC encounters, excluding LWBS | Strictly <20% |
| WT014a–d | Sepsis: culture before antibiotics, antibiotics, initial lactate, all three; within 180 minutes | Adult sepsis at admission per p.17 ICD list, excluding DAMA | No numeric benchmark specified |
| WT015a–d | Septic shock: same four results, within 60 minutes | Adult septic shock per p.19 ICD list plus mandatory R65.21, excluding DAMA | No numeric benchmark specified |
| WT016a/b | Stroke transfer departure within 60 minutes without thrombolysis / 90 minutes with thrombolysis | Eligible adult BEFAST-positive transfers to higher-level care, separate therapy groups | ≥95% |
| WT017 | Sum of three monthly mean waits to third available appointment | Three monthly means, primary care | Days; no numeric target |
| WT018a/b | Same appointment calculation separately for oncology / haematology | Three monthly means for each specialty | Days; no numeric target |
| WT019a–e | Same appointment calculation separately for internal medicine, ophthalmology, ENT, general pediatrics, OBGYNE | Three monthly means for each specialty | Days; no numeric target |

WT001, WT002 and WT004 are retired and are not added. WT007 excludes the I62 code series introduced in older guidance. WT012 uses **decision to admit → ED/UCC departure**, despite its shorter source title referring to doctor-to-decision time.

## Source-data contract and clinical review

- `record_id`: a unique pseudonymous encounter/observation identifier. Do not upload names or MRNs. Duplicate IDs within a period block submission.
- `reporting_date`: a real YYYY-MM-DD date assigning the record to the quarter. The department must apply its reporting-period attribution consistently with DOH reporting practice; the guidance does not specify a universal quarter anchor for every encounter measure. For appointment observations this must equal `request_date`.
- `population_eligible`: `yes` or `no`, based on clinical review of the complete population definition, diagnosis/procedure lists, age, setting and subgroup. **The calculator does not infer clinical eligibility, diagnoses or thrombolysis groups from timestamps.** Export this field from a reviewed source report.
- `exclusion_reason`: `none` or one of the indicator-specific codes displayed on screen. These map to the PDF's exclusions. Unrecognized codes block submission. Missing required outcome data is an error, never an automatic exclusion.
- Date-time columns use ISO format, e.g. `2026-07-01T10:00:00+04:00`. Timestamps without offsets and Excel date-time cells are interpreted as Abu Dhabi wall-clock time. Date-only columns use YYYY-MM-DD.
- Time measures use the event columns in the downloaded template. Negative waits or missing timestamps block submission. For minute-based measures, an end event explicitly recorded as `not_done` remains a denominator failure with no invented duration. Mean, median, minimum and maximum cover eligible records with valid durations; their observation count can therefore differ from the denominator. WT016 statistics are in **hours**, while its threshold comparison uses minutes.
- Sepsis arrival is the earlier of registration and triage. Both arrival fields must be supplied. A culture must be strictly before antibiotics. `not_done` explicitly identifies treatment not performed and counts as a failure; blank or unknown is invalid. No clinical condition or treatment is inferred.
- WT010 requires an index-encounter export with `next_return_at` (first return after discharge) and `followup_complete=yes`. A blank return timestamp means no return only after complete follow-up. Include seven days after quarter end and mark repeat encounters as excluded. This integration does not link patients or detect returns across separate encounters itself.
- WT017–WT019 use calendar days including weekends; same day is zero. Use the same weekday/time for sampling. The guidance specifies a quarterly average of three months but does not prescribe a detailed observation weighting algorithm. This implementation first averages observations within each month, then equally weights all three monthly means. Its stored numerator is the sum of monthly means and denominator is 3; these are implementation aggregates, not patient counts. All three months are required.

Zero eligible records produces no result and no submission token, not 0% compliance. Invalid rows block submission rather than silently reducing the denominator. Results without a numeric target are `not-assessed`. A signed preview binds calculated values to the user, indicator, period, source-file hash and calculation rule; a changed rule requires another analysis. Waiting-time manual entry is disabled on the server and in the workspace.

The catalog creates definitions through the application when selected. It does not seed a production database, overwrite existing definitions, submit to the external DOH portal, or invent patient data. Existing generic definitions with the same codes need a separately reviewed migration before adopting the fixed presets.

## Verification

Run `node --test server/tests/waitingTime.test.js server/tests/indicatorImport.test.js server/tests/kpiSubmission.test.js` and `npm.cmd run build` from `client`. Tests cover threshold boundaries, DTA day-one counting, exclusions, invalid data, zero populations, strict target comparison, sepsis sequencing, cross-quarter follow-up, monthly weighting, saved units/status and signed upload submission.
