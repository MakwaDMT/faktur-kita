# Faktur Kita

A mobile-first invoice management web app for small businesses in Indonesia and Southeast Asia.

## Features
- Create professional invoices in minutes
- WhatsApp sending with pre-filled message
- Custom brand color and logo
- PDF export and print
- Items & services with type tags (service/product/reimbursable)
- Discount (IDR fixed or %), PPN tax, shipping
- Multiple payment tracking with balance calculation
- Monthly reports with CSV/Excel export
- Client directory
- 14-day free trial → subscription via Midtrans
- Offline-capable (localStorage)
- English & Bahasa Indonesia

## Tech Stack
- React 18 + Vite
- Tailwind CSS
- localStorage (no backend required for MVP)
- PDF: native browser print
- Export: SheetJS (xlsx)

## Setup

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploy to Vercel (recommended)

1. Push this folder to a private GitHub repo
2. Go to vercel.com → New Project → Import from GitHub
3. Framework: Vite (auto-detected)
4. Click Deploy — done

Your app will be live at `https://your-app.vercel.app`

## Environment Variables (for Midtrans integration)
Create a `.env` file:
```
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
VITE_MIDTRANS_SANDBOX=true
```

## Project Structure
```
src/
├── context/
│   └── AppContext.jsx     # Global state + navigation
├── components/
│   └── UI.jsx             # Shared components + icons
├── screens/
│   ├── Onboarding.jsx     # + Invoices, Reports, Clients, Settings, Paywall
│   ├── Dashboard.jsx
│   ├── InvoiceForm.jsx
│   ├── InvoicePreview.jsx
│   └── Profile.jsx
└── utils/
    ├── db.js              # Data layer (localStorage CRUD)
    └── pdf.js             # Invoice HTML + WhatsApp message builder
```

## Legal
© 2026 [Your Name]. All rights reserved.  
Developed by [Your Name] with AI assistance from Claude (Anthropic).  
Protected under UU No. 28 Tahun 2014 tentang Hak Cipta.

This software is a productivity tool. It does not constitute legal, tax, or financial advice.  
Payment processing powered by Midtrans, licensed by Bank Indonesia.
