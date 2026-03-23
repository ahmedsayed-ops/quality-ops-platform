// src/App.jsx
import React, { useState } from "react";
import Header               from "./components/shared/Header";
import VisitsForm           from "./pages/VisitsForm";
import VisitsDashboard      from "./pages/VisitsDashboard";
import CallsForm            from "./pages/CallsForm";
import CallsDashboard       from "./pages/CallsDashboard";
import ComplaintsForm       from "./pages/ComplaintsForm";
import ComplaintsDashboard  from "./pages/ComplaintsDashboard";
import config               from "./config";

// Module × view → page component
const PAGES = {
  visits:     { form: VisitsForm,            dashboard: VisitsDashboard      },
  calls:      { form: CallsForm,             dashboard: CallsDashboard        },
  complaints: { form: ComplaintsForm,        dashboard: ComplaintsDashboard   },
};

export default function App() {
  const [mod,  setMod]  = useState("visits"); // visits | calls | complaints
  const [view, setView] = useState("form");   // form | dashboard

  const ActivePage = PAGES[mod]?.[view] || VisitsForm;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header
        mod={mod}   setMod={m  => { setMod(m);   setView("form"); }}
        view={view} setView={v => setView(v)}
      />

      {/* key forces full remount when switching module or view — clean state */}
      <main className="flex-1" key={`${mod}-${view}`}>
        <ActivePage />
      </main>

      <footer className="py-3 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-slate-400">
          <span>{config.COMPANY_NAME} · {config.SYSTEM_TITLE}</span>
          <span>Powered by Google Sheets &amp; Apps Script</span>
        </div>
      </footer>
    </div>
  );
}
