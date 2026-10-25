# Maffed Construction website (version 2)

Plain HTML, CSS and JavaScript. No libraries. A tiny built-in server (no install, no downloads) saves posts, approvals and uploaded photos, videos and PDFs.

## Start
1. Install Node.js (https://nodejs.org), then open a terminal in this folder.
2. Run:  `npm start`
3. Public website:  http://localhost:3000
4. Company panel:   http://localhost:3000/admin.html

**Change the admin password before real use.**
- Windows (Git Bash / Mac / Linux):  `ADMIN_KEY=MyStrongPassword npm start`
- Windows (PowerShell):  `$env:ADMIN_KEY="MyStrongPassword"; npm start`
The default password `change-me-123` is only for testing.

## How approval works
1. A customer clicks "Post Property / Project", "Post for Rent" or "Post to the Hub", fills the form, adds photos or a video, and sends it.
2. They get a tracking code. Their phone number is private: only the company sees it.
3. The post appears in the company panel under "Waiting for approval", with every detail and file.
4. The company clicks **Approve and publish** (it goes live on the website) or **Reject** (with a reason the customer can see under "My posts status").
5. Customers who want an item press "Inquire". The message comes to the company, which connects both sides.

## Company posts (portfolio, marketplace, rent, hub, bids, laws)
Admin panel > "Post new". Choose where to post, add text and photos, videos or PDF documents. It is published immediately.
- **Bids/tenders:** add the deadline, criteria and all documents (PDF). Customers see and download them in the Bids section.
- **Laws:** choose "Law / regulation PDF" and upload the PDF.

## Alarm for customers
The bell button ("Alarm") lets a visitor choose what they want (land, houses, rent, hub, bids, or anything new) and an optional keyword or place. While the page is open, when the company publishes a matching post the device rings, shows a banner, and sends a browser notification. (Notifications on a real website need https. On localhost it works.)

## Change words, logo, colors, languages, map, social links
Open `public/js/content.js`:
- `name`, `logo`, `theme` (colors), `phone`, `email`, `address`
- `t` has all words in English, Amharic, Afaan Oromoo and Arabic. Please ask native speakers to check the translations.
- `map`: the office and sites. Right-click a place in Google Maps, copy the two numbers, and paste them as lat and lon.
- `social`: put your links in `url`.
- `laws`: add the link of each ministry/office in `url` (and/or a PDF in `public/docs` in `pdf`). These are empty because I could not verify the official addresses.
- `seeds`: sample items. Delete them when you have real posts.

## Your own pictures
All pictures are JPG in `public/images`. Save your photo with the same name (for example `project-1.jpg`, `hero.jpg`, `logo.jpg`) or change the path in `content.js`.

## Going online (important)
- Host it on a computer or service that runs Node.js, and use https.
- Keep the `data` and `uploads` folders: they hold all posts and files. Back them up.
- Contact numbers are stored in `data/db.json`. Keep that folder private.

## Files
- `server.js`: the server and approval logic
- `public/index.html`, `public/js/app.js`, `public/css/style.css`: the website
- `public/admin.html`, `public/js/admin.js`: the company panel
- `public/js/content.js`: all your text and settings
