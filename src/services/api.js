// ================================================================
//  src/services/api.js
//  All HTTP calls to the Google Apps Script backend.
//
//  Every request includes a "module" field so the script routes it:
//    module: "visits" | "calls" | "complaints"
//
//  POST: Content-Type text/plain (avoids CORS preflight on Apps Script)
//  GET:  ?module=visits|calls|complaints
//
//  Sheet column names are normalised to camelCase keys by normalise().
//  Falls back to demo data when the endpoint is unreachable.
// ================================================================

import config from "../config";

const EP = config.APPS_SCRIPT_URL;

// ── Generic POST ─────────────────────────────────────────────────
async function post(payload) {
  let res;
  try {
    res = await fetch(EP, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body:    JSON.stringify(payload)
    });
  } catch { throw new Error("Network error — check your connection."); }
  if (!res.ok) throw new Error(`Server error ${res.status}.`);
  let r; try { r = await res.json(); } catch { return; } // non-JSON = treat as ok
  if (r && r.success === false) throw new Error(r.message || "Rejected by server.");
}

// ── Generic GET ──────────────────────────────────────────────────
async function get(module, fallback) {
  let res;
  try { res = await fetch(`${EP}?module=${module}`, { method:"GET" }); }
  catch { console.warn(`[API] ${module} offline — demo data`); return fallback(); }
  if (!res.ok) { console.warn(`[API] ${module} HTTP ${res.status}`); return fallback(); }
  let r; try { r = await res.json(); } catch { return fallback(); }
  if (!r?.success) { console.warn(`[API] ${module} success=false`, r?.message); return fallback(); }
  return r.data || [];
}

// ================================================================
//  MODULE 1 — VISITS
//  POST fields: branchUser, agentUser, employeeName, mobile,
//               visitDate, q1, q2, q3, q4, comments
// ================================================================
export const submitVisit = p => post({ module:"visits", ...p });

export async function fetchVisits() {
  const rows = await get("visits", demoVisits);
  return rows.map(normaliseVisit).sort(byTsDesc);
}

// Sheet col → camelCase key
const V_MAP = {
  "Timestamp":"timestamp","Branch User":"branchUser",
  "Field Agent User":"agentUser","Branch Employee Name":"employeeName",
  "Mobile Number":"mobile","Visit Date":"visitDate",
  "Project Awareness":"q1","Burn Methods Awareness":"q2",
  "Live Email Received":"q3","Support Number Awareness":"q4","Comments":"comments"
};
const normaliseVisit = r => normalise(r, V_MAP);

// ================================================================
//  MODULE 2 — CALLS QUALITY
//  POST fields: agentName, evaluatorName, callDate, callTime,
//               customerName, customerMobile, branch, department,
//               callType, callResult, callDuration,
//               cq1–cq10, score, comments, followUp
// ================================================================
export const submitCall = p => post({ module:"calls", ...p });

export async function fetchCalls() {
  const rows = await get("calls", demoCalls);
  return rows.map(normaliseCall).sort(byTsDesc);
}

const C_MAP = {
  "Timestamp":"timestamp","Agent Name":"agentName","Evaluator Name":"evaluatorName",
  "Call Date":"callDate","Call Time":"callTime","Customer Name":"customerName",
  "Customer Mobile":"customerMobile","Branch":"branch","Department":"department",
  "Call Type":"callType","Call Result":"callResult","Call Duration":"callDuration",
  "cq1":"cq1","cq2":"cq2","cq3":"cq3","cq4":"cq4","cq5":"cq5",
  "cq6":"cq6","cq7":"cq7","cq8":"cq8","cq9":"cq9","cq10":"cq10",
  "Score":"score","Comments":"comments","Follow Up":"followUp"
};
function normaliseCall(r) {
  const o = normalise(r, C_MAP);
  o.score = parseFloat(o.score) || 0;
  return o;
}

// ================================================================
//  MODULE 3 — COMPLAINTS
//  POST fields: complaintId, complaintDate, customerName, customerMobile,
//               channel, branch, complaintType, subCategory, agentOwner,
//               priority, status, escalated, slaHours, resolutionDate,
//               resolutionNotes, rootCause, qaNotes,
//               resolutionTimeHours, slaMet, agingDays
// ================================================================
export const submitComplaint = p => post({ module:"complaints", ...p });

export async function fetchComplaints() {
  const rows = await get("complaints", demoComplaints);
  return rows.map(normaliseComplaint).sort(byTsDesc);
}

const K_MAP = {
  "Timestamp":"timestamp","Complaint ID":"complaintId","Complaint Date":"complaintDate",
  "Customer Name":"customerName","Customer Mobile":"customerMobile",
  "Channel":"channel","Branch":"branch","Complaint Type":"complaintType",
  "Sub Category":"subCategory","Agent Owner":"agentOwner","Priority":"priority",
  "Status":"status","Escalated":"escalated","SLA Hours":"slaHours",
  "Resolution Date":"resolutionDate","Resolution Notes":"resolutionNotes",
  "Root Cause":"rootCause","QA Notes":"qaNotes",
  "Resolution Time Hours":"resolutionTimeHours","SLA Met":"slaMet","Aging Days":"agingDays"
};
function normaliseComplaint(r) {
  const o = normalise(r, K_MAP);
  o.resolutionTimeHours = parseFloat(o.resolutionTimeHours) || null;
  o.agingDays           = parseFloat(o.agingDays)           || null;
  o.slaHours            = parseFloat(o.slaHours)            || null;
  return o;
}

// ── Shared helpers ───────────────────────────────────────────────
function normalise(raw, map) {
  const o = {};
  for (const [k, v] of Object.entries(raw)) o[map[k] ?? k] = v ?? "";
  return o;
}
const byTsDesc = (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0);

// ── Demo data (shown when endpoint unreachable) ──────────────────
function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

function demoVisits() {
  const agents   = ["Ahmed Samy","Sara Khaled","Omar Tarek","Dina Fouad","Karim Hassan"];
  const branches = ["Branch Alpha","Branch Beta","Branch Gamma","Branch Delta","Branch Epsilon"];
  const aw       = ["Aware","Not Aware"];
  const yn       = ["Yes","No"];
  return Array.from({ length:50 }, (_, i) => {
    const d = daysAgo(i % 30);
    return { timestamp:d.toISOString(), branchUser:branches[i%branches.length],
      agentUser:agents[i%agents.length], employeeName:`Employee ${i+1}`,
      mobile:`010${String(10000007+i*7).slice(0,8)}`,
      visitDate:d.toISOString().slice(0,10),
      q1:rnd(aw), q2:rnd(aw), q3:rnd(yn), q4:rnd(aw),
      comments:`Visit note #${i+1}` };
  });
}

function demoCalls() {
  const agents   = ["Mona Hassan","Ali Salem","Rania Ahmed","Khaled Nour","Hana Mostafa"];
  const evals    = ["QA Lead","Supervisor A","Supervisor B"];
  const branches = ["CS Cairo","CS Alex","Operations","Technical","Back Office"];
  const types    = ["Inbound","Outbound","Complaint","Inquiry"];
  const results  = ["Resolved","Not Resolved","Escalated","Transfer"];
  const yn=["Yes","No"], pf=["Pass","Fail"], aw=["Aware","Not Aware"];
  const qTypes   = ["yn","yn","yn","yn","yn","pf","pf","yn","yn","aware"];
  return Array.from({ length:50 }, (_, i) => {
    const d = daysAgo(i % 30);
    const qs = {};
    qTypes.forEach((t, j) => { qs[`cq${j+1}`] = rnd(t==="yn"?yn:t==="pf"?pf:aw); });
    const pos = Object.values(qs).filter(v => ["Yes","Pass","Aware"].includes(v)).length;
    return { timestamp:d.toISOString(), agentName:rnd(agents), evaluatorName:rnd(evals),
      callDate:d.toISOString().slice(0,10), callTime:"10:00",
      customerName:`Customer ${i+1}`, customerMobile:`0111${String(1000000+i).slice(0,7)}`,
      branch:rnd(branches), department:rnd(branches), callType:rnd(types), callResult:rnd(results),
      callDuration:`${3+Math.floor(Math.random()*10)}:00`,
      score:Math.round(pos/10*100), comments:`Eval note #${i+1}`, followUp:rnd(["Yes","No"]), ...qs };
  });
}

function demoComplaints() {
  const ch=["Call","Branch","WhatsApp","App","Email"];
  const ty=["Product Issue","Service Issue","Staff Complaint","Technical Issue","Billing"];
  const pr=["Low","Medium","High","Critical"];
  const st=["Open","In Progress","Closed","Escalated"];
  const ag=["Ahmed Samy","Sara Khaled","Omar Tarek","Dina Fouad"];
  const br=["Branch Alpha","Branch Beta","Branch Gamma","Branch Delta"];
  const sla={ "Low":120,"Medium":48,"High":24,"Critical":4 };
  return Array.from({ length:45 }, (_, i) => {
    const d = daysAgo(i % 45);
    const priority = rnd(pr), status = rnd(st);
    const slaH = sla[priority];
    const resDate = status==="Closed" ? daysAgo(Math.max(0,i%20)) : null;
    const resHrs  = resDate ? Math.round((resDate-d)/3600000) : null;
    const aging   = Math.round((new Date()-d)/86400000);
    const slaMet  = resHrs!=null ? (resHrs<=slaH?"Yes":"No") : "Pending";
    return { timestamp:d.toISOString(),
      complaintId:`CMP-${String(1000+i).padStart(4,"0")}`,
      complaintDate:d.toISOString().slice(0,10),
      customerName:`Customer ${i+1}`, customerMobile:`0122${String(1000000+i).slice(0,7)}`,
      channel:rnd(ch), branch:rnd(br), complaintType:rnd(ty),
      subCategory:"General", agentOwner:rnd(ag), priority, status,
      escalated:priority==="Critical"?"Yes":"No", slaHours:slaH,
      resolutionDate:resDate?resDate.toISOString().slice(0,10):"",
      resolutionNotes:status==="Closed"?`Resolved via ${rnd(ch)}`:"",
      rootCause:rnd(["Process Gap","Staff Error","System Bug","Policy Issue","Unknown"]),
      qaNotes:`QA #${i+1}`, resolutionTimeHours:resHrs, slaMet, agingDays:aging };
  });
}
