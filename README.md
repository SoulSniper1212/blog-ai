# AI Tech Blog

An AI-powered tech blog that automatically generates content from trending Reddit topics. Built with Next.js, TypeScript, and Google's Generative AI.

## 🚀 Features

- **AI-Generated Content**: Automatically creates blog posts from trending Reddit topics
- **Multi-Source Aggregation**: Fetches content from r/technology, r/artificial, r/cybersecurity, and r/saas
- **AI-Generated Images**: Creates relevant visuals using Google's Gemini AI
- **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS
- **Database Storage**: PostgreSQL database with Prisma ORM
- **Admin Panel**: Manage blog posts (archive, make private)
- **SEO Optimized**: Meta descriptions and proper page structure

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Google Generative AI (Gemini)
- **Deployment**: Vercel-ready
- **Content Sources**: Reddit API integration

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google AI API key (Gemini)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd blog-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/blog_ai"
   GEMINI_API_KEY="your-google-ai-api-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 API Endpoints

### Blog Management
- `GET /api/blogs` - Fetch blog posts with pagination
- `POST /api/blogs` - Create new blog post
- `PUT /api/blogs/[id]` - Update blog post
- `DELETE /api/blogs/[id]` - Delete blog post

### Content Generation
- `POST /api/generate-blogs` - Generate new blog posts from Reddit
- `POST /api/generate-from-topic` - Generate blog from specific topic
- `POST /api/generate-from-url` - Generate blog from URL content

### Authentication
- `POST /api/auth` - Admin authentication

## 📁 Project Structure

```
blog-ai/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── admin/          # Admin panel
│   │   ├── blog/           # Blog post pages
│   │   └── page.tsx        # Homepage
│   ├── components/         # React components
│   ├── lib/               # Utilities
│   └── types/             # TypeScript types
├── prisma/                # Database schema & migrations
├── public/                # Static assets
└── package.json
```

## 🎯 Key Features Explained

### AI Content Generation
The system automatically:
1. Fetches trending posts from specified subreddits
2. Extracts comments and context
3. Generates comprehensive blog posts using Google's Gemini AI
4. Creates relevant images for each post
5. Stores everything in the database

### Content Sources
- **Technology**: Latest tech trends and innovations
- **Artificial Intelligence**: AI/ML developments and discussions
- **Cybersecurity**: Security news and best practices
- **SaaS**: Software-as-a-Service industry insights

### Admin Features
- Archive/unarchive posts
- Make posts private/public
- View all posts with filtering
- Manual content generation

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GEMINI_API_KEY` | Google AI API key | Yes |

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Reddit communities for inspiring content
- Google Generative AI for content creation
- Next.js team for the amazing framework
- Vercel for seamless deployment

## 📞 Support

If you have any questions or need help, please open an issue in the repository.

---

**Note**: This project uses AI to generate content from Reddit discussions. We always credit original sources and maintain transparency about AI-generated content.
