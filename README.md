# D-CRYPT P2P - Secure Educational Crypto Exchange

Team Name: D-CRYPT
Developed by: DYT 
Live Demo: https://sites.google.com/view/d-cryptp2p/home?authuser=0

## 🚀 Project Overview
D-CRYPT is a beginner-friendly Peer-to-Peer (P2P) cryptocurrency exchange simulation designed for educational purposes. It allows users to simulate Buying, Selling, and Tracking crypto orders using INR without complex KYC procedures, making it ideal for students learning about blockchain transactions without financial risk.

## 🌟 Features
* Multi-Token Support: Buy/Sell USDT, ETH, SOL, BNB, and more.
* Smart Validation: Auto-validates wallet addresses (EVM, TRC20, SOL, TON) to prevent user errors.
* Live Pricing: Fetches real-time crypto prices via CoinGecko API.
* Order Tracking: Users can track the status of their orders using a unique Order ID.
* Testnet Faucet: Built-in faucet for students to get test tokens for development practice.
* Secure Backend: Powered by Google Apps Script & Google Sheets for real-time database management.

## 🛠️ Tech Stack
* Frontend: HTML5, CSS3, Tailwind CSS, JavaScript.
* Backend: Google Apps Script (GAS).
* Database: Google Sheets (acting as a relational database).
* Hosting: Google Sites (Frontend embedding).
* APIs: CoinGecko API (Prices), QR Server API (QR Generation).

## 📂 Repository Structure
* /frontend_pages - Contains the source code for the 6 interface modules (Home, Buy/Sell, Faucet, Tracker).
* /backend_script - Contains the Google Apps Script (.gs) logic that handles form submissions and database connectivity.

## ⚙️ How It Works
1.  Frontend: The user interacts with the UI (Buy/Sell forms). JavaScript handles live price calculation and wallet validation.
2.  Submission: When "Submit" is clicked, data is sent via fetch() POST request to the Google Apps Script Web App URL.
3.  Processing: The Script receives the data, verifies the logic, and appends the order to the Google Sheet database.
4.  Response: The script returns a unique Order ID to the user for tracking.

---

## ❤️ Acknowledgments & Honesty
Due to my limited coding experience as a first-year student, I utilized AI tools like ChatGPT and Gemini to assist with the website's design ("decoration") and code structure.

I provided the core logic, architectural flow, and vision, and these tools helped translate my ideas into functional code. Without this assistance, I would not have been able to fully express my idea to the users who really need it. My main intention was to solve a real problem for beginners, and these tools empowered me to bring that vision to life.

I assure you that I am committed to thoroughly learning all the technologies and concepts used in this project. My goal is to master these skills so I can independently enhance, scale, and make D-CRYPT P2P even better in the future.

---
