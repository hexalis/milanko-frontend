// Trend statistics: Mann-Kendall test and Theil-Sen slope with 95 % interval.
// Same math as scripts/trend.py. x = years, y = values, no missing values.

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Standard normal CDF (Abramowitz-Stegun erf approximation).
function normCdf(z) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

function mannKendall(y) {
  const n = y.length;
  let s = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) s += Math.sign(y[j] - y[i]);
  }
  const counts = new Map();
  y.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  let ties = 0;
  counts.forEach(t => { if (t > 1) ties += t * (t - 1) * (2 * t + 5); });
  const variance = (n * (n - 1) * (2 * n + 5) - ties) / 18;
  let z = 0;
  if (s > 0) z = (s - 1) / Math.sqrt(variance);
  else if (s < 0) z = (s + 1) / Math.sqrt(variance);
  const p = 2 * (1 - normCdf(Math.abs(z)));
  return { s, z, p, tau: s / (n * (n - 1) / 2) };
}

function senSlope(x, y) {
  const slopes = [];
  for (let i = 0; i < x.length - 1; i++) {
    for (let j = i + 1; j < x.length; j++) slopes.push((y[j] - y[i]) / (x[j] - x[i]));
  }
  slopes.sort((a, b) => a - b);
  const slope = median(slopes);
  // 95 % interval (Gilbert 1987).
  const n = y.length;
  const c = 1.96 * Math.sqrt(n * (n - 1) * (2 * n + 5) / 18);
  const m1 = Math.round((slopes.length - c) / 2), m2 = Math.round((slopes.length + c) / 2);
  return {
    slope,
    intercept: median(y) - slope * median(x),
    slopeLow: slopes[Math.max(0, m1 - 1)],
    slopeHigh: slopes[Math.min(slopes.length - 1, m2)],
  };
}

function analyzeTrend(x, y) {
  if (x.length < 8) return null;
  const mk = mannKendall(y);
  const sen = senSlope(x, y);
  const mean = y.reduce((a, b) => a + b, 0) / y.length;
  const total = sen.slope * (x[x.length - 1] - x[0]);
  // Year-to-year noise: standard deviation around the trend line.
  const resid = y.map((v, i) => v - (sen.intercept + sen.slope * x[i]));
  const noise = Math.sqrt(resid.reduce((a, r) => a + r * r, 0) / Math.max(1, resid.length - 2));
  return {
    ...mk, ...sen, n: x.length, mean, total, noise,
    perDecade: sen.slope * 10,
    snr: noise ? Math.abs(total) / noise : 0,
    significant: mk.p < 0.05,
    strength: mk.p < 0.01 ? "strong" : mk.p < 0.05 ? "moderate" : "weak",
  };
}

window.TrendStats = { analyzeTrend, mannKendall, senSlope, median };
