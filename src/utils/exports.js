// src/utils/exports.js
import * as XLSX from "xlsx";

function dl(blob, filename) {
  const a = Object.assign(document.createElement("a"), { href:URL.createObjectURL(blob), download:filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
}
function csv(headers, rows) {
  return [headers,...rows].map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
}
function xlsx(headers, rows, sheet, filename) {
  const ws = XLSX.utils.aoa_to_sheet([headers,...rows]);
  ws["!cols"] = headers.map(()=>({wch:18}));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,sheet);
  XLSX.writeFile(wb,filename);
}

// ── Visits ────────────────────────────────────────────────────────
const VH = ["Timestamp","Branch User","Agent","Employee","Mobile","Visit Date","Q1 Project","Q2 Burn Methods","Q3 Live Email","Q4 Support No.","Comments"];
const vr = r => [r.timestamp,r.branchUser,r.agentUser,r.employeeName,r.mobile,r.visitDate,r.q1,r.q2,r.q3,r.q4,r.comments];
export const exportVisitsCSV   = rs => dl(new Blob(["\uFEFF"+csv(VH,rs.map(vr))],{type:"text/csv;charset=utf-8;"}), "visits.csv");
export const exportVisitsExcel = rs => xlsx(VH, rs.map(vr), "Visits", "visits.xlsx");

// ── Calls ─────────────────────────────────────────────────────────
const CH = ["Timestamp","Agent","Evaluator","Call Date","Call Time","Customer","Mobile","Branch","Dept","Type","Result","Duration","CQ1","CQ2","CQ3","CQ4","CQ5","CQ6","CQ7","CQ8","CQ9","CQ10","Score %","Comments","Follow Up"];
const cr = r => [r.timestamp,r.agentName,r.evaluatorName,r.callDate,r.callTime,r.customerName,r.customerMobile,r.branch,r.department,r.callType,r.callResult,r.callDuration,r.cq1,r.cq2,r.cq3,r.cq4,r.cq5,r.cq6,r.cq7,r.cq8,r.cq9,r.cq10,r.score,r.comments,r.followUp];
export const exportCallsCSV   = rs => dl(new Blob(["\uFEFF"+csv(CH,rs.map(cr))],{type:"text/csv;charset=utf-8;"}), "calls.csv");
export const exportCallsExcel = rs => xlsx(CH, rs.map(cr), "Calls", "calls.xlsx");

// ── Complaints ────────────────────────────────────────────────────
const KH = ["Timestamp","ID","Date","Customer","Mobile","Channel","Branch","Type","Sub Cat","Owner","Priority","Status","Escalated","SLA Hrs","Resolution Date","Resolution Notes","Root Cause","QA Notes","Res Time (hrs)","SLA Met","Aging (days)"];
const kr = r => [r.timestamp,r.complaintId,r.complaintDate,r.customerName,r.customerMobile,r.channel,r.branch,r.complaintType,r.subCategory,r.agentOwner,r.priority,r.status,r.escalated,r.slaHours,r.resolutionDate,r.resolutionNotes,r.rootCause,r.qaNotes,r.resolutionTimeHours,r.slaMet,r.agingDays];
export const exportComplaintsCSV   = rs => dl(new Blob(["\uFEFF"+csv(KH,rs.map(kr))],{type:"text/csv;charset=utf-8;"}), "complaints.csv");
export const exportComplaintsExcel = rs => xlsx(KH, rs.map(kr), "Complaints", "complaints.xlsx");
