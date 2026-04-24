# 🌟 DreamFolio - Astro Edition
<img width="1885" height="973" alt="image" src="https://github.com/user-attachments/assets/986e83d8-0f43-41c3-ba7f-f4cdcdd9ead6" />

*Cybersecurity Engineer • FinTech Architect • Creative Technologist*

A high-performance portfolio built with Astro, React, and Tailwind CSS, optimized for speed and user experience.

## 🚀 Features

- **Lightning Fast**: Static site generation with selective hydration
- **Glassmorphism Design**: Ultra-modern UI with cyberpunk aesthetics
- **Interactive Components**: React islands for dynamic features
- **Type-Safe**: Full TypeScript support
- **SEO Optimized**: Comprehensive meta tags and structured data
- **Mobile First**: Responsive design across all devices

## 🛠️ Tech Stack

- **Framework**: Astro 5.13+ (Static-first, Islands Architecture)
- **UI**: React 19 + TypeScript
- **Styling**: Tailwind CSS 3.4 + Custom glassmorphism
- **Animations**: Framer Motion 12
- **Backend**: Supabase (PostgreSQL + Auth)
- **Deployment**: Vercel + Cloudflare
- **Package Manager**: pnpm

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/dreamcoder08/DreamFolio.git
cd DreamFolio

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For admin operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI API Keys (for future AI features)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase-schema.sql`
3. Copy your project URL and anon key to `.env`

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel --prod
   ```

2. **Environment Variables**: Add all variables from `.env` in Vercel dashboard

3. **Custom Domain**: Configure in Vercel settings

### Manual Build

```bash
# Build for production
pnpm build

# Preview build
pnpm preview

# Deploy dist/ folder to your hosting provider
```

## 📊 Performance

- **Bundle Size**: ~157KB gzipped (65% reduction from Next.js)
- **Build Time**: ~4 seconds
- **Lighthouse Score**: 95+ (estimated)
- **Core Web Vitals**: Optimized for all metrics

## 🏗️ Project Structure

```
dreamfolio-astro/
├── src/
│   ├── components/
│   │   └── sections/          # Page sections
│   ├── layouts/               # Base layout
│   ├── lib/
│   │   └── supabase/          # Database client
│   ├── pages/                 # Astro pages
│   └── styles/                # Global styles
├── public/                    # Static assets
├── astro.config.mjs           # Astro configuration
├── tailwind.config.mjs        # Tailwind configuration
├── vercel.json               # Vercel deployment config
└── supabase-schema.sql       # Database schema
```

## 🎨 Design System

### Colors
- **Primary**: Blue (#0066FF)
- **Secondary**: Purple (#9933FF)
- **Accent**: Green (#00FF80)
- **Glassmorphism**: Semi-transparent overlays

### Typography
- **Sans**: Inter (body text)
- **Display**: Poppins (headings)
- **Mono**: JetBrains Mono (code)
- **Special**: Space Grotesk (accent)

## 🔒 Security

- **Content Security Policy**: Configured in Vercel
- **XSS Protection**: Enabled
- **CSRF Protection**: Implemented in forms
- **Input Validation**: Zod schemas
- **Row Level Security**: Supabase RLS policies

## 📈 Monitoring

### Vercel Analytics
- Real user monitoring
- Performance metrics
- Error tracking

### Manual Monitoring
```bash
# Bundle analysis
pnpm build && npx @next/bundle-analyzer dist/

# Lighthouse audit
npx lighthouse http://localhost:4321 --output html
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Astro Team** for the amazing framework
- **Vercel** for hosting and deployment
- **Supabase** for the backend infrastructure
- **Tailwind CSS** for the styling system
- **Framer Motion** for animations

---

**Built with ❤️ using Astro & modern web technologies**

*DreamFolio - Where Innovation Meets Performance*
