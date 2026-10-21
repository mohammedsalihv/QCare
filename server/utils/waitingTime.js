// Source: DOH Waiting Time JAWDA Guidance v9.1, effective Q3 2026, pp.7-24.
// Clinical population membership is explicitly supplied by the source owner;
// this calculator does not infer diagnoses or clinical exceptions from timestamps.
const VERSION = 'DOH-WT-9.1-2026';
const reference = require('../data/waitingTimeGuidance.json');
const catalog = [];
function add(code, name, page, population, exclusions, options = {}) {
  const item = { indicatorCode: code, indicatorName: name, page, population, exclusions,
    target: 90, targetDirection: 'higher', multiplier: 100, unit: '%', kind: 'time', ...options };
  item.sourceGuidance = reference[page] + (item.kind === 'sepsis' ? '\n' + reference[page + 1] : '');
  item.columns = ['record_id', 'reporting_date', 'population_eligible', 'exclusion_reason', ...(item.kind === 'appointment' ? ['request_date', 'third_available_date'] : item.kind === 'sepsis' ? ['registration_at', 'triage_at', 'culture_at', 'antibiotic_at', 'lactate_at'] : item.kind === 'return' ? ['discharge_at', 'next_return_at', 'followup_complete'] : item.kind === 'event' ? [item.event] : [item.start, item.end])];
  item.numeratorDesc = item.kind === 'appointment' ? 'Sum of the three monthly mean calendar-day waits (implementation of quarterly average of 3 months).' : item.kind === 'event' ? `Eligible encounters with ${item.event} = yes.` : item.kind === 'return' ? 'Eligible index encounters with a return within 7 days after discharge.' : item.kind === 'sepsis' ? `Eligible patients meeting ${item.component} within ${item.limit} minutes; blood culture must precede antibiotics.` : `Eligible encounters completed within ${item.limit} ${item.timeUnit || 'minutes'} (inclusive).`;
  item.denominatorDesc = item.kind === 'appointment' ? '3 complete monthly means, reported separately for this service.' : population + '; after the listed exclusions.';
  catalog.push(item);
}
add('WT003', 'Hospital wait at point of arrival', 7, 'Outpatient registrations for a DOH licensed physician', ['non_physician', 'investigation_before_doctor', 'dental_or_anesthesia', 'ed_ucc', 'lwbs', 'teleconsultation'], { start: 'registration_at', end: 'doctor_at', limit: 30 });
add('WT005', 'Elective inpatient admission within 28 days', 8, 'Elective acute-care inpatient admissions', ['personal_reasons', 'patient_choice', 'clinically_inappropriate', 'insurance_refused_or_delayed_14_days', 'emergency_unplanned', 'same_day_opd', 'day_case'], { start: 'decision_date', end: 'admission_date', limit: 28, timeUnit: 'days' });
add('WT006', 'Door to primary PCI', 9, 'Adult emergency AMI with ST elevation or LBBB indicated for primary PCI; apply the diagnosis/procedure and within-24-hour criteria on page 9', ['inpatient', 'clinical_trial', 'prior_fibrinolytic_or_counterindication_agent', 'non_primary_pci', 'pci_contraindicated', 'refusal_or_consent_delay'], { start: 'arrival_at', end: 'pci_at', limit: 90 });
add('WT007', 'Stroke CT interpretation', 10, 'Adults with positive/confirmed stroke at ED/UCC or inpatient discharge using the page 10 ICD list (I62 codes excluded in v9.1)', ['symptoms_over_6_hours', 'symptoms_duration_unknown', 'ct_not_done_family_refusal', 'ct_not_done_unstable', 'ct_previously_done', 'ct_not_done_transfer'], { start: 'arrival_at', end: 'ct_interpreted_at', limit: 45 });
add('WT008', 'ED/UCC door to doctor', 11, 'ED/UCC physician-involved encounters, all triage categories', ['lwbs'], { start: 'registration_at', end: 'doctor_at', limit: 30 });
add('WT009', 'ED/UCC door to door', 12, 'All ED/UCC encounters, all triage categories', ['lwbs', 'against_medical_advice'], { start: 'registration_at', end: 'departure_at', limit: 240 });
add('WT010', 'Seven-day ED/UCC re-attendance', 13, 'ED/UCC index encounters, all triage categories', ['died', 'lwbs', 'against_medical_advice', 'transfer_out', 'repeat_within_7_days'], { kind: 'return', target: null, targetDirection: 'lower' });
add('WT011', 'ED/UCC left without being seen', 14, 'All ED/UCC encounters, all triage categories', [], { kind: 'event', event: 'left_without_seen', target: 3, targetDirection: 'lower' });
add('WT012', 'Decision to admit to ED/UCC departure', 15, 'All patients admitted to this facility from ED/UCC, regardless of length of stay', [], { start: 'decision_at', end: 'departure_at', limit: 60 });
add('WT013', 'ED/UCC patients admitted to hospital', 16, 'All ED/UCC encounters, all triage categories', ['lwbs'], { kind: 'event', event: 'admitted', target: 20, targetDirection: 'lower', targetStrict: true });
for (const [code, page, diagnosis, limit] of [['WT014', 17, 'sepsis', 180], ['WT015', 19, 'septic shock (mandatory R65.21 plus a listed sepsis code)', 60]]) {
  for (const [suffix, component] of [['a', 'blood culture before antibiotics'], ['b', 'antibiotics'], ['c', 'initial lactate'], ['d', 'all three criteria']]) add(`${code}${suffix}`, `${diagnosis}: ${component}`, page, `Adults diagnosed with ${diagnosis} at ED/UCC admission using the ICD list on pages ${page}-${page + 1}`, ['against_medical_advice'], { kind: 'sepsis', component, suffix, limit, target: null });
}
for (const [suffix, limit, therapy] of [['a', 60, 'no thrombolytic therapy'], ['b', 90, 'thrombolytic therapy given']]) add(`WT016${suffix}`, `Stroke transfer (${therapy})`, 21, `Adults with BEFAST-positive suspected stroke transferred to higher-level care, ${therapy}`, ['symptoms_over_6_hours', 'symptoms_duration_unknown', 'died'], { start: 'arrival_at', end: 'transfer_departure_at', limit, target: 95, statsUnit: 'hours' });
for (const [code, page, service] of [['WT017', 22, 'Primary care'], ['WT018a', 23, 'Oncology'], ['WT018b', 23, 'Haematology'], ['WT019a', 24, 'Internal medicine'], ['WT019b', 24, 'Ophthalmology'], ['WT019c', 24, 'ENT'], ['WT019d', 24, 'General pediatrics'], ['WT019e', 24, 'OBGYNE']]) add(code, `Third available appointment: ${service}`, page, `${service} routine/nonurgent appointment availability observations`, [], { kind: 'appointment', target: null, targetDirection: 'lower', multiplier: 1, unit: 'days' });
const getPreset = code => catalog.find(item => item.indicatorCode === code);
const ruleFor = code => {
  const p = getPreset(code);
  if (!p) throw new Error('Unknown waiting-time indicator.');
  return { preset: code, version: VERSION, multiplier: p.multiplier, targetDirection: p.targetDirection, targetStrict: Boolean(p.targetStrict), measureType: ['event', 'return'].includes(p.kind) ? 'event' : 'compliance' };
};
const round = n => Number(n.toFixed(2));
function calendar(raw) {
  const value = raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error('Use real YYYY-MM-DD calendar dates.');
  return Date.parse(value);
}
function timestamp(raw) {
  if (raw instanceof Date && Number.isFinite(raw.getTime())) return raw.getTime() - 4 * 3600000; // Excel wall-clock dates are Abu Dhabi local time.
  const value = String(raw ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/.test(value)) throw new Error('Use ISO timestamps, e.g. 2026-07-01T10:00:00+04:00.');
  calendar(value.slice(0, 10));
  if (+value.slice(11, 13) > 23 || +value.slice(14, 16) > 59 || (value[16] === ':' && +value.slice(17, 19) > 59)) throw new Error('Invalid clock time.');
  const n = Date.parse(value + (/Z$|[+-]\d{2}:\d{2}$/.test(value) ? '' : '+04:00'));
  if (!Number.isFinite(n)) throw new Error('Invalid timestamp.');
  return n;
}
function analyzeWaiting({ headers, rows }, code, period, year) {
  const p = getPreset(code);
  if (!p) throw new Error('Unknown waiting-time indicator.');
  if (!/^Q[1-4]$/.test(period) || !Number.isInteger(Number(year)) || Number(year) < 2026 || (Number(year) === 2026 && +period[1] < 3)) throw new Error('Version 9.1 applies from Q3 2026.');
  const indexes = Object.fromEntries(p.columns.map(key => [key, headers.findIndex(h => h.trim().toLowerCase() === key)]));
  for (const key of p.columns) if (indexes[key] < 0) throw new Error(`Required column "${key}" is missing. Download this indicator's template.`);
  let numerator = 0, denominator = 0, excluded = 0, outsidePeriod = 0;
  const issues = [], ids = new Set(), waits = [], months = new Map(), reasons = new Map();
  const yes = value => { const v = String(value ?? '').trim().toLowerCase(); if (!['yes', 'no'].includes(v)) throw new Error('Boolean fields require yes or no.'); return v === 'yes'; };
  for (const row of rows) {
    const get = key => row.values[indexes[key]];
    try {
      const date = new Date(calendar(get('reporting_date')));
      if (date.getUTCFullYear() !== Number(year) || `Q${Math.floor(date.getUTCMonth() / 3) + 1}` !== period) { outsidePeriod++; continue; }
      const id = String(get('record_id') ?? '').trim();
      if (!id || ids.has(id)) throw new Error('Missing or duplicate record_id in the reporting period.');
      ids.add(id);
      const eligible = yes(get('population_eligible'));
      const reason = String(get('exclusion_reason') ?? '').trim().toLowerCase();
      if (reason && reason !== 'none' && !p.exclusions.includes(reason)) throw new Error('Unrecognized exclusion_reason for this indicator.');
      if (!eligible || (reason && reason !== 'none')) { excluded++; const key = !eligible ? 'outside_population' : reason; reasons.set(key, (reasons.get(key) || 0) + 1); continue; }
      let match = false, wait;
      const elapsed = (start, end) => { const result = (timestamp(end) - timestamp(start)) / 60000; if (result < 0) throw new Error('End time precedes start time.'); return result; };
      if (p.kind === 'time') {
        if (String(get(p.end) ?? '').trim().toLowerCase() === 'not_done' && p.timeUnit !== 'days') {
          timestamp(get(p.start)); // An explicitly unperformed event remains a denominator failure.
        } else {
          wait = p.timeUnit === 'days' ? (calendar(get(p.end)) - calendar(get(p.start))) / 86400000 + 1 : elapsed(get(p.start), get(p.end));
          if (wait < (p.timeUnit === 'days' ? 1 : 0)) throw new Error('End date precedes start date.');
          match = wait <= p.limit;
        }
      } else if (p.kind === 'event') match = yes(get(p.event));
      else if (p.kind === 'return') {
        if (!yes(get('followup_complete'))) throw new Error('Complete seven-day follow-up, including across quarter boundaries, is required.');
        timestamp(get('discharge_at'));
        match = String(get('next_return_at') ?? '').trim() !== '' && elapsed(get('discharge_at'), get('next_return_at')) <= 7 * 1440;
      } else if (p.kind === 'sepsis') {
        const arrival = Math.min(timestamp(get('registration_at')), timestamp(get('triage_at')));
        const times = ['culture_at', 'antibiotic_at', 'lactate_at'].map(key => {
          const raw = get(key);
          if (String(raw ?? '').trim().toLowerCase() === 'not_done') return null;
          const t = timestamp(raw); if (t < arrival) throw new Error('Treatment time precedes arrival.'); return t;
        });
        const within = t => t !== null && (t - arrival) / 60000 <= p.limit;
        const [culture, antibiotic, lactate] = times;
        const a = within(culture) && antibiotic !== null && culture < antibiotic;
        const flags = { a, b: within(antibiotic), c: within(lactate), d: a && within(antibiotic) && within(lactate) };
        match = flags[p.suffix];
      } else {
        const request = calendar(get('request_date'));
        if (request !== date.getTime()) throw new Error('reporting_date must equal request_date for appointment observations.');
        wait = (calendar(get('third_available_date')) - request) / 86400000;
        if (wait < 0) throw new Error('Third appointment precedes request date.');
        const month = date.getUTCMonth() + 1;
        if (!months.has(month)) months.set(month, []);
        months.get(month).push(wait);
      }
      if (wait !== undefined) waits.push(p.statsUnit === 'hours' ? wait / 60 : wait);
      if (p.kind !== 'appointment') { numerator += Number(match); denominator++; }
    } catch (err) { issues.push({ row: row.row, message: err.message }); }
  }
  const monthly = Array.from(months, ([month, values]) => ({ month, observations: values.length, meanDays: values.reduce((a, b) => a + b, 0) / values.length })).sort((a,b) => a.month-b.month);
  if (p.kind === 'appointment') { numerator = monthly.reduce((sum, m) => sum + m.meanDays, 0); denominator = monthly.length; }
  const complete = p.kind !== 'appointment' || monthly.length === 3;
  const value = denominator && complete ? numerator / denominator * p.multiplier : null;
  waits.sort((a,b) => a-b);
  const count = waits.length;
  const stats = count ? { unit: p.statsUnit || p.timeUnit || (p.kind === 'appointment' ? 'days' : 'minutes'), count, mean: round(waits.reduce((a,b) => a+b,0)/count), median: round((waits[Math.floor((count-1)/2)] + waits[Math.floor(count/2)])/2), min: round(waits[0]), max: round(waits[count-1]) } : null;
  return { totalRows: rows.length, numerator, denominator, excluded, outsidePeriod, invalidRows: issues.length, issues: issues.slice(0,30), calculatedValue: value === null ? null : round(value), targetMet: value === null || p.target === null ? null : p.targetDirection === 'lower' ? (p.targetStrict ? value < p.target : value <= p.target) : value >= p.target, nonComplianceCount: p.kind === 'time' || p.kind === 'sepsis' ? denominator - numerator : null, nonCompliancePercent: denominator && ['time','sepsis'].includes(p.kind) ? round((denominator-numerator)/denominator*100) : null, reasons: Array.from(reasons, ([label,count]) => ({label,count})), risks: [], waitingStatistics: stats, monthly, warnings: ['Population membership and exclusion reasons must be clinically reviewed against the guidance before export.', ...(p.kind === 'appointment' ? ['Use the same weekday and time for availability sampling. Quarterly result is the equally weighted mean of all three monthly means.', ...(!complete ? ['All three months are required; no complete quarterly result is available.'] : [])] : [])], canSubmit: issues.length === 0 && denominator > 0 && complete };
}
module.exports = { VERSION, catalog, getPreset, ruleFor, analyzeWaiting };
