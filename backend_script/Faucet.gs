// ==========================================
// 🚰 FAUCET CONFIGURATION
// ==========================================

// REPLACE THESE WITH YOUR ACTUAL DATA
const SHEET_ID = "YOUR_GOOGLE_SHEET_ID"; 
const TELEGRAM_BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"; 
const TELEGRAM_CHAT_ID = "YOUR_TELEGRAM_CHAT_ID"; 

// ==========================================
// 🚀 SCRIPT LOGIC
// ==========================================

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    // --- UPDATE FOR GITHUB FETCH (JSON HANDLING) ---
    // This logic ensures the script can read data sent from your GitHub website
    var params;
    try {
      if (e.postData && e.postData.contents) {
        params = JSON.parse(e.postData.contents);
      } else {
        params = e.parameter;
      }
    } catch (err) {
      params = e.parameter;
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);
    // Make sure your Google Sheet has a tab named "Requests"
    const sheet = ss.getSheetByName("Requests");

    // Only process if it's a Faucet request
    if (params.type === "FAUCET") {
      
      // 1. Add to Google Sheet
      sheet.appendRow([
        params.date,
        params.orderId,
        params.token, // Network Name
        params.amount,
        params.wallet,
        params.email,
        params.telegram
      ]);

      // 2. Send Telegram Alert
      const msg = `🚰 *NEW FAUCET REQUEST*\n\n` +
                  `🆔 *ID:* \`${params.orderId}\`\n` +
                  `🌍 *Network:* ${params.token}\n` +
                  `💧 *Amount:* ${params.amount}\n` +
                  `👛 *Wallet:* \`${params.wallet}\`\n` +
                  `📧 *Email:* ${params.email}\n` +
                  `✈️ *Telegram:* ${params.telegram}`;
      
      sendTelegramMessage(msg);
    }

    return ContentService.createTextOutput(JSON.stringify({ result: "success", orderId: params.orderId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function sendTelegramMessage(text) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: "Markdown"
    };
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload)
    });
  } catch(e) {
    Logger.log("Telegram Error: " + e.toString());
  }
}