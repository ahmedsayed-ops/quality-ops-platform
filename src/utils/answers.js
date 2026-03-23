// src/utils/answers.js
// ── Normalises mixed answer types: Yes/No, Aware/Not Aware, Pass/Fail ──

import config from "../config";

export const isPositive = v => config.POSITIVE_ANSWERS.has(v);
export const isNegative = v => config.NEGATIVE_ANSWERS.has(v);
export const isAnswered  = v => isPositive(v) || isNegative(v);

// Score an array of answer values as % positive
export function calcScore(answers) {
  const answered = answers.filter(isAnswered);
  if (!answered.length) return 0;
  return Math.round(answered.filter(isPositive).length / answered.length * 100);
}

// Human-readable performance label for a score %
export function scoreLabel(pct) {
  if (pct >= 90) return { text:"Excellent", cls:"badge-green"  };
  if (pct >= 75) return { text:"Good",      cls:"badge-blue"   };
  if (pct >= 60) return { text:"Average",   cls:"badge-amber"  };
  return                 { text:"Poor",      cls:"badge-red"    };
}

// CSS badge class for a single answer value
export function answerBadgeClass(v) {
  if (isPositive(v)) return "badge badge-green";
  if (isNegative(v)) return "badge badge-red";
  return "badge badge-slate";
}

// Answer options for each type
export const ANSWER_OPTIONS = {
  yn:    [{ v:"Yes",       icon:"✓", positive:true  }, { v:"No",        icon:"✗", positive:false }],
  aware: [{ v:"Aware",     icon:"✓", positive:true  }, { v:"Not Aware", icon:"✗", positive:false }],
  pf:    [{ v:"Pass",      icon:"✓", positive:true  }, { v:"Fail",      icon:"✗", positive:false }]
};
