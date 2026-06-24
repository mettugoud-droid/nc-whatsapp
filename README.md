# Nature's Crates - WhatsApp Community Member Manager

A lightweight, single-page web application for managing WhatsApp Community member invitations.

## Features

- **CSV Upload** — Upload member lists with validation, duplicate removal, and error reporting
- **Dashboard** — Real-time stats on total members, pending invitations, sent invitations, and joined members
- **Member Management** — Search, filter, and update member invitation status
- **WhatsApp Integration** — One-click personalized WhatsApp invitation messages via wa.me links
- **Bulk Invite** — Generate invitation links for all pending members
- **Export** — Download updated member list as CSV with status included
- **Persistent Storage** — All data saved in browser localStorage

## Deployment

### Option 1: Open Directly
Simply open `index.html` in any modern web browser. No server required.

### Option 2: Serve Locally
```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Deploy to Static Hosting
Upload the following files to any static hosting service (Netlify, Vercel, GitHub Pages, etc.):
- `index.html`
- `styles.css`
- `app.js`

## Usage

1. **Set up Settings** — Go to Settings and paste your WhatsApp Community Invite Link
2. **Upload Members** — Go to Upload CSV and import your customer list
3. **Send Invitations** — Go to Members tab, click "Invite" to open WhatsApp with a pre-filled message
4. **Track Progress** — Update status as members are invited/joined, monitor from Dashboard
5. **Export Data** — Download the updated member list with statuses as CSV

## CSV Format

The CSV file must include these columns (case-insensitive):
- `Name` (or `Full Name`, `Customer Name`)
- `Mobile Number` (or `Mobile`, `Phone`, `Phone Number`, `Contact`)

### Sample CSV
```csv
Name,Mobile Number
Rahul Sharma,+919876543210
Priya Patel,+919876543211
```

A sample file (`sample-members.csv`) is included for testing.

## Technical Details

- **No dependencies** — Pure HTML, CSS, and JavaScript
- **No backend required** — All data stored in browser localStorage
- **Responsive** — Works on desktop, tablet, and mobile
- **No authentication** — Designed as an internal admin tool
