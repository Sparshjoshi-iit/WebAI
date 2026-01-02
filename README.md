# 🚀 WebAI - AI-Powered Website Builder

A Bolt.new / Replit-style AI website builder that generates, previews, and deploys full-stack React applications directly in your browser.

![WebAI Demo](https://img.shields.io/badge/Status-Live-brightgreen) ![React](https://img.shields.io/badge/React-18.3-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) ![Vite](https://img.shields.io/badge/Vite-6.2-purple)

## ✨ Features

### 🤖 AI Code Generation
- Natural language to full React application
- Powered by Groq's Llama model for fast inference
- Generates complete project structures with components, styling, and configuration

### 🌐 In-Browser Development Environment
- **WebContainer** - Full Node.js runtime in the browser
- Live preview with hot reloading
- No server required - everything runs client-side
- File explorer with syntax-highlighted code editor

### 🚀 One-Click Deployment
- **GitHub Integration** - Automatically creates repos and pushes code
- **Vercel Deployment** - Direct deployment to production
- Auto-fixes common AI mistakes (invalid icon imports, etc.)
- Get a live URL in under 2 minutes

### 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Express, TypeScript, Groq SDK
- **Editor**: Monaco Editor (VS Code's editor)
- **Preview**: WebContainer API
- **Deployment**: Octokit (GitHub API), Vercel API
- **Git**: isomorphic-git with LightningFS

## 🎯 What I Built

This project is my attempt to clone the magic of [Bolt.new](https://bolt.new) and [Replit](https://replit.com). The goal was to understand and recreate the core workflow:

1. **Init** - Create a GitHub repository via API
2. **Code** - AI generates React code in the browser
3. **Preview** - WebContainer runs the code with live preview
4. **Sync** - Push code to GitHub
5. **Deploy** - Trigger Vercel deployment and get a live URL

### Key Achievements
- ✅ Full AI-to-deployment pipeline working
- ✅ WebContainer integration for in-browser Node.js
- ✅ Real-time code generation with streaming
- ✅ GitHub repo creation and file pushing
- ✅ Direct Vercel deployment (no GitHub integration required)
- ✅ Auto-correction of common AI code errors
- ✅ Beautiful dark-themed UI inspired by Bolt.new

## 🚀 Live Demo

- **Frontend**: [https://frontend-seven-rho-wedgxycnon.vercel.app](https://frontend-seven-rho-wedgxycnon.vercel.app)
- **Backend API**: [https://be-woad-beta.vercel.app](https://be-woad-beta.vercel.app)

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Groq API key ([Get one free](https://console.groq.com/keys))

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/Sparshjoshi-iit/WebAI.git
cd WebAI
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../be && npm install
```

3. **Configure environment**
```bash
# In the be/ folder, create .env file
cd be
echo "GROQ_API_KEY=your_groq_api_key_here" > .env
```

4. **Run the development servers**
```bash
# Terminal 1 - Backend (from be/ folder)
npm run dev

# Terminal 2 - Frontend (from frontend/ folder)
npm run dev
```

5. **Open the app**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## 🔧 Configuration

### Backend Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Your Groq API key for AI inference | Yes |

### For Deployment Feature
When using the deploy feature, users provide their own tokens:
- **GitHub Personal Access Token** - With `repo` scope
- **Vercel Access Token** - From Vercel dashboard

## 📁 Project Structure

```
WebAI/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Builder.tsx   # Main builder interface
│   │   │   ├── LandingPage.tsx
│   │   │   ├── Preview.tsx   # WebContainer preview
│   │   │   ├── DeployPanel.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useWebContainer.ts
│   │   │   └── useDeploy.ts
│   │   ├── services/         # API services
│   │   │   ├── github.ts     # GitHub API (Octokit)
│   │   │   ├── vercel.ts     # Vercel API
│   │   │   ├── git.ts        # isomorphic-git
│   │   │   └── deploy.ts     # Deployment orchestration
│   │   └── ...
│   └── vercel.json           # Vercel config with COOP/COEP headers
│
├── be/                       # Express backend
│   ├── src/
│   │   ├── index.ts          # API routes
│   │   ├── prompts.ts        # AI system prompts
│   │   └── defaults/         # Template files
│   └── vercel.json           # Serverless config
│
└── README.md
```

## 🔒 Security Notes

1. **API Keys** - Never commit `.env` files. They're gitignored.
2. **User Tokens** - GitHub/Vercel tokens are stored in localStorage. Users should be cautious on shared devices.
3. **CORS Headers** - WebContainer requires `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers.

## 🌐 Browser Compatibility

WebContainer only works in Chromium-based browsers:
- ✅ Chrome
- ✅ Edge
- ✅ Brave
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

## 🚀 Deploying Your Own Instance

### Deploy to Vercel

1. **Backend**
```bash
cd be
vercel deploy --prod
# Add GROQ_API_KEY in Vercel dashboard > Settings > Environment Variables
```

2. **Frontend**
```bash
cd frontend
# Update BACKEND_URL in src/config.ts to your backend URL
vercel deploy --prod
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License - feel free to use this for learning or building your own projects!

## 🙏 Acknowledgments

- [Bolt.new](https://bolt.new) - Inspiration for the UI/UX
- [WebContainer API](https://webcontainers.io/) - In-browser Node.js runtime
- [Groq](https://groq.com/) - Fast AI inference
- [Vercel](https://vercel.com/) - Deployment platform
- [GitHub Copilot](https://github.com/features/copilot) - AI pair programming assistant

---

Built with ❤️ by [Sparsh Joshi](https://github.com/Sparshjoshi-iit)
