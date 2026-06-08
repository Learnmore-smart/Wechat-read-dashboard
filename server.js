const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static assets from public folder under both root and /wechat-read-stats subpath
// redirect: false prevents express.static from issuing 301s that loop behind Vercel rewrites
app.use('/wechat-read-stats', express.static(path.join(__dirname, 'public'), { redirect: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for bare /wechat-read-stats (no trailing slash) — no redirect needed
app.get('/wechat-read-stats', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Retrieve WeRead API key from environment
const WEREAD_API_KEY = process.env.WECHAT_READ_SECRET || process.env.WEREAD_API_KEY;

if (!WEREAD_API_KEY) {
  console.warn("WARNING: WECHAT_READ_SECRET or WEREAD_API_KEY is not defined in .env! API requests will fail.");
}

// Proxy endpoint to handle CORS and auth
app.post(['/api/weread', '/wechat-read-stats/api/weread'], async (req, res) => {
  try {
    const { api_name, user_api_key, ...restParams } = req.body;
    
    if (!api_name) {
      return res.status(400).json({ errcode: -1, errmsg: "api_name is required in the request body" });
    }

    const activeApiKey = user_api_key || WEREAD_API_KEY;

    if (!activeApiKey) {
      return res.status(500).json({ errcode: -1, errmsg: "WeChat Reading API key is missing. Please configure it in Settings or check .env" });
    }

    // Build the request body with skill_version (mandatory for server side verification)
    const requestBody = {
      api_name,
      skill_version: "1.0.3",
      ...restParams
    };

    console.log(`[Proxy] Forwarding request for API: ${api_name}`);

    // Call the WeChat Reading Gateway
    const response = await fetch("https://i.weread.qq.com/api/agent/gateway", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${activeApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Proxy] Gateway error response: ${response.status}`, errText);
      return res.status(response.status).json({
        errcode: response.status,
        errmsg: `Gateway returned status ${response.status}`,
        details: errText
      });
    }

    const data = await response.json();
    
    // Check for upgrading version message as specified in SKILL.md
    if (data.upgrade_info) {
      console.warn(`[Proxy] UPGRADE WARNING: ${data.upgrade_info.message}`);
    }

    res.json(data);
  } catch (error) {
    console.error("[Proxy] Error routing request:", error);
    res.status(500).json({
      errcode: -500,
      errmsg: "Internal Server Error during API proxying",
      details: error.message
    });
  }
});

// Fallback to serve index.html for spa routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` WeChat Reading Dashboard Server is running!`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==================================================`);
});

// Export for Vercel serverless deployment (@vercel/node)
module.exports = app;
