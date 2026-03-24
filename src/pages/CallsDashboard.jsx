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
  const evRank  = useMemo(()=>rankByRate(recs,"evaluatorName",CQ_KEYS),[recs]);
  const brRank  = useMemo(()=>rankByRate(recs,"branch",CQ_KEYS),[recs]);
  const trend   = useMemo(()=>dailyTrend(recs,"callDate",CQ_KEYS),[recs]);
  const typeDist= useMemo(()=>groupByField(recs,"callType"),[recs]);
  const followUp= useMemo(()=>recs.filter(r=>r.followUp==="Yes").length,[recs]);

  // Per-agent average score
  const agentScores = useMemo(()=>{
    const map={};
    for(const r of recs){
      const n=(r.agentName||"Unknown").trim();
      if(!map[n]) map[n]={name:n,scores:[],count:0};
      map[n].count++;
      if(!isNaN(parseFloat(r.score))) map[n].scores.push(parseFloat(r.score));
    }
    return Object.values(map).map(a=>({
      name:a.name,
      count:a.count,
      avgScore:a.scores.length?Math.round(a.scores.reduce((s,v)=>s+v,0)/a.scores.length):0
    })).sort((a,b)=>b.avgScore-a.avgScore);
  },[recs]);

  const hasF=Object.values(filters).some(v=>v), empty=recs.length===0;
  const pieData=[{name:"Positive",value:pn.p,pct:posR},{name:"Negative",value:pn.n,pct:negR}];
  const sl=scoreLabel(avgSc);

  const COLS=[
    {key:"callDate",label:"Date"},
    {key:"agentName",label:"Agent"},
    {key:"evaluatorName",label:"Evaluator"},
    {key:"callType",label:"Type"},
    {key:"callResult",label:"Result"},
    {key:"score",label:"Score"},
    {key:"followUp",label:"Follow-up"},
    {key:"comments",label:"Notes"},
  ];

  if(loading&&!all.length) return <PageLoader message="Loading calls dashboard…"/>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-xl font-bold mb-4">Calls Dashboard</h1>

      {err && <Alert type="error" message={err} />}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <KpiCard title="Total" value={recs.length}/>
        <KpiCard title="Positive %" value={posR+"%"}/>
        <KpiCard title="Negative %" value={negR+"%"}/>
        <KpiCard title="Avg Score" value={avgSc+"%"}/>
      </div>

      <DataTable records={recs} columns={COLS}/>
    </div>
  );
}
