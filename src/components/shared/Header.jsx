// src/components/shared/Header.jsx
import React from "react";
import config from "../../config";

const MODULES = [
  { id:"visits",     label:"Visits",     icon:"🏪", pill:"bg-brand-50 text-brand-700 border-brand-200"      },
  { id:"calls",      label:"Calls",      icon:"📞", pill:"bg-green-50 text-green-700 border-green-200"       },
  { id:"complaints", label:"Complaints", icon:"📋", pill:"bg-orange-50 text-orange-700 border-orange-200"    },
];
const VIEWS = [
  { id:"form",      label:"New Entry",  icon:"✏️" },
  { id:"dashboard", label:"Dashboard",  icon:"📊" },
];

export default function Header({ mod, setMod, view, setView }) {
  return (
    <header className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Top bar */}
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            {config.LOGO_URL
              ? <img src={config.LOGO_URL} alt="logo" className="h-8 sm:h-9 w-auto object-contain flex-shrink-0"/>
              : <div className="h-9 w-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                  </svg>
                </div>}
            <div className="min-w-0 hidden sm:block">
              <div className="font-display font-bold text-white text-sm truncate">{config.COMPANY_NAME}</div>
              <div className="text-white/50 text-xs hidden md:block truncate">{config.SYSTEM_TITLE}</div>
            </div>
          </div>

          {/* View tabs */}
          <nav className="flex items-center gap-1">
            {VIEWS.map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-display font-semibold text-sm transition-all duration-150 select-none
                  ${view===v.id ? "bg-white text-brand-700 shadow-sm" : "text-white/75 hover:text-white hover:bg-white/10"}`}>
                <span className="text-base leading-none">{v.icon}</span>
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Module tabs */}
        <div className="flex items-center gap-1 pb-2.5">
          {MODULES.map(m => (
            <button key={m.id} onClick={() => { setMod(m.id); setView("form"); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-display font-semibold text-xs transition-all duration-150 select-none
                ${mod===m.id
                  ? "bg-white/20 text-white border border-white/30"
                  : "text-white/60 hover:text-white/90 hover:bg-white/10"}`}>
              <span>{m.icon}</span>
              <span>{m.label}</span>
              {mod===m.id && <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5 inline-block"/>}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
