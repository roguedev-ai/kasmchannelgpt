# Environment Variables Setup Guide

## 🔑 Naming Convention & Security

### ✅ Secure (Server-Side Only)
```env
# These are NEVER exposed to the browser
CUSTOMGPT_API_KEY=your_secret_api_key_here
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1
OPENAI_API_KEY=your_openai_key_for_voice_features
```

### ⚠️ Public (Exposed to Browser)
```env
# React - REACT_APP_ prefix
REACT_APP_CUSTOMGPT_AGENT_ID=78913
REACT_APP_CUSTOMGPT_AGENT_NAME=My Assistant

# Next.js - NEXT_PUBLIC_ prefix  
NEXT_PUBLIC_CUSTOMGPT_AGENT_ID=78913
NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME=My Assistant

# Vue/Vite - VITE_ prefix
VITE_CUSTOMGPT_AGENT_ID=78913
VITE_CUSTOMGPT_AGENT_NAME=My Assistant
```

## 📁 File Locations

### React (Create React App)
```
my-react-app/
├── .env.local                    # ✅ Git ignored by default
├── .env.example                  # ✅ Template for others
└── src/
    └── components/
        └── ChatWidget.jsx
```

### Next.js
```
my-nextjs-app/
├── .env.local                    # ✅ Git ignored by default
├── .env.example                  # ✅ Template for others
├── pages/api/proxy/[...path].js  # API route
└── components/
    └── ChatWidget.jsx
```

## 🔧 Complete .env.local Examples

### For React with Universal Proxy
```env
# .env.local for React app

# ============================================
# SERVER-SIDE (Proxy Server) - NEVER EXPOSED
# ============================================
# Add these to your proxy server's .env file
CUSTOMGPT_API_KEY=cgpt_1234567890abcdefghijklmnopqrstuvwxyz
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1

# Optional: For voice features
OPENAI_API_KEY=sk-1234567890abcdefghijklmnopqrstuvwxyz

# ============================================
# CLIENT-SIDE (React App) - EXPOSED TO BROWSER
# ============================================
# Only non-sensitive data here!
REACT_APP_CUSTOMGPT_AGENT_ID=78913
REACT_APP_CUSTOMGPT_AGENT_NAME=My Support Assistant
REACT_APP_API_PROXY_URL=http://localhost:3001/api/proxy

# Optional: Theme and UI settings
REACT_APP_THEME=light
REACT_APP_WIDGET_POSITION=bottom-right
```

### For Next.js (All-in-One)
```env
# .env.local for Next.js app

# ============================================
# SERVER-SIDE (API Routes) - NEVER EXPOSED  
# ============================================
CUSTOMGPT_API_KEY=cgpt_1234567890abcdefghijklmnopqrstuvwxyz
CUSTOMGPT_API_BASE_URL=https://app.customgpt.ai/api/v1

# Optional: For voice features
OPENAI_API_KEY=sk-1234567890abcdefghijklmnopqrstuvwxyz

# ============================================
# CLIENT-SIDE (React Components) - EXPOSED TO BROWSER
# ============================================
NEXT_PUBLIC_CUSTOMGPT_AGENT_ID=78913
NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME=My Support Assistant

# Optional: Theme and UI settings
NEXT_PUBLIC_THEME=light
NEXT_PUBLIC_WIDGET_POSITION=bottom-right
```

## 🛡️ Security Checklist

### ✅ DO
- Store API keys in server-side variables (no prefix)
- Use prefixed variables only for non-sensitive data
- Add `.env.local` to `.gitignore`
- Create `.env.example` with dummy values
- Use different API keys for development/production

### ❌ DON'T  
- Never put API keys in prefixed variables (REACT_APP_, NEXT_PUBLIC_, etc.)
- Never commit real API keys to git
- Never hardcode API keys in component files
- Never share API keys in screenshots or documentation

## 🔄 Migration Guide

### If You Currently Have Exposed API Keys:

1. **Immediate Action** - Regenerate your CustomGPT API key:
   - Go to [CustomGPT Dashboard](https://app.customgpt.ai)
   - Generate new API key
   - Update your server-side environment variables

2. **Update Environment Variables**:
```env
# OLD (❌ INSECURE)
REACT_APP_CUSTOMGPT_API_KEY=your_key  # EXPOSED!

# NEW (✅ SECURE)
CUSTOMGPT_API_KEY=your_key            # Server-side only
REACT_APP_CUSTOMGPT_AGENT_ID=78913    # Public data only
```

3. **Update Component Usage**:
```jsx
// OLD (❌ INSECURE)
<SimplifiedWidget 
  apiKey={process.env.REACT_APP_CUSTOMGPT_API_KEY}
  agentId={process.env.REACT_APP_CUSTOMGPT_AGENT_ID}
/>

// NEW (✅ SECURE)  
<SimplifiedWidget
  agentId={process.env.REACT_APP_CUSTOMGPT_AGENT_ID}
  apiBaseUrl="/api/proxy"  // Proxy handles API key
/>
```

## 🚀 Quick Setup Commands

### React + Universal Proxy
```bash
# 1. Setup React app env
cat > .env.local << EOF
REACT_APP_CUSTOMGPT_AGENT_ID=78913
REACT_APP_CUSTOMGPT_AGENT_NAME=My Assistant
REACT_APP_API_PROXY_URL=http://localhost:3001/api/proxy
EOF

# 2. Setup proxy server env (in separate directory)
mkdir customgpt-proxy && cd customgpt-proxy
npm init -y
npm install express cors dotenv
cat > .env << EOF
CUSTOMGPT_API_KEY=your_secret_key_here
PORT=3001
EOF
```

### Next.js All-in-One
```bash
# Setup Next.js env
cat > .env.local << EOF
# Server-side (secure)
CUSTOMGPT_API_KEY=your_secret_key_here

# Client-side (public)
NEXT_PUBLIC_CUSTOMGPT_AGENT_ID=78913
NEXT_PUBLIC_CUSTOMGPT_AGENT_NAME=My Assistant
EOF
```

## 📚 Framework-Specific Notes

### React
- Requires restart after changing environment variables
- Use `process.env.REACT_APP_VARIABLE_NAME` in components
- Variables are embedded at build time

### Next.js  
- Supports runtime environment variables in API routes
- Client-side variables still embedded at build time
- Can use different values for different deployment environments

### General Rules
- Always validate environment variables exist before using them
- Use default values for optional configuration
- Log (safely) which variables are loaded on startup