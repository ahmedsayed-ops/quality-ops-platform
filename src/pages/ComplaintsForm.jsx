// src/pages/ComplaintsForm.jsx
import React, { useState, useCallback, useEffect } from "react";
import config from "../config";
import { submitComplaint } from "../services/api";
import { FormSection, FormField, Alert, Spinner, SuccessScreen } from "../components/shared/UI";

const genId = () => `CMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
const todayStr = () => new Date().toISOString().slice(0,10);

const EMPTY = {
  complaintDate: todayStr(), customerName:"", customerMobile:"",
  channel:"", branch:"", complaintType:"", subCategory:"",
  agentOwner:"", priority:"Medium", status:"Open",
  escalated:"No", resolutionDate:"", resolutionNotes:"",
  rootCause:"", qaNotes:""
};

export default function ComplaintsForm() {
  const [form,   setForm]   = useState({ ...EMPTY, complaintId: genId() });
  const [errs,   setErrs]   = useState({});
  const [status, setStatus] = useState("idle");
  const [msg,    setMsg]    = useState("");

  const set = useCallback((k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrs(p => { const n = { ...p }; delete n[k]; return n; });
  }, []);

  // Sub-categories depend on complaint type — reset on type change
  useEffect(() => { set("subCategory", ""); }, [form.complaintType]); // eslint-disable-line
  // Auto-escalate critical
  useEffect(() => { if (form.priority === "Critical") set("escalated", "Yes"); }, [form.priority]); // eslint-disable-line

  const slaHours = config.SLA_BY_PRIORITY[form.priority] || 48;
  const subCats  = config.COMPLAINT_SUB_CATEGORIES[form.complaintType] || [];

  // Auto-calculated fields
  const { resTimeHours, slaMet, agingDays } = (() => {
    const start = form.complaintDate ? new Date(form.complaintDate) : null;
    const end   = form.resolutionDate ? new Date(form.resolutionDate) : null;
    const now   = new Date();
    const aging = start ? Math.round((now - start) / 86400000) : null;
    if (!start || !end) return { resTimeHours: null, slaMet: "Pending", agingDays: aging };
    const hrs = Math.round((end - start) / 3600000);
    return { resTimeHours: hrs, slaMet: hrs <= slaHours ? "Yes" : "No", agingDays: aging };
  })();

  const validate = () => {
    const e = {};
    if (!form.complaintDate)        e.complaintDate  = "Complaint Date is required";
    if (!form.customerName.trim())  e.customerName   = "Customer Name is required";
    if (!form.channel)              e.channel        = "Channel is required";
    if (!form.complaintType)        e.complaintType  = "Complaint Type is required";
    if (!form.subCategory)          e.subCategory    = "Sub Category is required";
    if (!form.agentOwner.trim())    e.agentOwner     = "Agent / Owner is required";
    if (!form.priority)             e.priority       = "Priority is required";
    if (!form.status)               e.status         = "Status is required";
    return e;
  };

  const handleSubmit = async () => {
    const ve = validate();
    if (Object.keys(ve).length) {
      setErrs(ve);
      document.getElementById(`field-${Object.keys(ve)[0]}`)?.scrollIntoView({ behavior:"smooth", block:"center" });
      return;
    }
    setStatus("loading"); setMsg("");
    try {
      await submitComplaint({ ...form, slaHours, resolutionTimeHours: resTimeHours, slaMet, agingDays });
      setStatus("success");
    } catch (err) { setStatus("error"); setMsg(err.message || "Submission failed."); }
  };

  const reset = () => {
    setForm({ ...EMPTY, complaintId: genId() });
    setErrs({}); setStatus("idle"); setMsg("");
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  if (status === "success") return (
    <SuccessScreen
      title="Complaint Recorded!"
      subtitle={`Complaint ${form.complaintId} has been created successfully.`}
      date={form.complaintDate}
      onNew={reset}
      btnLabel="Record Another Complaint"
    />
  );

  const ec = Object.keys(errs).length;
  const statusBadge = { "Open":"badge-red","In Progress":"badge-amber","Pending Customer":"badge-purple","Escalated":"badge-red","Closed":"badge-green" }[form.status] || "badge-slate";
  const prioBadge   = { "Low":"badge-slate","Medium":"badge-amber","High":"badge-red","Critical":"badge-red" }[form.priority] || "badge-slate";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      <div className="mb-6">
        <div className="page-pill bg-orange-50 text-orange-700 border-orange-200">📋 Complaints</div>
        <h1 className="page-title">New Complaint Entry</h1>
        <p className="page-subtitle">Complaint ID is auto-generated. SLA and aging are calculated automatically.</p>
      </div>

      {/* Auto-generated ID strip */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-3.5 bg-orange-50 border border-orange-100 rounded-xl animate-slide-up">
        <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-lg flex-shrink-0">🎫</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-orange-600 font-display font-semibold uppercase tracking-wide">Complaint ID — Auto-generated</div>
          <div className="font-mono font-bold text-orange-800 text-sm mt-0.5 truncate">{form.complaintId}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className={`badge ${statusBadge}`}>{form.status}</span>
          <span className={`badge ${prioBadge}`}>{form.priority}</span>
          <span className="badge badge-blue">SLA: {slaHours}h</span>
          {slaMet !== "Pending" && (
            <span className={`badge ${slaMet === "Yes" ? "badge-green" : "badge-red"}`}>SLA: {slaMet}</span>
          )}
        </div>
      </div>

      {status === "error" && <Alert type="error" title="Submission Failed" message={msg} onClose={() => setStatus("idle")} className="mb-5"/>}
      {ec > 0 && <Alert type="warning" title={`${ec} field${ec>1?"s":""} need attention`} message="Please fix the highlighted fields." className="mb-5"/>}

      {/* ── Section 1: Complaint Details ── */}
      <FormSection title="Complaint Details" icon="🎫" number={1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <FormField id="complaintDate" label="Complaint Date" error={errs.complaintDate} required>
            <input id="field-complaintDate" type="date"
              className={`input-field ${errs.complaintDate ? "has-error" : ""}`}
              value={form.complaintDate} onChange={e => set("complaintDate", e.target.value)}/>
          </FormField>

          <FormField id="channel" label="Channel / Source" error={errs.channel} required>
            <select id="field-channel"
              className={`input-field ${errs.channel ? "has-error" : ""}`}
              value={form.channel} onChange={e => set("channel", e.target.value)}>
              <option value="">Select channel…</option>
              {config.COMPLAINT_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>

          <FormField id="complaintType" label="Complaint Type" error={errs.complaintType} required>
            <select id="field-complaintType"
              className={`input-field ${errs.complaintType ? "has-error" : ""}`}
              value={form.complaintType} onChange={e => set("complaintType", e.target.value)}>
              <option value="">Select type…</option>
              {config.COMPLAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>

          <FormField id="subCategory" label="Sub Category" error={errs.subCategory} required>
            <select id="field-subCategory"
              className={`input-field ${errs.subCategory ? "has-error" : ""}`}
              value={form.subCategory} onChange={e => set("subCategory", e.target.value)}
              disabled={!form.complaintType}>
              <option value="">{form.complaintType ? "Select sub-category…" : "Select type first"}</option>
              {subCats.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>

          <FormField id="priority" label="Priority" error={errs.priority} required>
            <select id="field-priority"
              className={`input-field ${errs.priority ? "has-error" : ""}`}
              value={form.priority} onChange={e => set("priority", e.target.value)}>
              {config.COMPLAINT_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </FormField>

          <FormField id="status" label="Status" error={errs.status} required>
            <select id="field-status"
              className={`input-field ${errs.status ? "has-error" : ""}`}
              value={form.status} onChange={e => set("status", e.target.value)}>
              {config.COMPLAINT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>

          <FormField id="branch" label="Branch">
            <input className="input-field" placeholder="Branch name" value={form.branch}
              onChange={e => set("branch", e.target.value)}/>
          </FormField>

          <FormField id="agentOwner" label="Agent / Owner" error={errs.agentOwner} required>
            <input id="field-agentOwner"
              className={`input-field ${errs.agentOwner ? "has-error" : ""}`}
              placeholder="Responsible agent or team" value={form.agentOwner}
              onChange={e => set("agentOwner", e.target.value)}/>
          </FormField>

          <FormField id="escalated" label="Escalated?" hint="Auto-set for Critical">
            <select className="input-field" value={form.escalated} onChange={e => set("escalated", e.target.value)}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </FormField>

        </div>
      </FormSection>

      {/* ── Section 2: Customer Info ── */}
      <FormSection title="Customer Information" icon="👤" number={2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="customerName" label="Customer Name" error={errs.customerName} required>
            <input id="field-customerName"
              className={`input-field ${errs.customerName ? "has-error" : ""}`}
              placeholder="Full customer name" value={form.customerName}
              onChange={e => set("customerName", e.target.value)}/>
          </FormField>
          <FormField id="customerMobile" label="Customer Mobile" hint="Optional">
            <input className="input-field font-mono" placeholder="01012345678"
              value={form.customerMobile} inputMode="numeric"
              onChange={e => set("customerMobile", e.target.value.replace(/\D/g, ""))}/>
          </FormField>
        </div>
      </FormSection>

      {/* ── Section 3: Resolution ── */}
      <FormSection title="Resolution" icon="✅" number={3}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <FormField id="resolutionDate" label="Resolution Date" hint="Leave blank if still open">
            <input type="date" className="input-field" value={form.resolutionDate}
              onChange={e => set("resolutionDate", e.target.value)}
              min={form.complaintDate || undefined}/>
          </FormField>

          {/* Auto-calculated summary */}
          <div className="flex flex-col justify-end pb-1">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              {[
                ["Resolution Time:", resTimeHours != null ? `${resTimeHours}h` : "—"],
                ["Aging:",           agingDays != null ? `${agingDays} days` : "—"],
                ["SLA Target:",      `${slaHours}h`],
                ["SLA Met:",         slaMet],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className={`font-semibold ${
                    label === "SLA Met:" && slaMet === "Yes" ? "text-emerald-600" :
                    label === "SLA Met:" && slaMet === "No"  ? "text-red-600" :
                    "text-slate-700"
                  }`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <FormField id="resolutionNotes" label="Resolution Notes" span2>
            <textarea className="input-field resize-none" rows={3}
              placeholder="Describe how the complaint was resolved…"
              value={form.resolutionNotes} onChange={e => set("resolutionNotes", e.target.value)}/>
          </FormField>

          <FormField id="rootCause" label="Root Cause">
            <input className="input-field" placeholder="Root cause of the complaint"
              value={form.rootCause} onChange={e => set("rootCause", e.target.value)}/>
          </FormField>

          <FormField id="qaNotes" label="QA Notes">
            <input className="input-field" placeholder="Internal QA observations"
              value={form.qaNotes} onChange={e => set("qaNotes", e.target.value)}/>
          </FormField>

        </div>
      </FormSection>

      <button
        onClick={handleSubmit}
        disabled={status === "loading"}
        className="btn-primary w-full py-4 text-base"
        style={{ background:"#ea580c" }}
      >
        {status === "loading"
          ? <><Spinner size="sm" className="text-white"/>Submitting…</>
          : <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
            </svg>Submit Complaint</>}
      </button>
      <p className="text-center text-xs text-slate-400 mt-3">
        All <span className="text-red-400 font-semibold">*</span> fields required. Saved to Google Sheets.
      </p>
    </div>
  );
}
