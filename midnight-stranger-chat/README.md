# Midnight Chat — 1v1 Stranger Chat starter

A dark, mobile-friendly one-to-one **text-only** random chat starter using Node.js, Express, and Socket.IO.

## Features
- Random one-to-one matching queue
- Real-time text messages
- Next/disconnect controls
- Report/leave control (demo logs report to server console)
- Basic message length and rate limits
- Responsive mobile design
- No database or persistent chat history

## Run locally
Requires Node.js 18 or newer.

```bash
npm install
npm start
```

Open `http://localhost:10000` in your browser. To test matching, open the site in two separate browser tabs/windows.

## Deploy to Render
1. Upload the whole project to a GitHub repository, keeping `server.js`, `package.json`, `README.md`, and the `public` folder at the repository root.
2. In Render, choose **New → Web Service** and connect the repository.
3. Set:
   - Runtime / Language: Node
   - Build command: `npm install`
   - Start command: `npm start`
   - Branch: `main` (or your repository's default branch)
4. Deploy and open the provided `onrender.com` URL.

Render supplies the `PORT` environment variable; this app uses it automatically.

## Important before public launch
This is a learning prototype, not a fully moderated public service. Do not advertise it as completely anonymous or fully safe. Reports are only printed to server logs and are not reviewed by a moderation team. Before public use, add persistent moderation/report review, stronger abuse and spam prevention, privacy/terms pages, data-retention rules, monitoring, and a plan for handling threats and abusive behavior. Do not collect unnecessary personal information. This starter intentionally supports text only and does not include photos, video, file uploads, or direct links.
