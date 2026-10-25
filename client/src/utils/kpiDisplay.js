export const statusLabel = value => ({ 'on-track': 'On target', 'at-risk': 'Near target', breached: 'Below target performance', 'not-assessed': 'Not assessed' })[value] || 'Not assessed';
export const ruleFor = item => item.calculationRule || item.importRule || {};
export const valueLabel = (value, item) => value == null ? 'Not assessed' : Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }) + (item.unit === '%' ? '%' : ' ' + (item.unit || ''));
export const targetLabel = item => item.target == null ? 'No target set' : (ruleFor(item).targetDirection === 'lower' ? (item.waitingTimePreset?.targetStrict ? '< ' : '≤ ') : '≥ ') + valueLabel(item.target, item);
export const localDate = () => { const date = new Date(); return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-'); };
export const isOverdue = action => action.status !== 'Completed' && action.dueDate < localDate();
export const periodOrder = item => Number(item.reportingYear) * 4 + Number(item.reportingPeriod?.slice(1) || 0);
