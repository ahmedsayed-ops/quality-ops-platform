// src/pages/VisitsForm.jsx
// POST: branchUser, agentUser, employeeName, mobile, visitDate, q1–q4, comments
// q1,q2,q4 = Aware/Not Aware  |  q3 = Yes/No
import React, { useState, useCallback } from "react";
import config from "../config";
import { submitVisit } from "../services/api";
import { calcScore } from "../utils/answers";
import { FormSection, FormField, AnsToggle, Alert, Spinner, SuccessScreen } from "../components/shared/UI";

const EMPTY = { branchUser:"", agentUser:"", employeeName:"", mobile:"", comments:"",
                q1:"", q2:"", q3:"", q4:"" };

export default function VisitsForm() {
  const [form, setForm]   = useState(EMPTY);
  const [errs, setErrs]   = useState({});
  const [status, setStatus] = useState("idle");
  const [msg, setMsg]     = useState("");
  const today = new Date().toISOString().slice(0,10);

  const set = useCallback((k,v) => { setForm(p=>({...p,[k]:v})); setErrs(p=>{const n={...p};delete n[k];return n;}); }, []);

  const validate = () => {
    const e = {};
    if (!form.branchUser.trim())   e.branchUser   = "Branch User is required";
    if (!form.agentUser.trim())    e.agentUser    = "Field Agent User is required";
    if (!form.employeeName.trim()) e.employeeName = "Employee name is required";
    if (!form.mobile.trim())                          e.mobile = "Mobile is required";
    else if (!/^\d{7,15}$/.test(form.mobile.trim())) e.mobile = "Numbers only, 7–15 digits";
    config.VISIT_QUESTIONS.forEach(q => { if (!form[q.key]) e[q.key] = "Please select an answer"; });
    if (!form.comments.trim()) e.comments = "Comments are required";
    return e;
  };

  const handleSubmit = async () => {
    const ve = validate();
    if (Object.keys(ve).length) {
      setErrs(ve);
      document.getElementById(`field-${Object.keys(ve)[0]}`)?.scrollIntoView({behavior:"smooth",block:"center"});
      return;
    }
    setStatus("loading"); setMsg("");
    try {
      await submitVisit({ branchUser:form.branchUser.trim(), agentUser:form.agentUser.trim(),
        employeeName:form.employeeName.trim(), mobile:form.mobile.trim(), visitDate:today,
        q1:form.q1, q2:form.q2, q3:form.q3, q4:form.q4, comments:form.comments.trim() });
      setStatus("success");
    } catch(err) { setStatus("error"); setMsg(err.message||"Submission failed."); }
  };

  const reset = () => { setForm(EMPTY); setErrs({}); setStatus("idle"); setMsg(""); window.scrollTo({top:0,behavior:"smooth"}); };

  if (status === "success") return <SuccessScreen title="Visit Assessment Saved!" subtitle="Data has been recorded in Google Sheets." date={today} onNew={reset}/>;

  const ec = Object.keys(errs).length;
  const score = calcScore(config.VISIT_QUESTIONS.map(q=>form[q.key]));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      <div className="mb-6">
        <div className="page-pill bg-brand-50 text-brand-700 border-brand-200">🏪 Visits Quality</div>
        <h1 className="page-title">Visit Assessment Form</h1>
        <p className="page-subtitle">Complete all required fields to submit a branch visit assessment.</p>
      </div>

      {/* Visit date badge */}
      <div className="flex items-center gap-3 mb-6 p-3.5 bg-brand-50 border border-brand-100 rounded-xl animate-slide-up">
        <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </div>
        <div className="flex-1">
          <div className="text-xs text-brand-600 font-display font-semibold uppercase tracking-wide">Visit Date — Auto-generated</div>
          <div className="font-mono font-bold text-brand-800 text-sm mt-0.5">{today}</div>
        </div>
        <span className="badge badge-blue">Today</span>
      </div>

      {status==="error" && <Alert type="error" title="Submission Failed" message={msg} onClose={()=>setStatus("idle")} className="mb-5"/>}
      {ec>0 && <Alert type="warning" title={`${ec} field${ec>1?"s":""} need attention`} message="Please fix the highlighted fields." className="mb-5"/>}

      <FormSection title="Visit Information" icon="👤" number={1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="branchUser" label="Branch User" error={errs.branchUser} required>
            <input id="field-branchUser" className={`input-field ${errs.branchUser?"has-error":""}`} placeholder="e.g. Branch Alpha" value={form.branchUser} onChange={e=>set("branchUser",e.target.value)} autoComplete="off"/>
          </FormField>
          <FormField id="agentUser" label="Field Agent User" error={errs.agentUser} required>
            <input id="field-agentUser" className={`input-field ${errs.agentUser?"has-error":""}`} placeholder="e.g. Ahmed Samy" value={form.agentUser} onChange={e=>set("agentUser",e.target.value)} autoComplete="off"/>
          </FormField>
          <FormField id="employeeName" label="Branch Employee Name" error={errs.employeeName} required>
            <input id="field-employeeName" className={`input-field ${errs.employeeName?"has-error":""}`} placeholder="Full employee name" value={form.employeeName} onChange={e=>set("employeeName",e.target.value)} autoComplete="off"/>
          </FormField>
          <FormField id="mobile" label="Mobile Number" hint="Numbers only" error={errs.mobile} required>
            <input id="field-mobile" className={`input-field font-mono ${errs.mobile?"has-error":""}`} placeholder="01012345678" value={form.mobile} inputMode="numeric" type="tel" maxLength={15} onChange={e=>set("mobile",e.target.value.replace(/\D/g,""))}/>
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Quality Assessment" icon="✅" number={2}>
        <p className="text-slate-400 text-xs mb-4">Q1, Q2, Q4: <strong className="text-slate-600">Aware / Not Aware</strong> &nbsp;·&nbsp; Q3: <strong className="text-slate-600">Yes / No</strong></p>
        <div className="space-y-4">
          {config.VISIT_QUESTIONS.map((q,i) => (
            <AnsToggle key={q.key} id={q.key} index={i+1} label={q.label} value={form[q.key]} error={errs[q.key]} onChange={v=>set(q.key,v)} answerType={q.answerType}/>
          ))}
        </div>
        {/* Live score */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <span className="text-xs text-slate-500 font-display font-semibold uppercase tracking-wide">Visit Score</span>
          <span className={`font-display font-extrabold text-2xl ${score>=75?"text-emerald-600":score>=60?"text-amber-600":"text-red-600"}`}>{score}%</span>
        </div>
      </FormSection>

      <FormSection title="Comments & Notes" icon="💬" number={3}>
        <FormField id="comments" label="Observations / Follow-up" error={errs.comments} required>
          <textarea id="field-comments" rows={4} className={`input-field resize-none ${errs.comments?"has-error":""}`} placeholder="Enter observations or follow-up actions…" value={form.comments} onChange={e=>set("comments",e.target.value)}/>
          <div className="flex justify-end mt-1"><span className={`text-xs ${form.comments.length>450?"text-amber-500":"text-slate-300"}`}>{form.comments.length}/500</span></div>
        </FormField>
      </FormSection>

      <button onClick={handleSubmit} disabled={status==="loading"} className="btn-primary w-full py-4 text-base">
        {status==="loading"?<><Spinner size="sm" className="text-white"/>Submitting…</>:<><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Submit Assessment</>}
      </button>
      <p className="text-center text-xs text-slate-400 mt-3">All <span className="text-red-400 font-semibold">*</span> fields required. Saved to Google Sheets.</p>
    </div>
  );
}
