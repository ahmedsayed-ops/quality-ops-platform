// src/utils/analytics.js
// ── Pure analytics functions used by all 3 dashboards ──

import { isPositive, isNegative, isAnswered } from "./answers";

// Positive/negative counts across all records × all question keys
export function countPosNeg(records, qKeys) {
  let p = 0, n = 0;
  for (const r of records)
    for (const k of qKeys) {
      if (isPositive(r[k])) p++;
      else if (isNegative(r[k])) n++;
    }
  return { p, n, total: p + n };
}

// Per-question positive rate
export function questionBreakdown(records, questions) {
  return questions.map(q => {
    let pos = 0, neg = 0;
    for (const r of records) {
      if (isPositive(r[q.key])) pos++;
      else if (isNegative(r[q.key])) neg++;
    }
    const total = pos + neg;
    // Shorten label for chart axis
    const name = q.label
      .replace(/^Did the (agent |branch )?/i,"")
      .replace(/^Was the (agent's |customer's )?/i,"")
      .replace(/^Is the (branch )?/i,"")
      .replace(/^Has the (branch )?/i,"")
      .replace(/\?$/,"").trim().slice(0, 28);
    return { name, fullLabel:q.label, pos, neg, total,
             posPercent: total>0 ? Math.round(pos/total*100) : 0 };
  });
}

// Rank records by a group field, computing positive rate across question keys
export function rankByRate(records, groupField, qKeys) {
  const map = {};
  for (const r of records) {
    const name = (r[groupField] || "Unknown").trim();
    if (!map[name]) map[name] = { name, pos:0, neg:0, count:0 };
    map[name].count++;
    for (const k of qKeys) {
      if (isPositive(r[k])) map[name].pos++;
      else if (isNegative(r[k])) map[name].neg++;
    }
  }
  return Object.values(map)
    .map(a => ({ ...a, total:a.pos+a.neg,
      rate: (a.pos+a.neg)>0 ? Math.round(a.pos/(a.pos+a.neg)*100) : 0 }))
    .sort((a, b) => b.rate - a.rate || b.count - a.count);
}

// Average of a numeric field across records
export function avgField(records, field) {
  const vals = records.map(r => parseFloat(r[field])).filter(v => !isNaN(v));
  return vals.length ? Math.round(vals.reduce((s,v)=>s+v,0)/vals.length) : 0;
}

// Group by a field, return [{name, count}] sorted desc
export function groupByField(records, field, limit = null) {
  const map = {};
  for (const r of records) {
    const k = (r[field] || "Unknown").trim();
    map[k] = (map[k] || 0) + 1;
  }
  const arr = Object.entries(map).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
  return limit ? arr.slice(0, limit) : arr;
}

// Daily trend — positive and negative counts per date
export function dailyTrend(records, dateField, qKeys) {
  const map = {};
  for (const r of records) {
    const date = (r[dateField] || r.timestamp || "").slice(0,10);
    if (!date || date.length < 10) continue;
    if (!map[date]) map[date] = { date, positive:0, negative:0 };
    for (const k of qKeys) {
      if (isPositive(r[k])) map[date].positive++;
      else if (isNegative(r[k])) map[date].negative++;
    }
  }
  return Object.values(map).sort((a,b) => a.date.localeCompare(b.date));
}

// Client-side filter: AND-combines all active fields + date range + text search
export function applyFilters(records, { search="", dateFrom="", dateTo="", ...fields }) {
  const q = search.toLowerCase();
  return records.filter(r => {
    // Date
    const d = (r.visitDate||r.callDate||r.complaintDate||r.timestamp||"").slice(0,10);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo   && d > dateTo)   return false;
    // Exact field matches
    for (const [k,v] of Object.entries(fields))
      if (v && r[k] !== v) return false;
    // Text search
    if (q && !Object.values(r).join(" ").toLowerCase().includes(q)) return false;
    return true;
  });
}

// Aging bucket label
export function agingBucket(days) {
  if (days == null) return "Unknown";
  if (days <= 1)   return "0–1 days";
  if (days <= 7)   return "2–7 days";
  if (days <= 30)  return "8–30 days";
  if (days <= 90)  return "31–90 days";
  return "90+ days";
}
