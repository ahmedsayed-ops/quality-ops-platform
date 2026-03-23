// src/pages/ComplaintsDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
  LineChart, Line
} from "recharts";
import { fetchComplaints } from "../services/api";
import { exportComplaintsCSV, exportComplaintsExcel } from "../utils/exports";
import { applyFilters, groupByField, agingBucket } from "../utils/analytics";
import config from "../config";
import {
  KpiCard, KpiSkeleton, Alert, PageLoader,
  ChartCard, EmptyChart, TOOLTIP_STYLE, CHART_COLORS,
  DashFilters, DataTable
} from "../components/shared/UI";

const DEF_F = { dateFrom:"", dateTo:"", status:"", priority:"", channel:"" };
const AGING_ORDER = ["0–1 days","2–7 days","8–30 days","31–90 days","90+ days"];

const STATUS_CLR = { "Open":"#ef4444","In Progress":"#f59e0b","Pending Customer":"#8b5cf6","Escalated":"#dc2626","Closed":"#059669" };
const PRIO_CLR   = { "Low":"#94a3b8","Medium":"#f59e0b","High":"#ef4444","Critical":"#7f1d1d" };

export default function ComplaintsDashboard() {
  const [all,   setAll]   = useState([]);
  const [loading,setLoading]=useState(true);
  const [err,   setErr]   = useState("");
  const [ts,    setTs]    = useState(null);
  const [filters,setFilters]=useState(DEF_F);
  const [xC,   setXC]    = useState(false);
  const [xX,   setXX]    = useState(false);

  const load = useCallback(async (s=false) => {
    if (!s) setLoading(true); setErr("");
    try { const d = await fetchComplaints(); setAll(d); setTs(new Date()); }
    catch (e) { setErr(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!config.DASHBOARD_REFRESH_MS) return;
    const t = setInterval(() => load(true), config.DASHBOARD_REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const recs = useMemo(() =>
    applyFilters(all, { dateFrom:filters.dateFrom, dateTo:filters.dateTo, status:filters.status, priority:filters.priority, channel:filters.channel }),
    [all, filters]);

  // KPI counts
  const open    = useMemo(() => recs.filter(r => r.status === "Open").length, [recs]);
  const inProg  = useMemo(() => recs.filter(r => r.status === "In Progress").length, [recs]);
  const closed  = useMemo(() => recs.filter(r => r.status === "Closed").length, [recs]);
  const escCount= useMemo(() => recs.filter(r => r.escalated === "Yes").length, [recs]);
  const slaMet  = useMemo(() => {
    const resolved = recs.filter(r => r.slaMet === "Yes" || r.slaMet === "No");
    const met = resolved.filter(r => r.slaMet === "Yes").length;
    return resolved.length > 0 ? Math.round(met / resolved.length * 100) : 0;
  }, [recs]);
  const escPct = recs.length > 0 ? Math.round(escCount / recs.length * 100) : 0;

  // Chart data
  const statusDist  = useMemo(() => groupByField(recs, "status"), [recs]);
  const typeDist    = useMemo(() => groupByField(recs, "complaintType"), [recs]);
  const channelDist = useMemo(() => groupByField(recs, "channel"), [recs]);
  const branchDist  = useMemo(() => groupByField(recs, "branch", 8), [recs]);
  const agentDist   = useMemo(() => groupByField(recs, "agentOwner", 8), [recs]);
  const prioDist    = useMemo(() =>
    config.COMPLAINT_PRIORITIES.map(p => ({ name:p, count:recs.filter(r=>r.priority===p).length })),
    [recs]);

  const agingData = useMemo(() => {
    const map = Object.fromEntries(AGING_ORDER.map(b => [b, 0]));
    for (const r of recs) {
      const b = agingBucket(parseFloat(r.agingDays));
      if (map[b] !== undefined) map[b]++;
    }
    return AGING_ORDER.map(b => ({ name:b, count:map[b] }));
  }, [recs]);

  const trend = useMemo(() => {
    const map = {};
    for (const r of recs) {
      const date = (r.complaintDate || r.timestamp || "").slice(0,10);
      if (!date || date.length < 10) continue;
      if (!map[date]) map[date] = { date, total:0, closed:0, open:0 };
      map[date].total++;
      if (r.status === "Closed") map[date].closed++;
      else map[date].open++;
    }
    return Object.values(map).sort((a,b) => a.date.localeCompare(b.date));
  }, [recs]);

  const hasF  = Object.values(filters).some(v => v);
  const empty = recs.length === 0;

  // Table columns
  const COLS = [
    { key:"complaintId",   label:"ID",       width:"w-36",  render:v=><span className="font-mono text-xs font-bold text-slate-700">{v||"—"}</span> },
    { key:"complaintDate", label:"Date",      width:"w-24",  render:v=><span className="font-mono text-xs text-slate-500">{(v||"").slice(0,10)||"—"}</span> },
    { key:"customerName",  label:"Customer",  width:"w-32"  },
    { key:"complaintType", label:"Type",      width:"w-32",  render:v=>v?<span className="badge badge-blue text-xs">{v}</span>:"—" },
    { key:"priority",      label:"Priority",  width:"w-24",  render:v=>v?<span className={`badge ${v==="High"||v==="Critical"?"badge-red":v==="Medium"?"badge-amber":"badge-slate"}`}>{v}</span>:"—" },
    { key:"status",        label:"Status",    width:"w-32",  render:v=>v?<span className={`badge ${v==="Closed"?"badge-green":v==="Open"?"badge-red":v==="Escalated"?"badge-red":"badge-amber"}`}>{v}</span>:"—" },
    { key:"slaMet",        label:"SLA",       width:"w-20",  render:v=>v?<span className={`badge ${v==="Yes"?"badge-green":v==="No"?"badge-red":"badge-slate"}`}>{v}</span>:"—" },
    { key:"agentOwner",    label:"Owner",     width:"w-28"  },
    { key:"agingDays",     label:"Aging",     width:"w-20",  render:v=>{ const n=parseFloat(v); return isNaN(n)?"—":<span className={`text-xs font-semibold ${n>30?"text-red-600":"text-slate-500"}`}>{n}d</span>; } },
  ];

  if (loading && !all.length) return <PageLoader message="Loading complaints dashboard…"/>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="page-pill bg-orange-50 text-orange-700 border-orange-200">📋 Complaints</div>
          <h1 className="page-title">
            Complaints Overview
            {hasF && <span className="badge badge-amber ml-2 text-xs align-middle">Filtered</span>}
          </h1>
          {ts && (
            <p className="page-subtitle">
              {all.length} complaints · {ts.toLocaleTimeString()}
              {loading && <span className="ml-2 text-orange-600 text-xs">Refreshing…</span>}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => load(true)} disabled={loading} className="btn-secondary text-sm">
            <svg className={`w-4 h-4 ${loading?"animate-spin":""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>Refresh
          </button>
          <button onClick={() => { setXC(true); exportComplaintsCSV(recs); setTimeout(()=>setXC(false),800); }} disabled={xC||empty} className="btn-secondary text-sm">{xC?"…":"📄"} CSV</button>
          <button onClick={() => { setXX(true); exportComplaintsExcel(recs); setTimeout(()=>setXX(false),800); }} disabled={xX||empty} className="btn-secondary text-sm">{xX?"…":"📊"} Excel</button>
        </div>
      </div>

      {err && <Alert type="warning" title="Could not reach Google Sheets" message={`${err} — showing demo data.`} onClose={() => setErr("")} className="mb-5"/>}

      <DashFilters filters={filters} setFilters={setFilters} onReset={() => setFilters(DEF_F)}
        dropdowns={[
          { key:"status",   label:"Status",   options:config.COMPLAINT_STATUSES },
          { key:"priority", label:"Priority", options:config.COMPLAINT_PRIORITIES },
          { key:"channel",  label:"Channel",  options:config.COMPLAINT_CHANNELS },
        ]}/>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {loading ? Array.from({length:6}).map((_,i)=><KpiSkeleton key={i}/>) : <>
          <KpiCard title="Total"        value={recs.length}                 icon="📋" color="orange" subtitle="all complaints"/>
          <KpiCard title="Open"         value={open}                        icon="🔴" color="red"    subtitle="need action"   barPercent={recs.length?Math.round(open/recs.length*100):0}/>
          <KpiCard title="In Progress"  value={inProg}                      icon="🟡" color="amber"  subtitle="being handled" barPercent={recs.length?Math.round(inProg/recs.length*100):0}/>
          <KpiCard title="Closed"       value={closed}                      icon="🟢" color="green"  subtitle="resolved"      barPercent={recs.length?Math.round(closed/recs.length*100):0}/>
          <KpiCard title="SLA Met %"    value={`${slaMet}%`}                icon="⏱️" color="sky"   subtitle="within target" barPercent={slaMet}/>
          <KpiCard title="Escalated"    value={`${escPct}%`}                icon="🚨" color="red"   subtitle={`${escCount} complaints`} barPercent={escPct}/>
        </>}
      </div>

      {/* Row 1: Status pie + Type bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <ChartCard title="Status Distribution" subtitle="Open / In Progress / Closed breakdown" icon="📊">
          {empty ? <EmptyChart/> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusDist} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="count" nameKey="name" paddingAngle={3}>
                  {statusDist.map(e => <Cell key={e.name} fill={STATUS_CLR[e.name]||"#94a3b8"} stroke="none"/>)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,n)=>[`${v} complaints`,n]}/>
                <Legend iconType="circle" iconSize={10} formatter={v=><span style={{fontSize:12,color:"#64748b"}}>{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Complaint Type Breakdown" subtitle="Volume by category" icon="📋">
          {empty ? <EmptyChart/> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={typeDist} margin={{top:16,right:16,left:-8,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:9,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={n=>n.length>10?n.slice(0,10)+"…":n}/>
                <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,n)=>[`${v} complaints`,n]}/>
                <Bar dataKey="count" radius={[8,8,0,0]} maxBarSize={48}>
                  {typeDist.map((_,i)=><Cell key={i} fill={CHART_COLORS.seq[i%CHART_COLORS.seq.length]}/>)}
                  <LabelList dataKey="count" position="top" style={{fontSize:11,fill:"#475569",fontWeight:600}}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 2: Channel pie + Priority bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <ChartCard title="Channel Breakdown" subtitle="Where complaints are coming from" icon="📡">
          {empty ? <EmptyChart/> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={channelDist} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="count" nameKey="name">
                  {channelDist.map((_,i)=><Cell key={i} fill={CHART_COLORS.seq[i%CHART_COLORS.seq.length]} stroke="none"/>)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,n)=>[`${v} complaints`,n]}/>
                <Legend iconType="circle" iconSize={10} formatter={v=><span style={{fontSize:11,color:"#64748b"}}>{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Priority Distribution" subtitle="Volume by priority level" icon="🚨">
          {empty ? <EmptyChart/> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={prioDist} margin={{top:16,right:16,left:-8,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v,n)=>[`${v} complaints`,n]}/>
                <Bar dataKey="count" radius={[8,8,0,0]} maxBarSize={56}>
                  {prioDist.map(e=><Cell key={e.name} fill={PRIO_CLR[e.name]||"#94a3b8"}/>)}
                  <LabelList dataKey="count" position="top" style={{fontSize:11,fill:"#475569",fontWeight:600}}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 3: Aging + Daily trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <ChartCard title="Aging Buckets" subtitle="How long open complaints have been pending" icon="⏳">
          {empty ? <EmptyChart/> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={agingData} margin={{top:16,right:16,left:-8,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v=>[`${v} complaints`,"Count"]}/>
                <Bar dataKey="count" radius={[8,8,0,0]} maxBarSize={56}>
                  {agingData.map((e,i)=><Cell key={i} fill={i>=3?"#ef4444":i>=1?"#f59e0b":"#059669"}/>)}
                  <LabelList dataKey="count" position="top" style={{fontSize:11,fill:"#475569",fontWeight:600}}/>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Daily Trend" subtitle="New vs Closed complaints per day" icon="📅">
          {trend.length < 2 ? <EmptyChart message="Not enough data for a trend"/> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend} margin={{top:8,right:16,left:-8,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="date" tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={d=>`Date: ${d}`}/>
                <Legend iconType="circle" iconSize={8} formatter={v=><span style={{fontSize:12,color:"#64748b"}}>{v}</span>}/>
                <Line type="monotone" dataKey="total"  name="Total"  stroke="#ea580c" strokeWidth={2.5} dot={{r:4,strokeWidth:0}} activeDot={{r:6}}/>
                <Line type="monotone" dataKey="closed" name="Closed" stroke="#059669" strokeWidth={2.5} dot={{r:4,strokeWidth:0}} activeDot={{r:6}}/>
                <Line type="monotone" dataKey="open"   name="Open"   stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={{r:3,strokeWidth:0}}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 4: Branch + Agent workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-6">
        <SimpleBarCard title="Branch Workload" subtitle="Complaint volume per branch" icon="🏪" data={branchDist}/>
        <SimpleBarCard title="Agent Workload"  subtitle="Complaint volume per owner"  icon="👤" data={agentDist}/>
      </div>

      {/* Records table */}
      <DataTable
        title="Complaint Records"
        records={recs}
        columns={COLS}
        loading={loading && all.length > 0}
        searchFields={["complaintId","customerName","complaintType","agentOwner","branch","status","priority"]}
      />
    </div>
  );
}

function SimpleBarCard({ title, subtitle, icon, data }) {
  return (
    <ChartCard title={title} subtitle={subtitle} icon={icon}>
      {!data.length ? <EmptyChart message="No data yet"/> : (
        <ResponsiveContainer width="100%" height={Math.max(140, Math.min(data.length*38, 260))}>
          <BarChart layout="vertical" data={data} margin={{top:0,right:40,left:8,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
            <XAxis type="number" tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
            <YAxis dataKey="name" type="category" width={90} tick={{fontSize:11,fill:"#475569"}} axisLine={false} tickLine={false} tickFormatter={n=>n.length>12?n.slice(0,12)+"…":n}/>
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v=>[`${v} complaints`,"Count"]}/>
            <Bar dataKey="count" radius={[0,6,6,0]} maxBarSize={22}>
              {data.map((_,i)=><Cell key={i} fill={CHART_COLORS.seq[i%CHART_COLORS.seq.length]}/>)}
              <LabelList dataKey="count" position="right" style={{fontSize:11,fill:"#475569",fontWeight:700}}/>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
