// --- CONFIGURATION ---
// REPLACE THESE WITH YOUR ACTUAL DETAILS INSIDE GOOGLE APPS SCRIPT
var BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN'; 
var CHAT_ID = 'YOUR_TELEGRAM_CHAT_ID';     

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BuyOrders');
  
  // --- FIX FOR GITHUB FETCH (JSON HANDLING) ---
  var p;
  try {
    // Attempt to parse JSON body (sent from the new HTML website)
    if (e.postData && e.postData.contents) {
      p = JSON.parse(e.postData.contents);
    } else {
      // Fallback to standard form parameters
      p = e.parameter;
    }
  } catch (err) {
    p = e.parameter;
  }

  var date = new Date();
  
  // --- FORCE INDIAN TIME (IST) ---
  var indianTime = Utilities.formatDate(date, "GMT+5:30", "dd/MM/yyyy hh:mm:ss a");

  // 1. Generate Order ID
  // If the HTML provided an orderId, use it. Otherwise, generate one.
  var orderId;
  if (p.orderId) {
      orderId = p.orderId;
  } else {
      var day = ("0" + date.getDate()).slice(-2);
      var month = ("0" + (date.getMonth() + 1)).slice(-2);
      var year = date.getFullYear();
      var userCount = sheet.getLastRow(); 
      // Handle case where inrAmount might be undefined in some tests
      var amountStr = p.inrAmount ? String(p.inrAmount).split(".")[0] : "0"; 
      orderId = day + month + year + amountStr + userCount;
  }

  // 2. Save to Google Sheet
  sheet.appendRow([
    orderId,
    indianTime,
    p.usdtAmount,
    p.inrAmount,
    p.wallet || p.userWallet, // Handle both variable names just in case
    p.name,
    p.phone,
    p.email,
    p.telegram,
    p.txnId || p.hash // Handle both txnId and hash variable names
  ]);

  // 3. Send Telegram Notification
  try {
    sendTelegramNotification(orderId, p, indianTime);
  } catch (error) {
    Logger.log("Telegram Error: " + error);
  }

  // 4. Return Success
  return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'orderId': orderId }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Notification Function
function sendTelegramNotification(orderId, data, time) {
  var wallet = data.wallet || data.userWallet || "N/A";
  var txn = data.txnId || data.hash || "N/A";

  var message = "🔔 *NEW BUY ORDER RECEIVED!* 🔔\n\n" +
                "⏰ *Time:* " + time + "\n" +
                "🆔 *Order ID:* " + orderId + "\n" +
                "💰 *Amount:* " + data.usdtAmount + " USDT\n" +
                "💵 *Payable:* ₹" + data.inrAmount + "\n" +
                "👤 *User:* " + (data.name || "N/A") + "\n" +
                "📱 *Phone:* " + data.phone + "\n" +
                "🏦 *Txn ID:* " + txn + "\n\n" +
                "📂 *Wallet:* `" + wallet + "`";

  var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage";
  
  var payload = {
    'chat_id': CHAT_ID,
    'text': message,
    'parse_mode': 'Markdown'
  };

  var options = {
    'method': 'post',
    'payload': payload
  };

  UrlFetchApp.fetch(url, options);
}