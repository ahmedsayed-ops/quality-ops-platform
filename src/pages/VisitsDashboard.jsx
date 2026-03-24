// src/pages/VisitsDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, LineChart, Line } from "recharts";
import { fetchVisits } from "../services/api";
import { exportVisitsCSV, exportVisitsExcel } from "../utils/exports";
import { countPosNeg, questionBreakdown, rankByRate, dailyTrend, applyFilters } from "../utils/analytics";
import { isPositive } from "../utils/answers";
import config from "../config";
import { KpiCard, KpiSkeleton, Alert, PageLoader, ChartCard, EmptyChart, PieLabel, TOOLTIP_STYLE, CHART_COLORS, DashFilters, DataTable, RankCard } from "../components/shared/UI";

const Q_KEYS = config.VISIT_QUESTIONS.map(q=>q.key);
const DEF_F  = { dateFrom:"", dateTo:"", agentUser:"", branchUser:"" };

function AwBadge({ val }) {
  if (!val) return <span className="text-slate-300 text-xs">—</span>;
  return <span className={`badge ${isPositive(val)?"badge-green":"badge-red"}`}>{isPositive(val)?"✓":"✗"} {val}</span>;
}
const fmtD = raw => { const [y,m,d]=(raw||"").slice(0,10).split("-"); return y&&m&&d?`${d}/${m}/${y.slice(2)}`:raw||"—"; };

export default function VisitsDashboard() {
  const [all,setAll]=useState([]); const [loading,setLoading]=useState(true);
  const [err,setErr]=useState(""); const [ts,setTs]=useState(null);
  const [filters,setFilters]=useState(DEF_F);
  const [xC,setXC]=useState(false); const [xX,setXX]=useState(false);

  const load=useCallback(async(s=false)=>{ if(!s)setLoading(true); setErr(""); try{const d=await fetchVisits();setAll(d);setTs(new Date());}catch(e){setErr(e.message);}finally{setLoading(false);} },[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{ if(!config.DASHBOARD_REFRESH_MS)return; const t=setInterval(()=>load(true),config.DASHBOARD_REFRESH_MS); return()=>clearInterval(t); },[load]);

  const recs     = useMemo(()=>applyFilters(all,{dateFrom:filters.dateFrom,dateTo:filters.dateTo,agentUser:filters.agentUser,branchUser:filters.branchUser}),[all,filters]);
  const agents   = useMemo(()=>[...new Set(all.map(r=>r.agentUser).filter(Boolean))].sort(),[all]);
  const branches = useMemo(()=>[...new Set(all.map(r=>r.branchUser).filter(Boolean))].sort(),[all]);
  const pn       = useMemo(()=>countPosNeg(recs,Q_KEYS),[recs]);
  const aP       = pn.total>0?Math.round(pn.p/pn.total*100):0;
  const nP       = pn.total>0?Math.round(pn.n/pn.total*100):0;
  const pieData  = [{name:"Positive",value:pn.p,pct:aP},{name:"Negative",value:pn.n,pct:nP}];
  const qBreak   = useMemo(()=>questionBreakdown(recs,config.VISIT_QUESTIONS),[recs]);
  const agRank   = useMemo(()=>rankByRate(recs,"agentUser",Q_KEYS),[recs]);
  const brRank   = useMemo(()=>rankByRate(recs,"branchUser",Q_KEYS),[recs]);
  const trend    = useMemo(()=>dailyTrend(recs,"visitDate",Q_KEYS),[recs]);
  const hasF     = Object.values(filters).some(v=>v);
  const empty    = recs.length===0;

  const COLS = [
    {key:"visitDate",    label:"Date",      width:"w-24",render:v=><span className="font-mono text-xs text-slate-500">{fmtD(v)}</span>},
    {key:"branchUser",   label:"Branch",    width:"w-32",render:v=><span className="font-semibold">{v||"—"}</span>},
    {key:"agentUser",    label:"Agent",     width:"w-32"},
    {key:"employeeName", label:"Employee",  width:"w-32"},
    {key:"q1",label:"Project",   render:v=><AwBadge val={v}/>},
    {key:"q2",label:"Burn Methods",render:v=><AwBadge val={v}/>},
    {key:"q3",label:"Live Email", render:v=><AwBadge val={v}/>},
    {key:"q4",label:"Support No.",render:v=><AwBadge val={v}/>},
    {key:"comments",label:"Comments",cls:"text-slate-500 text-xs max-w-[160px] truncate"},
  ];

  if (loading&&!all.length) return <PageLoader message="Loading visits dashboard…"/>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="page-pill bg-brand-50 text-brand-700 border-brand-200">🏪 Visits Quality</div>
          <h1 className="page-title">Visits Overview {hasF&&<span className="badge badge-amber ml-2 text-xs align-middle">Filtered</span>}</h1>
          {ts&&<p className="page-subtitle">{all.length} total · {ts.toLocaleTimeString()}{loading&&<span className="ml-2 text-brand-400 text-xs">Refreshing…</span>}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>load(true)} disabled={loading} className="btn-secondary text-sm"><svg className={`w-4 h-4 ${loading?"animate-spin":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Refresh</button>
          <button onClick={()=>{setXC(true);exportVisitsCSV(recs);setTimeout(()=>setXC(false),800);}} disabled={xC||empty} className="btn-secondary text-sm">{xC?"…":"📄"} CSV</button>
          <button onClick={()=>{setXX(true);exportVisitsExcel(recs);setTimeout(()=>setXX(false),800);}} disabled={xX||empty} className="btn-secondary text-sm">{xX?"…":"📊"} Excel</button>
        </div>
      </div>

      {err&&<Alert type="warning" title="Could not reach Google Sheets" message={`${err} — showing demo data.`} onClose={()=>setErr("")} className="mb-5"/>}

      <DashFilters filters={filters} setFilters={setFilters} onReset={()=>setFilters(DEF_F)}
        dropdowns={[{key:"agentUser",label:"Agent",options:agents},{key:"branchUser",label:"Branch",options:branches}]}/>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {loading?Array.from({length:5}).map((_,i)=><KpiSkeleton key={i}/>):<>
          <KpiCard title="Total Visits"  value={recs.length}           icon="🏪" color="blue"  subtitle={hasF?"in filter":"all time"}/>
          <KpiCard title="Positive"      value={pn.p.toLocaleString()} icon="✅" color="green" subtitle="all answers" barPercent={aP}/>
          <KpiCard title="Negative"      value={pn.n.toLocaleString()} icon="❌" color="red"   subtitle="all answers" barPercent={nP}/>
          <KpiCard title="Positive %"    value={`${aP}%`}              icon="📈" color="sky"   subtitle="overall rate" barPercent={aP}/>
          <KpiCard title="Negative %"    value={`${nP}%`}              icon="📉" color="amber" subtitle="gap to close" barPercent={nP}/>
        </>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <ChartCard title="Overall Awareness Split" subtitle="Positive vs Negative across all questions" icon="🥧">
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

        <ChartCard title="Awareness % per Question" subtitle="Breakdown by question" icon="📋">
          {empty?<EmptyChart/>:(
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={qBreak} margin={{top:20,right:16,left:-8,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,_,p)=>[`${v}% (${p.payload.pos}✓ / ${p.payload.neg}✗)`,"Rate"]}/>
                <Bar dataKey="posPercent" radius={[8,8,0,0]} maxBarSize={60}>
                  {qBreak.map((_,i)=><Cell key={i} fill={CHART_COLORS.seq[i%CHART_COLORS.seq.length]}/>)}
                  <LabelList dataKey="posPercent" position="top" formatter={v=>`${v}%`} style={{fontSize:11,fill:"#475569",fontWeight:600}}/>
                </Bar>
              </BarChart>
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
        <RankCard title="Field Agent Ranking" subtitle="By positive rate" icon="🏆" data={agRank} nameCol="Agent"/>
        <RankCard title="Branch Ranking" subtitle="By positive rate" icon="🏪" data={brRank} nameCol="Branch"/>
      </div>

      <DataTable title="Visit Records" records={recs} columns={COLS} loading={loading&&all.length>0}
        searchFields={["branchUser","agentUser","employeeName","visitDate","comments"]}/>
    </div>
  );
}
