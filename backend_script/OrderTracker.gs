/**
 * P2P Order Tracking Backend
 * INSTRUCTIONS:
 * Replace the IDs below with the actual Sheet IDs from your Google Drive.
 */

// 1. THE NEW SHEET YOU CREATED FOR STATUS UPDATES (The Master Sheet)
const STATUS_SHEET_ID = 'YOUR_MASTER_STATUS_SHEET_ID';
const STATUS_TAB_NAME = 'Sheet1'; // Ensure this matches your tab name

// 2. YOUR 5 EXISTING SHEETS (Source of Truth)
const SHEET_ID_USDT_BUY = 'YOUR_USDT_BUY_SHEET_ID';
const SHEET_ID_USDT_SELL = 'YOUR_USDT_SELL_SHEET_ID';
const SHEET_ID_ALTCOIN_BUY = 'YOUR_ALT_BUY_SHEET_ID';
const SHEET_ID_ALTCOIN_SELL = 'YOUR_ALT_SELL_SHEET_ID';
const SHEET_ID_FAUCET = 'YOUR_FAUCET_SHEET_ID';

// --- NEW: Handle POST requests from GitHub Website ---
function doPost(e) {
  var result;
  
  try {
    // Check if data exists
    if (!e || !e.postData) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "No data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Parse JSON from fetch()
    var data = JSON.parse(e.postData.contents);
    
    // Check Action
    if (data.action === "TRACK") {
      result = trackOrder(data.orderId);
    } else {
      result = { success: false, message: "Invalid action" };
    }

  } catch (err) {
    result = { success: false, message: "Server Error: " + err.toString() };
  }

  // Return JSON response
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Main function called by doPost
 */
function trackOrder(orderId) {
  // Clean the input
  if (!orderId) return { success: false, message: "Order ID is empty" };
  
  orderId = orderId.toString().trim();
  const idUpper = orderId.toUpperCase();
  
  let orderType = "Unknown";
  let sourceSheetId = null;
  let txLabelType = "Hash"; // Default

  // --- STRICT PREFIX LOGIC ---

  // 1. ALT COIN BUY (Starts with CTB) -> Show Hash
  if (idUpper.startsWith('CTB')) {
    orderType = "Alt Coin Buy";
    sourceSheetId = SHEET_ID_ALTCOIN_BUY;
    txLabelType = "Transaction Hash";
  } 
  
  // 2. ALT COIN SELL (Starts with CTS) -> Show UTR
  else if (idUpper.startsWith('CTS')) {
    orderType = "Alt Coin Sell";
    sourceSheetId = SHEET_ID_ALTCOIN_SELL;
    txLabelType = "UTR / Transaction ID";
  } 
  
  // 3. TESTNET FAUCET (Starts with CTF) -> Show Hash
  else if (idUpper.startsWith('CTF')) {
    orderType = "Testnet Faucet";
    sourceSheetId = SHEET_ID_FAUCET;
    txLabelType = "Transaction Hash";
  } 
  
  // 4. USDT SELL (Starts with S) -> Show UTR
  else if (idUpper.startsWith('S')) {
    orderType = "USDT Sell";
    sourceSheetId = SHEET_ID_USDT_SELL;
    txLabelType = "UTR / Transaction ID";
  }
  
  // 5. USDT BUY (Starts with Date DD/MM/YYYY) -> Show Hash
  else if (/^\d/.test(orderId)) {
    orderType = "USDT Buy";
    sourceSheetId = SHEET_ID_USDT_BUY;
    txLabelType = "Transaction Hash";
  }
  
  // 6. FALLBACK
  else {
    return {
      success: false,
      message: "Invalid Order ID format. Please check your ID."
    };
  }

  // 2. Verify if Order ID actually exists in the correct Source Sheet
  const isValidOrder = checkIdInSheet(sourceSheetId, orderId);

  if (!isValidOrder) {
    return {
      success: false,
      message: "Order ID not found in " + orderType + " records. Please check the ID."
    };
  }

  // 3. Fetch Status from the New Status Sheet
  const statusData = getStatusFromMasterSheet(orderId);

  // LOGIC: If status is missing (or not in sheet), use Default Pending values
  const finalStatus = statusData.status ? statusData.status : "Pending";
  const finalMessage = statusData.message ? statusData.message : "Checking details...";
  const finalTime = statusData.timestamp ? formatTimestamp(statusData.timestamp) : "Waiting for update...";

  return {
    success: true,
    orderId: orderId,
    type: orderType,
    txLabel: txLabelType,
    status: finalStatus, 
    adminMessage: finalMessage,
    txHash: statusData.txHash || "",
    timestamp: finalTime
  };
}

function checkIdInSheet(sheetId, searchId) {
  if (!sheetId || sheetId.includes('REPLACE')) return false; 
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheets()[0]; 
    const data = sheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim().toUpperCase() === String(searchId).trim().toUpperCase()) {
        return true;
      }
    }
    return false;
  } catch (e) {
    Logger.log("Error checking sheet " + sheetId + ": " + e.toString());
    return false;
  }
}

function getStatusFromMasterSheet(searchId) {
  try {
    const ss = SpreadsheetApp.openById(STATUS_SHEET_ID);
    const sheet = ss.getSheetByName(STATUS_TAB_NAME);
    
    if (!sheet) return {}; // Handle missing tab gracefully

    const data = sheet.getDataRange().getValues();
    // Structure: A(ID), B(Status), C(Message), D(Hash), E(Timestamp)
    for (let i = 1; i < data.length; i++) { 
      if (String(data[i][0]).trim().toUpperCase() === String(searchId).trim().toUpperCase()) {
        return {
          status: data[i][1], 
          message: data[i][2], 
          txHash: data[i][3],
          timestamp: data[i][4] // Reading Column E
        };
      }
    }
  } catch (e) {
    Logger.log("Error reading status sheet: " + e.toString());
  }
  return {};
}

function formatTimestamp(val) {
  if (!val) return "";
  // If it's a JS Date object, format it nicely
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), "dd MMM yyyy, hh:mm a");
  }
  return val; // If it's just text, return as is
}