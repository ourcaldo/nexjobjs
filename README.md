
# 🚀 Nexjob - Modern Job Portal Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2.30-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC)](https://tailwindcss.com/)

A modern, full-featured job portal platform built with Next.js, Supabase, and WordPress as a headless CMS. Features advanced job search, user management, and comprehensive admin controls.

## 🌟 Features

### Core Features
- 🔍 **Advanced Job Search** - Filter by location, category, salary, experience level
- 📝 **Job Management** - Complete CRUD operations with rich content editor
- 👤 **User Authentication** - Secure signup/login with email verification
- 📚 **Article System** - Career tips and guides with categories
- 🔖 **Bookmark System** - Save favorite jobs for later
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS

### Admin Features
- 🎛️ **Comprehensive Admin Panel** - Full control over site settings
- 🔧 **SEO Management** - Dynamic meta tags, sitemaps, and schema markup
- 📊 **Analytics Integration** - Google Analytics and Tag Manager support
- 💰 **Advertisement Management** - Popup and sidebar ad configurations
- 🔄 **WordPress Integration** - Headless CMS for content management
- 👥 **User Management** - Role-based access control

### Technical Features
- ⚡ **SSG/ISR** - Static generation with incremental regeneration
- 🔄 **Auto Sitemap Generation** - Dynamic XML sitemaps for SEO
- 🖼️ **Image Optimization** - Next.js Image component with Supabase storage
- 📈 **Performance Optimized** - Lazy loading, skeleton screens, infinite scroll
- 🚀 **Production Ready** - PM2 cluster mode, Nginx configuration included

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │◄──►│   Supabase DB   │◄──►│  WordPress CMS  │
│                 │    │                 │    │                 │
│ • SSG/ISR Pages │    │ • User Auth     │    │ • Job Content   │
│ • API Routes    │    │ • Job Storage   │    │ • Article Mgmt  │
│ • Admin Panel   │    │ • File Storage  │    │ • Meta Fields   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+
- Supabase account
- WordPress installation (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/nexjob-portal.git
cd nexjob-portal
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env.local
```

Update `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
WP_API_BASE_URL=your_wordpress_api_url
```

4. **Database Setup**
```bash
# Run Supabase migrations
# Upload the migration files to your Supabase project
```

5. **Start Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## 📁 Project Structure

```
nexjob-portal/
├── pages/                    # Next.js pages and API routes
│   ├── api/                 # API endpoints
│   ├── admin/               # Admin panel pages
│   ├── lowongan-kerja/      # Job listing pages
│   ├── artikel/             # Article pages
│   └── ...
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # Admin-specific components
│   │   ├── pages/          # Page-level components
│   │   └── ui/             # Reusable UI components
│   ├── services/           # API and business logic
│   ├── types/              # TypeScript definitions
│   └── utils/              # Helper functions
├── supabase/
│   └── migrations/         # Database migrations
└── styles/                 # Global styles
```

## 🔧 Configuration

### Admin Panel Access
Access the admin panel at `/admin` with appropriate user permissions.

### WordPress Integration
Configure WordPress API endpoints in the admin panel under Integration Settings.

### SEO Configuration
Manage meta tags, sitemaps, and schema markup through the admin panel's SEO settings.

## 🚀 Deployment

### Production Deployment (Ubuntu Server)

1. **Use the deployment script**
```bash
chmod +x deploy.sh
./deploy.sh
```

2. **Configure Nginx** (example config included in `nginx-production-config.conf`)

3. **Set up SSL** with Let's Encrypt or your preferred provider

### Replit Deployment
This project is optimized for Replit deployment with the included ecosystem configuration.

## 📊 Development Roadmap

### 🎯 P0 - Core Stability (Week 1-2)
**Priority: Critical | Timeline: 2 weeks**

#### Phase 1A: Bug Fixes & Performance (Week 1)
- [ ] Fix TypeScript compilation errors
- [ ] Optimize database queries for job listings
- [ ] Implement proper error boundaries
- [ ] Add comprehensive logging system
- [ ] Fix mobile responsive issues

#### Phase 1B: Security & Auth (Week 1-2)
- [ ] Implement rate limiting on API endpoints
- [ ] Add CSRF protection
- [ ] Enhance input validation and sanitization
- [ ] Add password reset functionality
- [ ] Implement session management improvements

### 🎯 P1 - Enhanced User Experience (Week 3-5)
**Priority: High | Timeline: 3 weeks**

#### Phase 2A: Search & Filtering (Week 3)
- [ ] Advanced search with autocomplete
- [ ] Saved search functionality
- [ ] Location-based job recommendations
- [ ] Salary range filters
- [ ] Company size filtering

#### Phase 2B: User Dashboard (Week 4)
- [ ] User profile enhancements
- [ ] Application tracking system
- [ ] Job alert notifications
- [ ] Resume upload and management
- [ ] Interview scheduling integration

#### Phase 2C: Content Management (Week 5)
- [ ] Rich text editor improvements
- [ ] Image gallery management
- [ ] Content versioning system
- [ ] Bulk content operations
- [ ] Content scheduling

### 🎯 P2 - Business Features (Week 6-9)
**Priority: Medium | Timeline: 4 weeks**

#### Phase 3A: Employer Features (Week 6-7)
- [ ] Employer registration and verification
- [ ] Company profile management
- [ ] Job posting workflow
- [ ] Applicant management dashboard
- [ ] Payment integration for premium listings

#### Phase 3B: Advanced Analytics (Week 8)
- [ ] User behavior tracking
- [ ] Job performance analytics
- [ ] Conversion rate optimization
- [ ] A/B testing framework
- [ ] Custom reporting dashboard

#### Phase 3C: Communication System (Week 9)
- [ ] In-app messaging system
- [ ] Email notification templates
- [ ] SMS integration for alerts
- [ ] Video interview integration
- [ ] Calendar synchronization

### 🎯 P3 - Advanced Features (Week 10-14)
**Priority: Low | Timeline: 5 weeks**

#### Phase 4A: AI/ML Integration (Week 10-11)
- [ ] Job recommendation engine
- [ ] Resume parsing and matching
- [ ] Skill assessment integration
- [ ] Chatbot for job queries
- [ ] Automated job categorization

#### Phase 4B: Mobile App (Week 12-13)
- [ ] React Native mobile app
- [ ] Push notifications
- [ ] Offline job browsing
- [ ] Mobile-specific features
- [ ] App store deployment

#### Phase 4C: Integrations & APIs (Week 14)
- [ ] Third-party job board integrations
- [ ] Social media sharing
- [ ] LinkedIn profile import
- [ ] Google for Jobs integration
- [ ] API for external developers

### 🎯 P4 - Scale & Optimization (Week 15-16)
**Priority: Future | Timeline: 2 weeks**

#### Phase 5: Infrastructure (Week 15-16)
- [ ] CDN implementation
- [ ] Database optimization and indexing
- [ ] Caching strategy enhancement
- [ ] Load balancing setup
- [ ] Monitoring and alerting system

## 📈 Performance Metrics

### Current Status
- ✅ **Lighthouse Score**: 90+ (Performance, SEO, Accessibility)
- ✅ **Core Web Vitals**: Optimized for LCP, FID, CLS
- ✅ **SEO**: Dynamic sitemaps, structured data
- ✅ **Mobile**: Responsive design with mobile-first approach

### Development Targets
- 🎯 **Page Load Time**: < 2 seconds
- 🎯 **API Response Time**: < 500ms
- 🎯 **Database Query Time**: < 100ms
- 🎯 **Image Load Time**: < 1 second

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

### Public Endpoints
- `GET /api/public/settings` - Site configuration
- `GET /api/public/advertisements` - Advertisement settings

### User Endpoints
- `POST /api/user/profile` - Update user profile
- `GET /api/user/bookmarks` - Get user bookmarks
- `POST /api/user/bookmarks` - Toggle bookmark

### Admin Endpoints
- `GET /api/admin/settings` - Admin settings
- `POST /api/admin/settings` - Update admin settings
- `POST /api/admin/force-sitemap-update` - Force sitemap regeneration

## 🔒 Security

- ✅ **Authentication**: Supabase Auth with JWT tokens
- ✅ **Authorization**: Role-based access control
- ✅ **Data Validation**: Input sanitization on all endpoints
- ✅ **SQL Injection**: Protected by Supabase RLS policies
- ✅ **XSS Protection**: React's built-in protection + sanitization

## 📞 Support

For support and questions:
- 📧 Email: support@nexjob.tech
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/nexjob-portal/issues)
- 📖 Documentation: [Project Wiki](https://github.com/yourusername/nexjob-portal/wiki)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide React](https://lucide.dev/) for the beautiful icons

---

Made with ❤️ by the Nexjob Team
