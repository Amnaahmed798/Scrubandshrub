# ScrubShrub - Car Wash Booking Platform

A modern, full-featured car wash booking platform built with Next.js 14.

## 🚀 Features

- Online car wash booking system
- Multiple service types (Premium, VIP, Waterless)
- Membership plans
- Real-time booking tracking
- Admin dashboard
- Washer/driver dashboard
- STC Pay integration
- Google Maps integration
- Multi-language support (i18n)

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Python FastAPI (separate repository)
- **Database:** PostgreSQL
- **Maps:** Google Maps API
- **Payments:** STC Pay

## 📦 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_BACKEND_URL`
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_API_BASE_URL`
4. Deploy

### Backend (VPS/cPanel)

Backend runs on `http://scrubshrub.com:8000`

## 🔧 Environment Variables

See `.env.production` for required variables:

```env
NEXT_PUBLIC_BACKEND_URL="http://scrubshrub.com:8000/api/v1"
NEXT_PUBLIC_API_URL="http://scrubshrub.com:8000/api/v1"
NEXT_PUBLIC_API_BASE_URL="http://scrubshrub.com:8000"
NEXT_PUBLIC_APP_ENV=production
```

## 🚦 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
frontend/
├── app/                 # Next.js 14 app directory
├── components/          # React components
├── config/             # Configuration files
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── public/             # Static assets
├── services/           # API services
├── styles/             # Global styles
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## 🌐 Live Links

- **Frontend:** https://scrubshrub-frontend.vercel.app
- **Backend:** http://scrubshrub.com:8000
- **Main Site:** https://scrubshrub.com

## 📞 Support

For issues or questions, contact support.

## 📄 License

Private - All rights reserved
