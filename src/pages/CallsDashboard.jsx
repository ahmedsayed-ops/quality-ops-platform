// src/pages/CallsDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, LineChart, Line } from "recharts";
import { fetchCalls } from "../services/api";
import { exportCallsCSV, exportCallsExcel } from "../utils/exports";
import { countPosNeg, questionBreakdown, rankByRate, dailyTrend, applyFilters, avgField, groupByField } from "../utils/analytics";
import config from "../config";
import { KpiCard, KpiSkeleton, Alert, PageLoader, ChartCard, EmptyChart, PieLabel, TOOLTIP_STYLE, CHART_COLORS, DashFilters, DataTable, RankCard } from "../components/shared/UI";
import { scoreLabel } from "../utils/answers";

const CQ_KEYS = config.CALL_QUESTIONS.map(q=>q.key);
const DEF_F   = { dateFrom:"", dateTo:"", agentName:"", callType:"", callResult:"" };

export default function CallsDashboard() {
  const [all,setAll]=useState([]); const [loading,setLoading]=useState(true);
  const [err,setErr]=useState(""); const [ts,setTs]=useState(null);
  const [filters,setFilters]=useState(DEF_F);
  const [xC,setXC]=useState(false); const [xX,setXX]=useState(false);

  const load=useCallback(async(s=false)=>{ if(!s)setLoading(true); setErr(""); try{const d=await fetchCalls();setAll(d);setTs(new Date());}catch(e){setErr(e.message);}finally{setLoading(false);} },[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{ if(!config.DASHBOARD_REFRESH_MS)return; const t=setInterval(()=>load(true),config.DASHBOARD_REFRESH_MS); return()=>clearInterval(t); },[load]);

  const recs    = useMemo(()=>applyFilters(all,{dateFrom:filters.dateFrom,dateTo:filters.dateTo,agentName:filters.agentName,callType:filters.callType,callResult:filters.callResult}),[all,filters]);
  const agents  = useMemo(()=>[...new Set(all.map(r=>r.agentName).filter(Boolean))].sort(),[all]);
  const pn      = useMemo(()=>countPosNeg(recs,CQ_KEYS),[recs]);
  const posR    = pn.total>0?Math.round(pn.p/pn.total*100):0;
  const negR    = pn.total>0?Math.round(pn.n/pn.total*100):0;
  const avgSc   = useMemo(()=>avgField(recs,"score"),[recs]);
  const qBreak  = useMemo(()=>questionBreakdown(recs,config.CALL_QUESTIONS),[recs]);
  const agRank  = useMemo(()=>rankByRate(recs,"agentName",CQ_KEYS),[recs]);
  const evRank  = useMemo(()=>rankByRate(recs,"evaluatorName",CQ_KEYS),[recs]);
  const brRank  = useMemo(()=>rankByRate(recs,"branch",CQ_KEYS),[recs]);
  const trend   = useMemo(()=>dailyTrend(recs,"callDate",CQ_KEYS),[recs]);
  const typeDist= useMemo(()=>groupByField(recs,"callType"),[recs]);
  const resDist = useMemo(()=>groupByField(recs,"callResult"),[recs]);
  const followUp= useMemo(()=>recs.filter(r=>r.followUp==="Yes").length,[recs]);

  // Per-agent average score
  const agentScores = useMemo(()=>{
    const map={};
    for(const r of recs){ const n=(r.agentName||"Unknown").trim(); if(!map[n]) map[n]={name:n,scores:[],count:0}; map[n].count++; if(!isNaN(parseFloat(r.score))) map[n].scores.push(parseFloat(r.score)); }
    return Object.values(map).map(a=>({name:a.name,count:a.count,avgScore:a.scores.length?Math.round(a.scores.reduce((s,v)=>s+v,0)/a.scores.length):0})).sort((a,b)=>b.avgScore-a.avgScore);
  },[recs]);

  const hasF=Object.values(filters).some(v=>v), empty=recs.length===0;
  const pieData=[{name:"Positive",value:pn.p,pct:posR},{name:"Negative",value:pn.n,pct:negR}];
  const sl=scoreLabel(avgSc);

  const COLS=[
    {key:"callDate",      label:"Date",      width:"w-24",render:v=><span className="font-mono text-xs text-slate-500">{(v||"").slice(0,10)}</span>},
    {key:"agentName",     label:"Agent",     width:"w-32",render:v=><span className="font-semibold">{v||"—"}</span>},
    {key:"evaluatorName", label:"Evaluator", width:"w-28"},
    {key:"callType",      label:"Type",      width:"w-24",render:v=>v?<span className="badge badge-blue">{v}</span>:"—"},
    {key:"callResult",    label:"Result",    width:"w-28",render:v=>v?<span className={`badge ${v==="Resolved"?"badge-green":v==="Escalated"?"badge-red":"badge-amber"}`}>{v}</span>:"—"},
    {key:"score",         label:"Score",     width:"w-20",render:v=>{ const n=parseFloat(v); if(isNaN(n))return"—"; const c=n>=90?"badge-green":n>=75?"badge-blue":n>=60?"badge-amber":"badge-red"; return <span className={`badge ${c}`}>{n}%</span>; }},
    {key:"followUp",      label:"Follow-up", width:"w-24",render:v=>v?<span className={`badge ${v==="Yes"?"badge-red":"badge-green"}`}>{v}</span>:"—"},
    {key:"comments",      label:"Notes",     cls:"text-slate-500 text-xs max-w-[160px] truncate"},
  ];

  if(loading&&!all.length) return <PageLoader message="Loading calls dashboard…"/>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="page-pill bg-green-50 text-green-700 border-green-200">📞 Calls Quality</div>
          <h1 className="page-title">Calls Overview {hasF&&<span className="badge badge-amber ml-2 text-xs align-middle">Filtered</span>}</h1>
          {ts&&<p className="page-subtitle">{all.length} evaluations · {ts.toLocaleTimeString()}{loading&&<span className="ml-2 text-green-600 text-xs">Refreshing…</span>}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>load(true)} disabled={loading} className="btn-secondary text-sm"><svg className={`w-4 h-4 ${loading?"animate-spin":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Refresh</button>
          <button onClick={()=>{setXC(true);exportCallsCSV(recs);setTimeout(()=>setXC(false),800);}} disabled={xC||empty} className="btn-secondary text-sm">{xC?"…":"📄"} CSV</button>
          <button onClick={()=>{setXX(true);exportCallsExcel(recs);setTimeout(()=>setXX(false),800);}} disabled={xX||empty} className="btn-secondary text-sm">{xX?"…":"📊"} Excel</button>
        </div>
      </div>

      {err&&<Alert type="warning" title="Could not reach Google Sheets" message={`${err} — showing demo data.`} onClose={()=>setErr("")} className="mb-5"/>}

      <DashFilters filters={filters} setFilters={setFilters} onReset={()=>setFilters(DEF_F)}
        dropdowns={[{key:"agentName",label:"Agent",options:agents},{key:"callType",label:"Call Type",options:config.CALL_TYPES},{key:"callResult",label:"Result",options:config.CALL_RESULTS}]}/>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {loading?Array.from({length:5}).map((_,i)=><KpiSkeleton key={i}/>):<>
          <KpiCard title="Total Evaluated" value={recs.length}           icon="📞" color="green" subtitle="calls reviewed"/>
          <KpiCard title="Positive Rate"   value={`${posR}%`}            icon="✅" color="green" subtitle="yes/pass/aware" barPercent={posR}/>
          <KpiCard title="Negative Rate"   value={`${negR}%`}            icon="❌" color="red"   subtitle="no/fail/not aware" barPercent={negR}/>
          <KpiCard title="Avg Score"        value={`${avgSc}%`}           icon="📊" color="sky"   subtitle={sl.text} barPercent={avgSc}/>
          <KpiCard title="Follow-ups"       value={followUp}              icon="⚠️" color="amber" subtitle="requiring action"/>
        </>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <ChartCard title="Quality Split" subtitle="Positive vs Negative across all questions" icon="🥧">
          {empty?<EmptyChart/>:(
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" paddingAngle={3} label={PieLabel} labelLine={false}>
                  <Cell fill={CHART_COLORS.pos} stroke="none"/><Cell fill={CHART_COLORS.neg} stroke="none"/>
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,n,p)=>[`${v} answers (${p.payload.pct}%)`,n]}/>
                <Legend iconType="circle" iconSize={10} formatter={v=><span style={{fontSize:12,color:"#64748b"}}>{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Question Breakdown" subtitle="Pass rate per evaluation criterion" icon="📋">
          {empty?<EmptyChart/>:(
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={qBreak} layout="vertical" margin={{top:0,right:48,left:8,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
                <XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <YAxis dataKey="name" type="category" width={120} tick={{fontSize:10,fill:"#475569"}} axisLine={false} tickLine={false} tickFormatter={n=>n.length>18?n.slice(0,18)+"…":n}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,_,p)=>[`${v}% (${p.payload.pos}✓/${p.payload.neg}✗)`,"Rate"]}/>
                <Bar dataKey="posPercent" radius={[0,6,6,0]} maxBarSize={18}>
                  {qBreak.map((_,i)=><Cell key={i} fill={CHART_COLORS.seq[i%CHART_COLORS.seq.length]}/>)}
                  <LabelList dataKey="posPercent" position="right" formatter={v=>`${v}%`} style={{fontSize:11,fill:"#475569",fontWeight:700}}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Agent avg score chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <ChartCard title="Agent Avg Score" subtitle="Average quality score per agent" icon="🏆">
          {!agentScores.length?<EmptyChart/>:(
            <>
              <ResponsiveContainer width="100%" height={Math.max(140,Math.min(agentScores.slice(0,8).length*42,260))}>
                <BarChart layout="vertical" data={agentScores.slice(0,8)} margin={{top:0,right:48,left:8,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
                  <XAxis type="number" domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                  <YAxis dataKey="name" type="category" width={90} tick={{fontSize:11,fill:"#475569"}} axisLine={false} tickLine={false} tickFormatter={n=>n.length>12?n.slice(0,12)+"…":n}/>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,_,p)=>[`${v}% avg (${p.payload.count} calls)`,"Score"]}/>
                  <Bar dataKey="avgScore" radius={[0,6,6,0]} maxBarSize={24}>
                    {agentScores.slice(0,8).map((e,i)=><Cell key={i} fill={CHART_COLORS.perf(e.avgScore)}/>)}
                    <LabelList dataKey="avgScore" position="right" formatter={v=>`${v}%`} style={{fontSize:11,fill:"#475569",fontWeight:700}}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <table className="w-full text-xs mt-4"><thead><tr className="border-b border-slate-100">{["#","Agent","Calls","Avg Score"].map(h=><th key={h} className={`py-2 px-2 font-display font-semibold uppercase tracking-wide text-slate-400 ${h==="#"||h==="Agent"?"text-left":"text-right"}`}>{h}</th>)}</tr></thead>
              <tbody>{agentScores.slice(0,6).map((r,i)=><tr key={i} className="border-b border-slate-50 hover:bg-slate-50"><td className="py-1.5 px-2 text-slate-300 font-mono">{i+1}</td><td className="py-1.5 px-2 font-semibold text-slate-700 truncate max-w-[100px]" title={r.name}>{r.name}</td><td className="py-1.5 px-2 text-right text-slate-500">{r.count}</td><td className="py-1.5 px-2 text-right font-bold" style={{color:CHART_COLORS.perf(r.avgScore)}}>{r.avgScore}%</td></tr>)}</tbody></table>
            </>
          )}
        </ChartCard>

        <ChartCard title="Call Type Breakdown" subtitle="Distribution by call category" icon="📊">
          {empty?<EmptyChart/>:(
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={typeDist} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="count" nameKey="name">
                  {typeDist.map((_,i)=><Cell key={i} fill={CHART_COLORS.seq[i%CHART_COLORS.seq.length]} stroke="none"/>)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,n)=>[`${v} calls`,n]}/>
                <Legend iconType="circle" iconSize={10} formatter={v=><span style={{fontSize:11,color:"#64748b"}}>{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="chart-card mb-5">
        <div className="mb-5"><h3 className="font-display font-bold text-slate-800 text-sm">📅 Daily Trend</h3><p className="text-slate-400 text-xs mt-0.5">Positive vs Negative over time</p></div>
        {trend.length<2?<EmptyChart message="Not enough data for a trend"/>:(
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend} margin={{top:8,right:16,left:-8,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="date" tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={d=>d.slice(5)}/>
              <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={d=>`Date: ${d}`}/>
              <Legend iconType="circle" iconSize={8} formatter={v=><span style={{fontSize:12,color:"#64748b"}}>{v}</span>}/>
              <Line type="monotone" dataKey="positive" name="Positive" stroke={CHART_COLORS.pos} strokeWidth={2.5} dot={{r:4,fill:CHART_COLORS.pos,strokeWidth:0}} activeDot={{r:6}}/>
              <Line type="monotone" dataKey="negative" name="Negative" stroke={CHART_COLORS.neg} strokeWidth={2.5} dot={{r:4,fill:CHART_COLORS.neg,strokeWidth:0}} activeDot={{r:6}}/>
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-6">
        <RankCard title="Evaluator Ranking" subtitle="By positive rate collected" icon="👁️" data={evRank} nameCol="Evaluator"/>
        <RankCard title="Branch Ranking" subtitle="By positive rate" icon="🏪" data={brRank} nameCol="Branch"/>
      </div>

      <DataTable title="Call Evaluations" records={recs} columns={COLS} loading={loading&&all.length>0}
        searchFields={["agentName","evaluatorName","callDate","callType","callResult","customerName","comments"]}/>
    </div>
  );
}
