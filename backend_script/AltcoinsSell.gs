// --- CONFIGURATION ---
// REPLACE THESE WITH YOUR ACTUAL DETAILS
const BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"; 
const CHAT_ID = "YOUR_TELEGRAM_CHAT_ID";     
const SHEET_NAME = "D-CRYPT Orders"; 

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); 

  try {
    // 1. Safety Check
    if (!e || !e.postData) {
      return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": "No data found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);

    // --- TRACKER LOGIC START ---
    // This allows the Tracker Page to check status from this script
    if (data.action === "TRACK") {
      return handleTrackOrder(data.orderId);
    }
    // --- TRACKER LOGIC END ---
    
    // 2. Generate Server Timestamp (IST)
    const timestamp = Utilities.formatDate(new Date(), "GMT+5:30", "dd/MM/yyyy HH:mm:ss");
    data.timestamp = timestamp;

    // 3. Save to Google Sheet
    saveToSheet(data);
    
    // 4. Send Telegram Notification
    sendTelegramMessage(data);

    // 5. Return Success
    return ContentService.createTextOutput(JSON.stringify({ "result": "success", "orderId": data.orderId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } finally {
    lock.releaseLock();
  }
}

function saveToSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Added "Status" and "Admin Message" columns for the Tracker
    sheet.appendRow([
      "Order ID", "Timestamp", "Token", "Amount", 
      "INR Value", "Tx Hash", "UPI", "Phone", "Email", "Telegram", "Status", "Admin Message"
    ]);
    sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#e0e0e0");
  }

  sheet.appendRow([
    data.orderId,
    data.timestamp,
    data.token,
    data.amount,
    data.inrValue,
    data.hash,
    data.upi,
    "'" + data.phone,
    data.email,
    data.telegram,
    "PENDING", // Default Status
    "Verifying payment..." // Default Message
  ]);
}

function sendTelegramMessage(data) {
  var message = "🚀 NEW D-CRYPT ORDER 🚀\n\n" +
                "🆔 ID: " + data.orderId + "\n" +
                "🕒 Time: " + data.timestamp + "\n\n" +
                "💎 SELL DETAILS\n" +
                "• Token: " + data.token + "\n" +
                "• Amount: " + data.amount + "\n" +
                "• Value: " + data.inrValue + "\n\n" +
                "👤 USER INFO\n" +
                "• UPI: " + data.upi + "\n" +
                "• Phone: " + data.phone + "\n" +
                "• Telegram: " + data.telegram + "\n\n" +
                "🔗 HASH:\n" + data.hash;

  try {
    var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage";
    var payload = {
      chat_id: CHAT_ID,
      text: message
    };

    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log("Telegram Error: " + e.toString());
  }
}

// --- NEW FUNCTION: HANDLES TRACKING REQUESTS ---
function handleTrackOrder(orderId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) return createJSONOutput({ success: false, message: "Sheet not found" });

  const data = sheet.getDataRange().getValues();
  // Columns: 0=ID, 1=Time ... 10=Status, 11=Message
  
  for (let i = 1; i < data.length; i++) {
    // Check if Order ID matches
    if (String(data[i][0]) === String(orderId)) {
      return createJSONOutput({
        success: true,
        orderId: data[i][0],
        timestamp: data[i][1],
        type: "SELL ORDER",
        status: data[i][10] || "PENDING",
        adminMessage: data[i][11] || "Order is under review.",
        txHash: data[i][5] // Returns the hash/UTR
      });
    }
  }
  
  return createJSONOutput({ success: false, message: "Order ID not found." });
}

function createJSONOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}