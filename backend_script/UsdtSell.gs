// ==========================================
// ⚙️ CONFIGURATION
// ==========================================
var BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN'; 
var CHAT_ID = 'YOUR_TELEGRAM_CHAT_ID';     

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SellOrders');
  
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
  
  // 1. Get Indian Time
  var indianTime = Utilities.formatDate(date, "GMT+5:30", "dd/MM/yyyy hh:mm:ss a");

  // 2. Generate Order ID
  // If the website generates an ID, use it. Otherwise, generate one here.
  var orderId;
  if (p.orderId) {
    orderId = p.orderId;
  } else {
    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0" + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    var userCount = sheet.getLastRow(); 
    var amountStr = String(p.usdtAmount || p.amount).split(".")[0]; 
    orderId = "S" + day + month + year + amountStr + userCount;
  }

  // 3. Prepare Data Variables (Handles different naming conventions)
  var usdtAmt = p.usdtAmount || p.amount;
  var inrAmt = p.inrReceivable || p.inrValue;
  var upi = p.upiId || p.upi;
  var hash = p.txHash || p.hash;
  var name = p.name || "N/A"; // Name might not be in the new form, defaulting to N/A

  // 4. Save to SellOrders Sheet
  sheet.appendRow([
    orderId, 
    indianTime, 
    usdtAmt, 
    inrAmt, 
    upi, 
    name, 
    p.phone, 
    p.email, 
    p.telegram, 
    hash
  ]);

  // 5. Send Telegram Notification
  try {
    // Create a standardized data object for the notification function
    var notifData = {
      usdtAmount: usdtAmt,
      inrReceivable: inrAmt,
      upiId: upi,
      txHash: hash,
      name: name,
      phone: p.phone,
      email: p.email,
      telegram: p.telegram
    };
    sendSellNotification(orderId, notifData, indianTime);
  } catch (error) {
    Logger.log("Telegram Error: " + error);
  }

  return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'orderId': orderId }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendSellNotification(orderId, data, time) {
  var message = "🔻 *NEW SELL ORDER RECEIVED!* 🔻\n\n" +
                "🆔 *Order ID:* " + orderId + "\n" +
                "⏰ *Time:* " + time + "\n" +
                "💎 *User Sold:* " + data.usdtAmount + " USDT\n" +
                "💸 *You Pay User:* " + data.inrReceivable + "\n\n" +
                "🏦 *User's UPI:* `" + data.upiId + "`\n" +
                "🔗 *Txn Hash:* " + data.txHash + "\n\n" +
                "👤 *Name:* " + data.name + "\n" +
                "📱 *Phone:* " + data.phone + "\n" +
                "📧 *Email:* " + data.email + "\n" +
                "✈️ *Telegram:* " + data.telegram + "";

  var url = "https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage";
  
  var payload = {
    'chat_id': CHAT_ID,
    'text': message,
    'parse_mode': 'Markdown'
  };

  var options = { 'method': 'post', 'payload': payload };
  UrlFetchApp.fetch(url, options);
}