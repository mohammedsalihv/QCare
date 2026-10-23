# Practice guide: upload and analyze WT008

This is a demonstration using fictional records. It does not submit anything to QCare or DOH. The actual app requires the updated frontend and backend to be running.

## 1. Add the KPI once

As a Quality Manager, SuperAdmin or admin, open **Indicator workspace**. Set **Q3 / 2026**, expand **Add DOH waiting-time KPIs · Guidance v9.1**, select **WT008 · ED/UCC door to doctor**, then click **Add selected KPIs for Q3 2026**. If it already exists with the DOH preset, continue.

## 2. Download the template

As the department user, choose **Q3 / 2026**, select **WT008**, choose **Upload source data**, and click **Download column template**.

The required columns are:

| Column | What to enter |
| --- | --- |
| record_id | Unique pseudonymous encounter ID, such as DEMO-01 |
| reporting_date | 2026-07-01 for this example |
| population_eligible | yes for every row in this example |
| exclusion_reason | none, or lwbs for the fifth row |
| registration_at | ISO timestamp, such as 2026-07-01T09:00:00+04:00 |
| doctor_at | ISO timestamp of first doctor contact; blank for the excluded LWBS row |

## 3. Enter these fictional records

All rows have reporting_date **2026-07-01** and population_eligible **yes**. Use the complete timestamp format above, with the same date and +04:00 offset, for each time below.

| record_id | registration_at (time) | doctor_at (time) | exclusion_reason |
| --- | --- | --- | --- |
| DEMO-01 | 09:00:00 | 09:10:00 | none |
| DEMO-02 | 09:00:00 | 09:30:00 | none |
| DEMO-03 | 09:00:00 | 09:45:00 | none |
| DEMO-04 | 09:00:00 | 09:20:00 | none |
| DEMO-05 | 09:00:00 | Leave blank | lwbs |

Save as CSV or XLSX with one populated sheet and no formulas. Use a test environment when practicing; do not submit these fictional records as a real departmental report.

## 4. Upload and analyze

Choose the file under **Choose indicator source data**, then click **Analyze uploaded data**.

Expected result:

- Source rows: **5**.
- Excluded: **1** (left without being seen).
- Denominator: **4** eligible encounters after exclusions.
- Numerator: **3** encounters seen within 30 minutes, including exactly 30 minutes.
- Performance: **3 ÷ 4 × 100 = 75%**; the 90% target is not met.
- Mean wait: **26.25 minutes**; median **25**; minimum **10**; maximum **45**.
- Invalid rows: **0**.

## 5. Submit real records after reviewing

For a real report, review the source population, exclusions, quarter, counts and result. Tick the confirmation checkbox and click **Submit calculated report for validation**. The report enters **Pending Validation**; quality validation and approval follow separately. This action does not upload directly to the external DOH portal.

If there are invalid rows, correct the indicated rows in the source file and analyze again. If no eligible records remain, no percentage or submission token is generated.

If you cannot find WT008, ask the Quality Manager to add it. If the upload asks for a generic counting rule instead of showing the DOH source guidance, an older definition with the same code may need migration.
