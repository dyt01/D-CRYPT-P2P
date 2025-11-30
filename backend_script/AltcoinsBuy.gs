// --- BUY PAGE CONFIGURATION ---
// REPLACE THESE SECRETS
const BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"; 
const CHAT_ID = "YOUR_TELEGRAM_CHAT_ID";     
const SHEET_NAME = "D-CRYPT Buy Orders"; 

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    // Handling JSON data from the website
    if (!e || !e.postData) return ContentService.createTextOutput("No Data");

    const data = JSON.parse(e.postData.contents);
    
    // --- TRACKING LOGIC (OPTIONAL) ---
    // If you use this same script for the Tracker page, this block handles it.
    if (data.action === "TRACK") {
      return handleTrackOrder(data.orderId);
    }
    // ---------------------------------

    const timestamp = Utilities.formatDate(new Date(), "GMT+5:30", "dd/MM/yyyy HH:mm:ss");
    data.timestamp = timestamp;

    saveToSheet(data);
    sendTelegramMessage(data);

    return ContentService.createTextOutput(JSON.stringify({ "result": "success", "orderId": data.orderId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error" }))
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
    sheet.appendRow([
      "Order ID", "Timestamp", "Type", "Token", "Amount", 
      "Payable INR", "User Wallet", "Tx Hash", "User UPI", "Phone", "Email", "Telegram", "Status", "Admin Message"
    ]);
    sheet.getRange(1, 1, 1, 14).setFontWeight("bold").setBackground("#dcfce7"); 
  }

  sheet.appendRow([
    data.orderId,
    data.timestamp,
    data.type,
    data.token,
    data.amount,
    data.inrValue,
    data.userWallet, 
    data.hash,
    data.upi,
    "'" + data.phone,
    data.email,
    data.telegram,
    "PENDING", // Default status for Tracker
    "Waiting for verification..." // Default message
  ]);
}

function sendTelegramMessage(data) {
  var message = "🛒 *NEW BUY ORDER RECEIVED* 🛒\n\n" +
                "🆔 *Order ID:* " + data.orderId + "\n" +
                "🕒 *Time:* " + data.timestamp + "\n\n" +
                "💰 *BUY REQUEST*\n" +
                "• *Token:* " + data.token + "\n" +
                "• *Qty:* " + data.amount + "\n" +
                "• *Paid:* " + data.inrValue + "\n\n" +
                "🏦 *PAYMENT PROOF*\n" +
                "• *UTR/Hash:* " + data.hash + "\n\n" +
                "📤 *SEND TO WALLET (User's Address)*\n" +
                "`" + data.userWallet + "`\n\n" +
                "👤 *USER CONTACT*\n" +
                "• *Phone:* " + data.phone + "\n" +
                "• *Telegram:* " + data.telegram;

  try {
    var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage";
    var payload = { 
      chat_id: CHAT_ID, 
      text: message,
      parse_mode: "Markdown" // Better formatting
    };
    
    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log("Telegram Error");
  }
}

// --- HELPER FUNCTION FOR TRACKER ---
function handleTrackOrder(orderId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) return createJSONOutput({ success: false, message: "Sheet not found" });

  const data = sheet.getDataRange().getValues();
  // Assuming Order ID is in Column 1 (Index 0)
  // Columns: 0=ID, 1=Time, 2=Type ... 7=Hash ... 12=Status, 13=AdminMsg
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(orderId)) {
      return createJSONOutput({
        success: true,
        orderId: data[i][0],
        timestamp: data[i][1],
        type: data[i][2],
        status: data[i][12] || "PENDING",
        adminMessage: data[i][13] || "Order is under review.",
        txHash: data[i][7] // Returning the hash/UTR provided
      });
    }
  }
  
  return createJSONOutput({ success: false, message: "Order ID not found." });
}

function createJSONOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}