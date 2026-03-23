// src/components/shared/UI.jsx
// ── All reusable UI primitives ────────────────────────────────────
import React, { useState, useMemo } from "react";
import { ANSWER_OPTIONS } from "../../utils/answers";

// ── KpiCard ───────────────────────────────────────────────────────
const KPI_PAL = {
  blue:  {text:"text-brand-700",  icon:"bg-brand-100 text-brand-600",   bar:"bg-brand-500",  bd:"border-brand-100" },
  green: {text:"text-emerald-700",icon:"bg-emerald-100 text-emerald-600",bar:"bg-emerald-500",bd:"border-emerald-100"},
  red:   {text:"text-red-700",    icon:"bg-red-100 text-red-600",        bar:"bg-red-400",    bd:"border-red-100"   },
  sky:   {text:"text-sky-700",    icon:"bg-sky-100 text-sky-600",        bar:"bg-sky-500",    bd:"border-sky-100"   },
  amber: {text:"text-amber-700",  icon:"bg-amber-100 text-amber-600",    bar:"bg-amber-500",  bd:"border-amber-100" },
  purple:{text:"text-purple-700", icon:"bg-purple-100 text-purple-600",  bar:"bg-purple-500", bd:"border-purple-100"},
  orange:{text:"text-orange-700", icon:"bg-orange-100 text-orange-600",  bar:"bg-orange-500", bd:"border-orange-100"},
};

export function KpiCard({ title, value, subtitle, icon, color="blue", barPercent }) {
  const c = KPI_PAL[color]||KPI_PAL.blue;
  return (
    <div className={`card animate-slide-up flex flex-col gap-3 p-4 sm:p-5 border ${c.bd} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center text-xl flex-shrink-0`}>{icon}</div>
        <span className={`text-xs font-display font-semibold uppercase tracking-widest ${c.text} text-right leading-tight mt-0.5`}>{title}</span>
      </div>
      <div>
        <div className={`font-display font-extrabold text-3xl sm:text-4xl leading-none ${c.text}`}>{value}</div>
        {subtitle && <div className="text-slate-400 text-xs mt-1.5">{subtitle}</div>}
      </div>
      {barPercent !== undefined && (
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-auto">
          <div className={`h-full rounded-full ${c.bar} transition-all duration-700`}
               style={{width:`${Math.min(100,Math.max(0,barPercent))}%`}}/>
        </div>
      )}
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="card p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse"/>
        <div className="h-3 w-20 rounded-full bg-slate-100 animate-pulse mt-1"/>
      </div>
      <div>
        <div className="h-9 w-16 rounded-lg bg-slate-100 animate-pulse"/>
        <div className="h-2.5 w-24 rounded-full bg-slate-100 animate-pulse mt-2"/>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 animate-pulse"/>
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────────────
export function Alert({ type="info", title, message, onClose, className="" }) {
  const s = {error:"alert-err",warning:"alert-warn",info:"alert-info",success:"alert-ok"}[type]||"alert-info";
  const icon = {error:"⚠️",warning:"⚠",info:"ℹ️",success:"✓"}[type];
  return (
    <div className={`alert ${s} ${className}`}>
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="flex-1">
        {title&&<div className="font-display font-semibold text-sm">{title}</div>}
        {message&&<div className="text-sm mt-0.5 opacity-90">{message}</div>}
      </div>
      {onClose&&<button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity ml-1 flex-shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
      </button>}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────
export function Spinner({ size="md", className="" }) {
  const s = {sm:"w-4 h-4 border-2",md:"w-6 h-6 border-2",lg:"w-10 h-10 border-[3px]"}[size];
  return <div className={`${s} rounded-full border-current border-t-transparent animate-spin ${className}`} role="status"/>;
}

// ── PageLoader ────────────────────────────────────────────────────
export function PageLoader({ message="Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-5 animate-fade-in">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-brand-100"/>
        <div className="absolute inset-0 rounded-full border-4 border-brand-600 border-t-transparent animate-spin"/>
        <div className="absolute inset-2 rounded-full border-2 border-brand-300 border-b-transparent animate-spin" style={{animationDirection:"reverse",animationDuration:"0.7s"}}/>
      </div>
      <div className="text-center">
        <p className="font-display font-semibold text-slate-600 text-sm">{message}</p>
        <p className="text-slate-400 text-xs mt-1">Please wait…</p>
      </div>
    </div>
  );
}

// ── SuccessScreen ─────────────────────────────────────────────────
export function SuccessScreen({ title, subtitle, date, onNew, btnLabel="Submit Another" }) {
  return (
    <div className="max-w-md mx-auto px-4 py-16 flex flex-col items-center text-center animate-fade-in">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse-ring opacity-40"/>
        <div className="relative w-24 h-24 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
        </div>
      </div>
      <span className="badge badge-green mb-4">Submitted Successfully</span>
      <h2 className="font-display font-bold text-2xl text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 text-sm max-w-xs mx-auto mb-2">{subtitle}</p>
      {date&&<p className="text-slate-400 text-xs mb-10">Date: <strong>{date}</strong></p>}
      <button onClick={onNew} className="btn-primary px-10 py-3.5">{btnLabel}</button>
    </div>
  );
}

// ── FormSection ───────────────────────────────────────────────────
export function FormSection({ title, icon, number, children }) {
  return (
    <div className="fsection animate-slide-up" style={{animationDelay:`${(number||1)*60}ms`}}>
      <div className="fsection-header">
        <div className="fsection-icon">{icon}</div>
        <div>
          {number&&<div className="text-xs text-slate-400 font-mono mb-0.5">Section {number}</div>}
          <h2 className="font-display font-bold text-slate-800 text-base leading-tight">{title}</h2>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── FormField ─────────────────────────────────────────────────────
export function FormField({ id, label, children, error, hint, required, span2=false }) {
  return (
    <div className={span2?"sm:col-span-2":""}>
      <label htmlFor={id} className="block text-xs font-display font-semibold text-slate-600 mb-1.5">
        {label}{required&&<span className="text-red-400 ml-0.5">*</span>}
        {hint&&<span className="text-slate-400 font-normal ml-1">({hint})</span>}
      </label>
      {children}
      {error&&(
        <div className="flex items-center gap-1 mt-1.5 text-red-500 text-xs animate-slide-in">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/></svg>
          {error}
        </div>
      )}
    </div>
  );
}

// ── AnsToggle — Aware/Yes/Pass toggle button ──────────────────────
export function AnsToggle({ id, index, label, value, error, onChange, answerType="yn" }) {
  const opts = ANSWER_OPTIONS[answerType] || ANSWER_OPTIONS.yn;
  return (
    <div id={`field-${id}`} className={`p-4 rounded-xl border-2 transition-all duration-150 ${error?"border-red-200 bg-red-50/30":"border-slate-100 bg-slate-50/40"}`}>
      <div className={`text-sm font-display font-semibold mb-3 flex items-start gap-2 ${error?"text-red-700":"text-slate-700"}`}>
        {index!==undefined&&<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex-shrink-0 mt-0.5">{index}</span>}
        <span>{label} <span className="text-red-400">*</span></span>
      </div>
      <div className="flex gap-3">
        {opts.map(opt=>(
          <button key={opt.v} type="button" onClick={()=>onChange(opt.v)} aria-pressed={value===opt.v}
            className={`ans-btn ${value===opt.v?(opt.positive?"ans-positive":"ans-negative"):"ans-neutral"}`}>
            <span className="mr-1.5">{opt.icon}</span>{opt.v}
          </button>
        ))}
      </div>
      {error&&<div className="mt-2 text-red-500 text-xs flex items-center gap-1 animate-slide-in">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/></svg>{error}
      </div>}
    </div>
  );
}

// ── DashFilters ───────────────────────────────────────────────────
export function DashFilters({ filters, setFilters, dropdowns=[], onReset }) {
  const set=(k,v)=>setFilters(p=>({...p,[k]:v}));
  const active=Object.entries(filters).filter(([k,v])=>k!=="search"&&v&&v.trim()).length;
  return (
    <div className="card p-4 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 self-center mr-1">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
          <span className="font-display font-semibold text-slate-600 text-sm">Filters</span>
          {active>0&&<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-600 text-white text-xs font-bold">{active}</span>}
        </div>
        {[{key:"dateFrom",label:"From",type:"date"},{key:"dateTo",label:"To",type:"date"}].map(f=>(
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wide">{f.label}</label>
            <input type={f.type} value={filters[f.key]||""} onChange={e=>set(f.key,e.target.value)}
              className="input-field !py-2 text-xs w-36"/>
          </div>
        ))}
        {dropdowns.map(d=>(
          <div key={d.key} className="flex flex-col gap-1">
            <label className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wide">{d.label}</label>
            <select value={filters[d.key]||""} onChange={e=>set(d.key,e.target.value)} className="input-field !py-2 text-xs w-44">
              <option value="">All {d.label}</option>
              {d.options.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        {active>0&&<button onClick={onReset} className="btn-secondary !py-2 !px-3 text-xs self-end">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>Clear
        </button>}
      </div>
    </div>
  );
}

// ── DataTable — searchable paginated table ─────────────────────────
const PAGE=15;
function pageNums(cur,total){
  if(total<=7) return Array.from({length:total},(_,i)=>i+1);
  if(cur<=4)       return [1,2,3,4,5,"…",total];
  if(cur>=total-3) return [1,"…",total-4,total-3,total-2,total-1,total];
  return [1,"…",cur-1,cur,cur+1,"…",total];
}

export function DataTable({ title, records=[], columns=[], loading=false, searchFields=[] }) {
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState("");

  const filtered=useMemo(()=>{
    if(!search.trim()) return records;
    const q=search.toLowerCase();
    return records.filter(r=>(searchFields.length?searchFields:Object.keys(r)).some(k=>(r[k]||"").toString().toLowerCase().includes(q)));
  },[records,search,searchFields]);

  React.useEffect(()=>setPage(1),[search,records]);

  const total=Math.ceil(filtered.length/PAGE);
  const slice=filtered.slice((page-1)*PAGE,page*PAGE);

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h3 className="font-display font-bold text-slate-800">{title||"Records"}</h3>
          <p className="text-slate-400 text-xs mt-0.5">{loading?"Loading…":`${filtered.length} of ${records.length} records`}</p>
        </div>
        <div className="sm:ml-auto relative w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="input-field !pl-10 !py-2 text-xs"/>
          {search&&<button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>}
        </div>
      </div>
      <div className="overflow-x-auto">
        {loading?(
          <div className="p-4 space-y-2">{Array.from({length:6}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" style={{opacity:1-i*0.12}}/>)}</div>
        ):slice.length===0?(
          <div className="py-16 flex flex-col items-center gap-3 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">{search?"🔍":"📋"}</div>
            <div><p className="font-display font-semibold text-slate-600 text-sm">{search?"No matching records":"No records yet"}</p><p className="text-slate-400 text-xs mt-1">{search?"Try different terms.":"Submit records to see them here."}</p></div>
            {search&&<button onClick={()=>setSearch("")} className="btn-secondary text-xs !py-1.5 !px-3">Clear search</button>}
          </div>
        ):(
          <table className="data-table">
            <thead><tr>{columns.map(c=><th key={c.key} className={c.width||""}>{c.label}</th>)}</tr></thead>
            <tbody>{slice.map((r,i)=>(
              <tr key={i}>{columns.map(c=>(
                <td key={c.key} className={c.cls||""}>{c.render?c.render(r[c.key],r):(r[c.key]||"—")}</td>
              ))}</tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {total>1&&(
        <div className="px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-slate-400 order-2 sm:order-1">Showing {(page-1)*PAGE+1}–{Math.min(page*PAGE,filtered.length)} of {filtered.length}</span>
          <div className="flex gap-1 order-1 sm:order-2">
            <Pb onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} label="← Prev"/>
            {pageNums(page,total).map((p,i)=>p==="…"
              ?<span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs">…</span>
              :<button key={p} onClick={()=>setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${p===page?"bg-brand-600 text-white":"text-slate-500 hover:bg-slate-100"}`}>{p}</button>
            )}
            <Pb onClick={()=>setPage(p=>Math.min(total,p+1))} disabled={page===total} label="Next →"/>
          </div>
        </div>
      )}
    </div>
  );
}
function Pb({onClick,disabled,label}){return <button onClick={onClick} disabled={disabled} className="px-3 h-8 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">{label}</button>;}

// ── Chart shared helpers ──────────────────────────────────────────
export const TOOLTIP_STYLE = {
  background:"#fff",border:"1px solid #e2e8f0",borderRadius:"12px",
  fontSize:"12px",fontFamily:"DM Sans,sans-serif",
  boxShadow:"0 4px 16px rgba(0,0,0,0.10)",padding:"8px 12px"
};
export const CHART_COLORS = {
  pos:"#2563eb",neg:"#f87171",
  seq:["#2563eb","#0ea5e9","#06b6d4","#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981"],
  perf: p => p>=75?"#059669":p>=50?"#d97706":"#dc2626"
};

export function ChartCard({ title, subtitle, icon, children }) {
  return (
    <div className="chart-card">
      <div className="mb-5">
        <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">{icon&&<span>{icon}</span>}{title}</h3>
        {subtitle&&<p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyChart({ message="No data available" }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">📊</div>
      <p className="text-slate-400 text-sm font-medium">{message}</p>
      <p className="text-slate-300 text-xs">Data will appear once records are submitted.</p>
    </div>
  );
}

// Pie label rendering percent inside slice
export function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, pct }) {
  if ((pct||0) < 5) return null;
  const R=Math.PI/180, r=innerRadius+(outerRadius-innerRadius)*0.5;
  return (
    <text x={cx+r*Math.cos(-midAngle*R)} y={cy+r*Math.sin(-midAngle*R)}
          fill="#fff" textAnchor="middle" dominantBaseline="central"
          style={{fontSize:13,fontFamily:"Lexend",fontWeight:700}}>{`${pct}%`}</text>
  );
}

// Horizontal ranked bar chart + mini table
export function RankCard({ title, subtitle, icon, data, nameCol="Name" }) {
  const top = data.slice(0,8);
  const { ResponsiveContainer,BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,Cell,LabelList } = require("recharts");
  return (
    <ChartCard title={title} subtitle={subtitle} icon={icon}>
      {!data.length ? <EmptyChart message={`No ${nameCol.toLowerCase()} data yet`}/> : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(140,Math.min(top.length*42,280))}>
            <BarChart layout="vertical" data={top} margin={{top:0,right:48,left:8,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
              <XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <YAxis dataKey="name" type="category" width={90} tick={{fontSize:11,fill:"#475569"}} axisLine={false} tickLine={false} tickFormatter={n=>n.length>12?n.slice(0,12)+"…":n}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,_,p)=>[`${v}% (${p.payload.count} records)`,"Rate"]}/>
              <Bar dataKey="rate" radius={[0,6,6,0]} maxBarSize={24}>
                {top.map((e,i)=><Cell key={i} fill={CHART_COLORS.perf(e.rate)}/>)}
                <LabelList dataKey="rate" position="right" formatter={v=>`${v}%`} style={{fontSize:11,fill:"#475569",fontWeight:700}}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <table className="w-full text-xs mt-4 min-w-[260px]">
            <thead><tr className="border-b border-slate-100">{["#",nameCol,"Records","Rate"].map(h=><th key={h} className={`py-2 px-2 font-display font-semibold uppercase tracking-wide text-slate-400 ${h==="#"||h===nameCol?"text-left":"text-right"}`}>{h}</th>)}</tr></thead>
            <tbody>{data.slice(0,6).map((r,i)=>(
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-1.5 px-2 text-slate-300 font-mono">{i+1}</td>
                <td className="py-1.5 px-2 font-semibold text-slate-700 truncate max-w-[100px]" title={r.name}>{r.name}</td>
                <td className="py-1.5 px-2 text-right text-slate-500">{r.count}</td>
                <td className="py-1.5 px-2 text-right font-bold" style={{color:CHART_COLORS.perf(r.rate)}}>{r.rate}%</td>
              </tr>
            ))}</tbody>
          </table>
          {data.length>6&&<p className="text-xs text-slate-400 text-center py-2">+{data.length-6} more</p>}
        </>
      )}
    </ChartCard>
  );
}
