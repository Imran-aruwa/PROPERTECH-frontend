# PROPERTECH - Smarter Property Management, Anywhere

Modern property management SaaS platform built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Run development server:**
```bash
npm run dev
```

3. **Open in browser:**
```
http://localhost:3000
```

## 📁 Project Structure

```
PROPERTECH/
├── app/                    # Next.js 14 App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utility functions
├── public/               # Static assets
└── [config files]        # TypeScript, Tailwind, etc.
```

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Deployment:** Vercel (recommended)

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Customization

### Update Brand Colors
Edit `tailwind.config.ts`:
```typescript
colors: {
  primary: {
    500: '#0070F3', // Your brand color
  }
}
```

### Update Logo
Replace the logo component in `app/page.tsx` with your custom logo.

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy (automatic)

### Environment Variables
Create `.env.local` for local development:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## 📝 Roadmap

- [x] Landing page
- [ ] Authentication system
- [ ] Property management module
- [ ] Tenant management
- [ ] Financial tracking
- [ ] Maintenance requests
- [ ] Mobile app

## 🤝 Contributing

This is a private project. Contact the development team for contribution guidelines.

## 📄 License

Proprietary - All rights reserved

## 📞 Support

Email: support@propertech.com (update this)
Website: https://propertech.com (update this)

---

Built with ❤️ for landlords and property managers worldwide.