// ================================================================
//  src/config.js — Single source of truth for all 3 modules
// ================================================================

const config = {

  // ── Backend endpoint ─────────────────────────────────────────
  // All 3 modules use the same Apps Script URL.
  // Override via REACT_APP_APPS_SCRIPT_URL env var on Vercel.
  APPS_SCRIPT_URL:
  "https://script.google.com/macros/s/AKfycbwz6z50-jBw5HIpGx8Ego1orRBehoRghpLZeU9Hx21OUJmJTFQEyb5IIXfuxb8TJYXX/exec",

  // ── Branding ─────────────────────────────────────────────────
  COMPANY_NAME: "Dsquares",
  SYSTEM_TITLE: "Quality Operations Platform",
  LOGO_URL: "/logo.png",

  // ── Module 1: Visits ─────────────────────────────────────────
  // POST keys: branchUser, agentUser, employeeName, mobile, visitDate, q1–q4, comments
  // IMPORTANT: q1, q2, q4 use "aware" type (Aware/Not Aware)
  //            q3 uses "yn" type (Yes/No) — Live Email question
  VISIT_QUESTIONS: [
    { key:"q1", label:"Is the branch aware of the project?",        answerType:"aware" },
    { key:"q2", label:"Is the branch aware of burn methods?",       answerType:"aware" },
    { key:"q3", label:"Has the branch received the Live Email?",    answerType:"yn"    },
    { key:"q4", label:"Is the branch aware of the support number?", answerType:"aware" }
  ],

  // ── Module 2: Calls Quality ───────────────────────────────────
  CALL_QUESTIONS: [
    { key:"cq1",  label:"Did the agent greet the customer correctly?",   answerType:"yn"    },
    { key:"cq2",  label:"Was customer identity verified?",               answerType:"yn"    },
    { key:"cq3",  label:"Was the agent's tone professional?",            answerType:"yn"    },
    { key:"cq4",  label:"Did the agent listen without interrupting?",    answerType:"yn"    },
    { key:"cq5",  label:"Was the customer's issue fully understood?",    answerType:"yn"    },
    { key:"cq6",  label:"Was the correct procedure followed?",           answerType:"pf"    },
    { key:"cq7",  label:"Was the resolution accurate and complete?",     answerType:"pf"    },
    { key:"cq8",  label:"Did the agent offer additional assistance?",    answerType:"yn"    },
    { key:"cq9",  label:"Was the call closed professionally?",           answerType:"yn"    },
    { key:"cq10", label:"Is the team aware of the current script?",      answerType:"aware" }
  ],

  CALL_TYPES:      ["Inbound","Outbound","Complaint","Inquiry","Follow-up","Escalation"],
  CALL_RESULTS:    ["Resolved","Not Resolved","Escalated","Callback Scheduled","Transfer"],
  CALL_DEPARTMENTS:["Customer Service","Operations","Technical Support","Compliance","Sales","Back Office"],

  // ── Module 3: Complaints ─────────────────────────────────────
  COMPLAINT_CHANNELS:  ["Call","Branch","WhatsApp","App","Email","Social Media","Walk-in"],
  COMPLAINT_TYPES:     ["Product Issue","Service Issue","Staff Complaint","Process Complaint","Technical Issue","Billing","Other"],
  COMPLAINT_PRIORITIES:["Low","Medium","High","Critical"],
  COMPLAINT_STATUSES:  ["Open","In Progress","Pending Customer","Escalated","Closed"],
  COMPLAINT_SUB_CATEGORIES: {
    "Product Issue":    ["Defective Product","Wrong Product","Missing Feature","Pricing"],
    "Service Issue":    ["Long Wait","Rude Staff","Incorrect Info","Delay"],
    "Staff Complaint":  ["Behaviour","Incompetence","Negligence"],
    "Process Complaint":["Long Process","Missing Steps","Documentation"],
    "Technical Issue":  ["System Error","App Crash","Website Issue","Integration"],
    "Billing":          ["Wrong Charge","Refund Delay","Double Charge","Missing Payment"],
    "Other":            ["General","Suggestion","Other"]
  },
  SLA_BY_PRIORITY: { "Low":120, "Medium":48, "High":24, "Critical":4 },

  // ── Answer normalisation ──────────────────────────────────────
  // Positive answers (across all modules and question types)
  POSITIVE_ANSWERS: new Set(["Yes","Aware","Pass"]),
  NEGATIVE_ANSWERS: new Set(["No","Not Aware","Fail"]),

  // ── Dashboard refresh ms (0 = off) ────────────────────────────
  DASHBOARD_REFRESH_MS: 60000,
};

export default config;
