// ================================================================
//  Quality Operations Platform — Google Apps Script Backend
//  File: Code.gs
//
//  Single endpoint handles all 3 modules:
//    POST (body.module = "visits"|"calls"|"complaints")
//    GET  (?module=visits|calls|complaints)
//
//  Sheet names: Visits_Data, Calls_Data, Complaints_Data
//
//  HOW TO DEPLOY:
//    1. Open Google Sheets → Extensions → Apps Script
//    2. Delete existing code, paste this entire file
//    3. Run initAllSheets() once to create sheets + headers
//    4. Deploy → New deployment → Web App
//       Execute as: Me
//       Who has access: Anyone
//    5. Copy the Web App URL → paste in src/config.js or
//       set as REACT_APP_APPS_SCRIPT_URL in Vercel env vars
// ================================================================

var SHEETS = { visits:"Visits_Data", calls:"Calls_Data", complaints:"Complaints_Data" };

// ── Column headers ────────────────────────────────────────────────
var VISIT_COLS = [
  "Timestamp","Branch User","Field Agent User","Branch Employee Name",
  "Mobile Number","Visit Date",
  "Project Awareness","Burn Methods Awareness","Live Email Received","Support Number Awareness",
  "Comments"
];

var CALL_COLS = [
  "Timestamp","Agent Name","Evaluator Name","Call Date","Call Time",
  "Customer Name","Customer Mobile","Branch","Department",
  "Call Type","Call Result","Call Duration",
  "cq1","cq2","cq3","cq4","cq5","cq6","cq7","cq8","cq9","cq10",
  "Score","Comments","Follow Up"
];

var COMPLAINT_COLS = [
  "Timestamp","Complaint ID","Complaint Date","Customer Name","Customer Mobile",
  "Channel","Branch","Complaint Type","Sub Category","Agent Owner",
  "Priority","Status","Escalated","SLA Hours",
  "Resolution Date","Resolution Notes","Root Cause","QA Notes",
  "Resolution Time Hours","SLA Met","Aging Days"
];

// ── Key → column name maps (for building rows from POST data) ─────
var VISIT_MAP = {
  branchUser:"Branch User", agentUser:"Field Agent User",
  employeeName:"Branch Employee Name", mobile:"Mobile Number",
  visitDate:"Visit Date",
  q1:"Project Awareness", q2:"Burn Methods Awareness",
  q3:"Live Email Received", q4:"Support Number Awareness",
  comments:"Comments"
};

var CALL_MAP = {
  agentName:"Agent Name", evaluatorName:"Evaluator Name",
  callDate:"Call Date", callTime:"Call Time",
  customerName:"Customer Name", customerMobile:"Customer Mobile",
  branch:"Branch", department:"Department",
  callType:"Call Type", callResult:"Call Result", callDuration:"Call Duration",
  cq1:"cq1",cq2:"cq2",cq3:"cq3",cq4:"cq4",cq5:"cq5",
  cq6:"cq6",cq7:"cq7",cq8:"cq8",cq9:"cq9",cq10:"cq10",
  score:"Score", comments:"Comments", followUp:"Follow Up"
};

var COMPLAINT_MAP = {
  complaintId:"Complaint ID", complaintDate:"Complaint Date",
  customerName:"Customer Name", customerMobile:"Customer Mobile",
  channel:"Channel", branch:"Branch",
  complaintType:"Complaint Type", subCategory:"Sub Category",
  agentOwner:"Agent Owner", priority:"Priority", status:"Status",
  escalated:"Escalated", slaHours:"SLA Hours",
  resolutionDate:"Resolution Date", resolutionNotes:"Resolution Notes",
  rootCause:"Root Cause", qaNotes:"QA Notes",
  resolutionTimeHours:"Resolution Time Hours", slaMet:"SLA Met", agingDays:"Aging Days"
};

// ================================================================
//  doPost — routes form submissions to the correct sheet
// ================================================================
function doPost(e) {
  try {
    var body   = JSON.parse(e.postData.contents);
    var module = body.module;

    if (module === "visits")     return handlePost(body, SHEETS.visits,     VISIT_COLS,     VISIT_MAP);
    if (module === "calls")      return handlePost(body, SHEETS.calls,      CALL_COLS,      CALL_MAP);
    if (module === "complaints") return handlePost(body, SHEETS.complaints, COMPLAINT_COLS, COMPLAINT_MAP);

    return ok({ success:false, message:"Unknown module: " + module });
  } catch(err) {
    Logger.log("doPost error: " + err.message);
    return ok({ success:false, message:"Server error: " + err.message });
  }
}

function handlePost(body, sheetName, cols, keyMap) {
  var ts    = new Date().toISOString();
  var sheet = getOrCreate(sheetName, cols);

  // Build row: Timestamp first, then each column in order (skipping Timestamp col)
  var row = [ts];
  for (var i = 1; i < cols.length; i++) {
    var colName = cols[i];
    // Find the body key that maps to this column name
    var bodyKey = null;
    for (var k in keyMap) { if (keyMap[k] === colName) { bodyKey = k; break; } }
    row.push(bodyKey && body[bodyKey] !== undefined ? String(body[bodyKey]) : "");
  }

  sheet.appendRow(row);
  return ok({ success:true, message:"Record saved to " + sheetName });
}

// ================================================================
//  doGet — returns all rows from the requested module sheet
// ================================================================
function doGet(e) {
  try {
    var module = (e.parameter || {}).module || "visits";

    if (module === "visits")     return readSheet(SHEETS.visits);
    if (module === "calls")      return readSheet(SHEETS.calls);
    if (module === "complaints") return readSheet(SHEETS.complaints);

    return ok({ success:false, message:"Unknown module: " + module });
  } catch(err) {
    Logger.log("doGet error: " + err.message);
    return ok({ success:false, message:"Server error: " + err.message });
  }
}

function readSheet(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return ok({ success:true, data:[], count:0 });

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return ok({ success:true, data:[], count:0 });

  var headers = data[0];
  var records = [];

  for (var i = 1; i < data.length; i++) {
    var row    = data[i];
    var record = {};
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      // Format Date objects as ISO strings
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
      }
      record[String(headers[j])] = val !== undefined ? String(val) : "";
    }
    records.push(record);
  }

  // Sort newest first
  records.sort(function(a, b) {
    return (b["Timestamp"] || "").localeCompare(a["Timestamp"] || "");
  });

  return ok({ success:true, data:records, count:records.length });
}

// ================================================================
//  Shared helpers
// ================================================================

function getOrCreate(sheetName, headers) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);

    // Style header row
    var rng = sheet.getRange(1, 1, 1, headers.length);
    rng.setBackground("#1d4ed8");
    rng.setFontColor("#ffffff");
    rng.setFontWeight("bold");
    rng.setFontSize(10);
    sheet.setFrozenRows(1);

    for (var i = 0; i < headers.length; i++) {
      sheet.setColumnWidth(i + 1, 160);
    }
    Logger.log("Created sheet: " + sheetName);
  }
  return sheet;
}

function ok(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================================================================
//  UTILITY — Run once to initialise all 3 sheets
// ================================================================
function initAllSheets() {
  getOrCreate(SHEETS.visits,     VISIT_COLS);
  getOrCreate(SHEETS.calls,      CALL_COLS);
  getOrCreate(SHEETS.complaints, COMPLAINT_COLS);
  Logger.log("All sheets initialised successfully.");
}

// ================================================================
//  TEST FUNCTIONS — Run from Apps Script editor to verify setup
// ================================================================
function testVisitPost() {
  var r = doPost({ postData:{ contents: JSON.stringify({
    module:"visits", branchUser:"Branch Alpha", agentUser:"Ahmed Samy",
    employeeName:"Mohamed Ali", mobile:"01012345678", visitDate:"2024-06-01",
    q1:"Aware", q2:"Not Aware", q3:"Yes", q4:"Aware", comments:"Test visit"
  })}});
  Logger.log(r.getContent());
}

function testCallPost() {
  var r = doPost({ postData:{ contents: JSON.stringify({
    module:"calls", agentName:"Mona Hassan", evaluatorName:"QA Lead",
    callDate:"2024-06-01", callTime:"10:30", customerName:"Customer 1",
    customerMobile:"01112345678", branch:"CS Cairo", department:"Customer Service",
    callType:"Inbound", callResult:"Resolved", callDuration:"5:30",
    cq1:"Yes",cq2:"Yes",cq3:"Yes",cq4:"Yes",cq5:"Yes",
    cq6:"Pass",cq7:"Pass",cq8:"Yes",cq9:"Yes",cq10:"Aware",
    score:100, comments:"Excellent call", followUp:"No"
  })}});
  Logger.log(r.getContent());
}

function testComplaintPost() {
  var r = doPost({ postData:{ contents: JSON.stringify({
    module:"complaints", complaintId:"CMP-TEST-001",
    complaintDate:"2024-06-01", customerName:"Test Customer",
    customerMobile:"01223456789", channel:"Call", branch:"Branch Alpha",
    complaintType:"Service Issue", subCategory:"Long Wait",
    agentOwner:"Ahmed Samy", priority:"High", status:"Open",
    escalated:"No", slaHours:24, resolutionDate:"", resolutionNotes:"",
    rootCause:"", qaNotes:"Test", resolutionTimeHours:"", slaMet:"Pending", agingDays:0
  })}});
  Logger.log(r.getContent());
}

function testGetAll() {
  ["visits","calls","complaints"].forEach(function(m) {
    var r = doGet({ parameter:{ module:m } });
    var data = JSON.parse(r.getContent());
    Logger.log(m + ": " + data.count + " records");
  });
}
