// Feature: complaint-history-heatmap — client-side utility functions

const SEVERITY_WEIGHT = { HIGH: 3, MEDIUM: 2, LOW: 1 };
const CELL_SIZE = 0.0009; // ~100 m in degrees

export const DEFAULT_FILTERS = {
  category: 'ALL',
  severity: 'ALL',
  status: 'ALL',
  startDate: '',
  endDate: '',
};

/** Returns severity weight: HIGH=3, MEDIUM=2, LOW=1 */
export function severityWeight(severity) {
  return SEVERITY_WEIGHT[severity] ?? 1;
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

/**
 * Groups complaints into ~100m grid cells and returns HeatmapPoint[] for Circle overlays.
 */
export function clusterComplaints(complaints) {
  const cells = {};

  for (const c of complaints) {
    const lat = c.location?.lat;
    const lng = c.location?.lng;
    if (lat == null || lng == null) continue;

    const key = `${Math.round(lat / CELL_SIZE)}_${Math.round(lng / CELL_SIZE)}`;
    if (!cells[key]) {
      cells[key] = { lat, lng, weight: 0, count: 0, categories: {} };
    }
    const cell = cells[key];
    cell.weight += severityWeight(c.severity);
    cell.count += 1;
    cell.categories[c.category] = (cell.categories[c.category] ?? 0) + 1;
  }

  return Object.values(cells).map((cell) => {
    const w = cell.weight;
    const radius = clamp(30 + w * 15, 30, 300);
    const opacity = clamp(0.15 + w * 0.05, 0.15, 0.7);
    const top = topCategoryFromMap(cell.categories);
    return {
      latitude: cell.lat,
      longitude: cell.lng,
      weight: w,
      count: cell.count,
      topCategory: top,
      radius,
      fillColor: `rgba(239,68,68,${opacity.toFixed(2)})`,
      strokeColor: `rgba(185,28,28,${Math.min(opacity + 0.1, 1).toFixed(2)})`,
    };
  });
}

function topCategoryFromMap(categoryMap) {
  let top = '—';
  let max = 0;
  for (const [cat, count] of Object.entries(categoryMap)) {
    if (count > max) { max = count; top = cat; }
  }
  return top;
}

/** Returns the most-frequent category string from a complaints array, or '—' if empty. */
export function topCategory(complaints) {
  if (!complaints.length) return '—';
  const counts = {};
  for (const c of complaints) {
    counts[c.category] = (counts[c.category] ?? 0) + 1;
  }
  return topCategoryFromMap(counts);
}

/**
 * Computes summary stats from a complaints array.
 * Returns { total, resolved, resolutionRate, topCategory }
 */
export function computeStats(complaints) {
  const total = complaints.length;
  if (total === 0) return { total: 0, resolved: 0, resolutionRate: 0, topCategory: '—' };
  const resolved = complaints.filter((c) => c.status === 'COMPLETED').length;
  const resolutionRate = Math.round((resolved / total) * 100);
  return { total, resolved, resolutionRate, topCategory: topCategory(complaints) };
}

/**
 * Builds a URL query string from FilterState and offset.
 * Omits 'ALL' values and empty strings.
 */
export function buildQueryString(filters, offset = 0) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'ALL') params.set('category', filters.category);
  if (filters.severity && filters.severity !== 'ALL') params.set('severity', filters.severity);
  if (filters.status   && filters.status   !== 'ALL') params.set('status',   filters.status);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate)   params.set('endDate',   filters.endDate);
  if (offset > 0) params.set('offset', String(offset));
  params.set('limit', '50');
  return params.toString();
}

/** Formats an ISO date string as "DD MMM YYYY" */
export function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
