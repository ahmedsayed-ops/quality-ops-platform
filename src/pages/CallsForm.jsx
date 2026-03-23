// src/pages/CallsForm.jsx
import React, { useState, useCallback } from "react";
import config from "../config";
import { submitCall } from "../services/api";
import { calcScore } from "../utils/answers";
import { FormSection, FormField, AnsToggle, Alert, Spinner, SuccessScreen } from "../components/shared/UI";

const CQ = config.CALL_QUESTIONS.map(q=>q.key);
const EMPTY = { agentName:"", evaluatorName:"", callDate:new Date().toISOString().slice(0,10),
  callTime:"", customerName:"", customerMobile:"", branch:"", department:"",
  callType:"", callResult:"", callDuration:"", comments:"", followUp:"",
  ...Object.fromEntries(CQ.map(k=>[k,""])) };

export default function CallsForm() {
  const [form,setForm]=useState(EMPTY);
  const [errs,setErrs]=useState({});
  const [status,setStatus]=useState("idle");
  const [msg,setMsg]=useState("");

  const set=useCallback((k,v)=>{ setForm(p=>({...p,[k]:v})); setErrs(p=>{const n={...p};delete n[k];return n;}); },[]);

  const score = calcScore(CQ.map(k=>form[k]));

  const validate=()=>{
    const e={};
    if(!form.agentName.trim())     e.agentName="Agent Name is required";
    if(!form.evaluatorName.trim()) e.evaluatorName="Evaluator Name is required";
    if(!form.callDate)             e.callDate="Call Date is required";
    if(!form.branch.trim())        e.branch="Branch / Department is required";
    if(!form.callType)             e.callType="Call Type is required";
    if(!form.callResult)           e.callResult="Call Result is required";
    config.CALL_QUESTIONS.forEach(q=>{ if(!form[q.key]) e[q.key]="Please select an answer"; });
    if(!form.comments.trim())      e.comments="Comments are required";
    if(!form.followUp)             e.followUp="Follow-up selection is required";
    return e;
  };

  const handleSubmit=async()=>{
    const ve=validate();
    if(Object.keys(ve).length){ setErrs(ve); document.getElementById(`field-${Object.keys(ve)[0]}`)?.scrollIntoView({behavior:"smooth",block:"center"}); return; }
    setStatus("loading"); setMsg("");
    try {
      await submitCall({ ...form, score, agentName:form.agentName.trim(), evaluatorName:form.evaluatorName.trim(), branch:form.branch.trim(), comments:form.comments.trim() });
      setStatus("success");
    } catch(err){ setStatus("error"); setMsg(err.message||"Submission failed."); }
  };

  const reset=()=>{ setForm({...EMPTY,callDate:new Date().toISOString().slice(0,10)}); setErrs({}); setStatus("idle"); setMsg(""); window.scrollTo({top:0,behavior:"smooth"}); };

  if(status==="success") return <SuccessScreen title="Call Evaluation Saved!" subtitle="The evaluation has been recorded in Google Sheets." date={form.callDate} onNew={reset} btnLabel="Evaluate Another Call"/>;

  const ec=Object.keys(errs).length;
  const sc=score>=90?"text-emerald-600":score>=75?"text-brand-600":score>=60?"text-amber-600":"text-red-600";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      <div className="mb-6">
        <div className="page-pill bg-green-50 text-green-700 border-green-200">📞 Calls Quality</div>
        <h1 className="page-title">Call Quality Evaluation</h1>
        <p className="page-subtitle">Evaluate agent performance. Score is calculated automatically.</p>
      </div>

      {/* Live score */}
      <div className="flex items-center gap-3 mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-xl animate-slide-up">
        <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-lg flex-shrink-0">📊</div>
        <div className="flex-1"><div className="text-xs text-slate-500 font-display font-semibold uppercase tracking-wide">Live Score</div><div className="text-xs text-slate-400 mt-0.5">Updates as you answer quality questions</div></div>
        <div className={`font-display font-extrabold text-3xl ${sc}`}>{score}%</div>
      </div>

      {status==="error"&&<Alert type="error" title="Submission Failed" message={msg} onClose={()=>setStatus("idle")} className="mb-5"/>}
      {ec>0&&<Alert type="warning" title={`${ec} field${ec>1?"s":""} need attention`} message="Please fix the highlighted fields." className="mb-5"/>}

      <FormSection title="Call Information" icon="📞" number={1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="agentName" label="Agent Name" error={errs.agentName} required>
            <input id="field-agentName" className={`input-field ${errs.agentName?"has-error":""}`} placeholder="Agent full name" value={form.agentName} onChange={e=>set("agentName",e.target.value)}/>
          </FormField>
          <FormField id="evaluatorName" label="Evaluator Name" error={errs.evaluatorName} required>
            <input id="field-evaluatorName" className={`input-field ${errs.evaluatorName?"has-error":""}`} placeholder="QA evaluator name" value={form.evaluatorName} onChange={e=>set("evaluatorName",e.target.value)}/>
          </FormField>
          <FormField id="callDate" label="Call Date" error={errs.callDate} required>
            <input id="field-callDate" type="date" className={`input-field ${errs.callDate?"has-error":""}`} value={form.callDate} onChange={e=>set("callDate",e.target.value)}/>
          </FormField>
          <FormField id="callTime" label="Call Time" hint="Optional">
            <input type="time" className="input-field" value={form.callTime} onChange={e=>set("callTime",e.target.value)}/>
          </FormField>
          <FormField id="callType" label="Call Type" error={errs.callType} required>
            <select id="field-callType" className={`input-field ${errs.callType?"has-error":""}`} value={form.callType} onChange={e=>set("callType",e.target.value)}>
              <option value="">Select type…</option>
              {config.CALL_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField id="callResult" label="Call Result" error={errs.callResult} required>
            <select id="field-callResult" className={`input-field ${errs.callResult?"has-error":""}`} value={form.callResult} onChange={e=>set("callResult",e.target.value)}>
              <option value="">Select result…</option>
              {config.CALL_RESULTS.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </FormField>
          <FormField id="branch" label="Branch / Department" error={errs.branch} required>
            <input id="field-branch" className={`input-field ${errs.branch?"has-error":""}`} placeholder="e.g. CS Cairo" value={form.branch} onChange={e=>set("branch",e.target.value)}/>
          </FormField>
          <FormField id="callDuration" label="Call Duration" hint="Optional, e.g. 5:30">
            <input className="input-field font-mono" placeholder="mm:ss" value={form.callDuration} onChange={e=>set("callDuration",e.target.value)}/>
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Customer Info" icon="👤" number={2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="customerName" label="Customer Name / ID" hint="Optional">
            <input className="input-field" placeholder="Customer name or ID" value={form.customerName} onChange={e=>set("customerName",e.target.value)}/>
          </FormField>
          <FormField id="customerMobile" label="Customer Mobile" hint="Optional">
            <input className="input-field font-mono" placeholder="01012345678" value={form.customerMobile} inputMode="numeric" onChange={e=>set("customerMobile",e.target.value.replace(/\D/g,""))}/>
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Quality Assessment" icon="✅" number={3}>
        <p className="text-slate-400 text-xs mb-4">Supports <strong className="text-slate-600">Yes/No</strong>, <strong className="text-slate-600">Pass/Fail</strong>, and <strong className="text-slate-600">Aware/Not Aware</strong> per question.</p>
        <div className="space-y-4">
          {config.CALL_QUESTIONS.map((q,i)=>(
            <AnsToggle key={q.key} id={q.key} index={i+1} label={q.label} value={form[q.key]} error={errs[q.key]} onChange={v=>set(q.key,v)} answerType={q.answerType}/>
          ))}
        </div>
        <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div><div className="text-xs text-slate-500 font-display font-semibold uppercase tracking-wide">Calculated Score</div><div className="text-xs text-slate-400 mt-0.5">{CQ.filter(k=>form[k]).length}/{CQ.length} answered</div></div>
          <div className={`font-display font-extrabold text-4xl ${sc}`}>{score}%</div>
        </div>
      </FormSection>

      <FormSection title="Follow-up & Comments" icon="💬" number={4}>
        <div className="mb-4">
          <div className="text-xs font-display font-semibold text-slate-600 mb-2">Follow-up Required? <span className="text-red-400">*</span></div>
          <div id="field-followUp" className="flex gap-3">
            {["Yes","No"].map(v=>(
              <button key={v} type="button" onClick={()=>set("followUp",v)} aria-pressed={form.followUp===v}
                className={`ans-btn ${form.followUp===v?(v==="Yes"?"ans-negative":"ans-positive"):"ans-neutral"}`}>
                {v==="Yes"?"⚠️":"✓"} {v}
              </button>
            ))}
          </div>
          {errs.followUp&&<p className="text-red-500 text-xs mt-1.5">{errs.followUp}</p>}
        </div>
        <FormField id="comments" label="Evaluation Notes" error={errs.comments} required>
          <textarea id="field-comments" rows={4} className={`input-field resize-none ${errs.comments?"has-error":""}`} placeholder="Evaluation notes, observations, or coaching feedback…" value={form.comments} onChange={e=>set("comments",e.target.value)}/>
        </FormField>
      </FormSection>

      <button onClick={handleSubmit} disabled={status==="loading"} className="btn-primary w-full py-4 text-base" style={{background:"#16a34a"}}>
        {status==="loading"?<><Spinner size="sm" className="text-white"/>Submitting…</>:<><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Submit Evaluation (Score: {score}%)</>}
      </button>
      <p className="text-center text-xs text-slate-400 mt-3">All <span className="text-red-400 font-semibold">*</span> fields required.</p>
    </div>
  );
}
