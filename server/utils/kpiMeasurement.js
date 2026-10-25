// Assess the unrounded result so rounding never changes a pass/fail decision.
function assessMeasurement({ numerator, denominator, target, calculationRule = {} }) {
  const multiplier = calculationRule.multiplier ?? 100;
  if (!Number.isFinite(numerator) || numerator < 0 || !Number.isFinite(denominator) || denominator <= 0) {
    return { calculatedValue: null, variance: null, status: 'not-assessed' };
  }
  const raw = numerator / denominator * multiplier;
  const calculatedValue = Number(raw.toFixed(2));
  if (target == null || !Number.isFinite(target)) return { calculatedValue, variance: null, status: 'not-assessed' };
  const difference = raw - target;
  const favorable = calculationRule.targetDirection === 'lower' ? -difference : difference;
  const tolerance = calculationRule.warningTolerance ?? 10;
  return { calculatedValue, variance: Number(difference.toFixed(2)), status: favorable >= 0 ? 'on-track' : favorable >= -tolerance ? 'at-risk' : 'breached' };
}
module.exports = { assessMeasurement };
