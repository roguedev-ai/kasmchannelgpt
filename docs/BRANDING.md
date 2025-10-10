# Branding Assets Inventory

## Current Branding Files

### Icons & Favicons
- **File**: `public/favicon.ico`
  - Size: 32x32
  - Used in: Browser tab
  - Referenced by: src/app/layout.tsx metadata

- **File**: `public/icons/icon-192x192.png`
  - Size: 192x192
  - Used in: PWA icon
  - Referenced by: public/manifest.json

- **File**: `public/favicon/logo.svg`
  - Vector format
  - Used in: Application header
  - Referenced by: src/components/Header.tsx

### Logos
- **File**: `public/logo.png`
  - Used in: Application header, login page
  - Referenced by: src/app/layout.tsx, src/components/auth/LoginForm.tsx

- **File**: `public/icons/logo.png`
  - Used in: Mobile navigation
  - Referenced by: src/components/MobileNav.tsx

### UI Icons
- **File**: `public/file.svg`
  - Used in: File upload component
  - Referenced by: src/components/FileUpload.tsx

- **File**: `public/globe.svg`
  - Used in: Language selector
  - Referenced by: src/components/LanguageSelector.tsx

- **File**: `public/window.svg`
  - Used in: Window controls
  - Referenced by: src/components/WindowControls.tsx

### Integration Images
- **File**: `public/images/integrations/Chat Interface.png`
  - Used in: Documentation
  - Referenced by: docs/features/chat.md

- **File**: `public/images/integrations/Voice Interface.png`
  - Used in: Documentation
  - Referenced by: docs/features/voice.md

- **File**: `public/images/integrations/Settings Panel.png`
  - Used in: Documentation
  - Referenced by: docs/features/settings.md

- **File**: `public/images/integrations/Agent Selector.png`
  - Used in: Documentation
  - Referenced by: docs/features/agents.md

### Comparison Assets
- **File**: `public/assets/comparison/soc.webp`
  - Used in: Marketing pages
  - Referenced by: src/app/compare/page.tsx

- **File**: `public/assets/comparison/gdpr.png`
  - Used in: Compliance pages
  - Referenced by: src/app/compliance/page.tsx

## Components Using Branding

### Header/Navigation
- **Component**: `src/components/Header.tsx`
  - Logo element: SVG logo with link to home
  - Current asset: public/favicon/logo.svg
  - Props: `logoUrl`, `logoAlt`

### Login Page
- **Component**: `src/components/auth/LoginForm.tsx`
  - Logo element: Main application logo
  - Current asset: public/logo.png
  - Props: `logoUrl`, `logoAlt`, `brandName`

### Mobile Navigation
- **Component**: `src/components/MobileNav.tsx`
  - Logo element: Mobile-optimized logo
  - Current asset: public/icons/logo.png
  - Props: `logoUrl`, `logoAlt`

## Metadata & Configuration

### Application Name
- Location: package.json
- Current value: "customgpt-starter-kit"
- Description: "A secure, multi-tenant RAG platform"

### PWA Manifest
- Location: public/manifest.json
```json
{
  "name": "CustomGPT RAG Platform",
  "short_name": "CustomGPT",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ],
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

### Page Metadata
- Location: src/app/layout.tsx
```typescript
export const metadata = {
  title: 'CustomGPT RAG Platform',
  description: 'Secure, multi-tenant RAG platform',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', url: '/logo.png' }
  ]
}
```

## Branding Customization Points

The following can be customized:

1. **Favicon** (browser tab icon)
   - Replace: public/favicon.ico
   - Sizes needed: 32x32
   - Format: ICO

2. **Application Logo** (header/navigation)
   - Replace: public/favicon/logo.svg
   - Format: SVG (vector)
   - Used in main navigation

3. **Mobile Logo**
   - Replace: public/icons/logo.png
   - Recommended size: 192x192
   - Format: PNG
   - Used in mobile views

4. **PWA Icon**
   - Replace: public/icons/icon-192x192.png
   - Size: 192x192
   - Format: PNG
   - Used for PWA installation

5. **Login Page Logo**
   - Replace: public/logo.png
   - Format: PNG
   - Used on authentication pages

6. **Application Name**
   - Edit: package.json
     ```json
     {
       "name": "your-app-name",
       "description": "Your description"
     }
     ```
   - Edit: public/manifest.json
     ```json
     {
       "name": "Your App Name",
       "short_name": "YourApp"
     }
     ```
   - Edit: src/app/layout.tsx
     ```typescript
     export const metadata = {
       title: 'Your App Name',
       description: 'Your description'
     }
     ```

7. **Theme Colors**
   - Edit: public/manifest.json
     ```json
     {
       "theme_color": "#your-color",
       "background_color": "#your-color"
     }
     ```
   - Edit: tailwind.config.js for UI colors

## File Organization

```
public/
  ├── favicon.ico              # Browser tab icon
  ├── logo.png                # Main application logo
  ├── favicon/
  │   └── logo.svg            # Vector logo
  ├── icons/
  │   ├── logo.png           # Mobile logo
  │   └── icon-192x192.png   # PWA icon
  ├── assets/
  │   └── comparison/        # Marketing assets
  └── images/
      └── integrations/      # Feature screenshots
```

## Recommended Image Specifications

1. **Vector Logo (SVG)**
   - Format: SVG
   - Color: Support both light/dark modes
   - Usage: Main navigation, marketing

2. **Favicon**
   - Size: 32x32
   - Format: ICO
   - Usage: Browser tabs

3. **Mobile/PWA Icons**
   - Size: 192x192
   - Format: PNG
   - Usage: Mobile devices, PWA

4. **Marketing Images**
   - Format: WebP or PNG
   - Optimization: Compress for web
   - Usage: Documentation, marketing
