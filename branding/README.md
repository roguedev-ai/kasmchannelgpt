# Branding Customization Guide

This directory contains all branding configuration and custom assets.

## Quick Start

1. **Add your custom assets** to `branding/custom-assets/`:
```
branding/custom-assets/
├── logo.png           # Main application logo (200x50px recommended)
├── login-logo.png     # Login page logo (300x100px recommended)
├── favicon.ico        # Browser tab icon (multi-size)
├── login-bg.jpg      # Login background (optional, 1920x1080)
└── icon-512.png      # PWA icon (512x512px)
```

2. **Validate your assets**:
```bash
./scripts/branding.sh validate
```

3. **Apply the branding**:
```bash
./scripts/branding.sh apply
```

4. **Restart the app**:
```bash
npm run dev
```

## Commands

### Backup Current Branding
```bash
./scripts/branding.sh backup
```
Creates timestamped backup in branding/backups/

### Apply Custom Branding
```bash
./scripts/branding.sh apply
```
Automatically backs up current branding, then applies custom assets

### Restore from Backup
```bash
./scripts/branding.sh restore
```
Interactive menu to choose which backup to restore

### Show Status
```bash
./scripts/branding.sh status
```
Displays current branding configuration

### Validate Assets
```bash
./scripts/branding.sh validate
```
Checks custom assets for correct dimensions and formats

## Asset Specifications

### Logo (logo.png)
- Size: 200x50px recommended
- Format: PNG with transparency
- Used in: Header, navigation
- Location: public/logo.png

### Login Logo (login-logo.png)
- Size: 300x100px recommended
- Format: PNG with transparency
- Used in: Login page
- Location: public/login-logo.png

### Favicon (favicon.ico)
- Sizes: 16x16, 32x32, 48x48
- Format: ICO format
- Used in: Browser tab
- Location: public/favicon.ico

### Login Background (login-bg.jpg) - Optional
- Size: 1920x1080px or larger
- Format: JPG
- Used in: Login page background
- Location: public/login-bg.jpg

### PWA Icon (icon-512.png)
- Size: 512x512px (exact)
- Format: PNG
- Used in: Progressive Web App icon
- Location: public/icon-512.png

## Directory Structure
```
branding/
├── README.md                  # This file
├── branding-config.json       # Configuration
├── custom-assets/            # Your custom branding files
│   ├── logo.png
│   ├── login-logo.png
│   ├── favicon.ico
│   ├── login-bg.jpg
│   └── icon-512.png
└── backups/                  # Automatic backups
    ├── 20250110_143022/      # Timestamped backups
    │   ├── logo.png
    │   └── ...
    └── latest -> 20250110_143022/  # Symlink to latest
```

## Workflow Example
```bash
# 1. Backup current branding
./scripts/branding.sh backup

# 2. Add your custom assets
cp ~/my-logo.png branding/custom-assets/logo.png
cp ~/my-favicon.ico branding/custom-assets/favicon.ico

# 3. Validate
./scripts/branding.sh validate

# 4. Apply
./scripts/branding.sh apply

# 5. Check status
./scripts/branding.sh status

# 6. If needed, rollback
./scripts/branding.sh restore
```

## Tips

- Always run backup before apply (apply does this automatically)
- Keep original assets in a safe location
- Use PNG format with transparency for logos
- Test in development before applying to production
- Backups are kept indefinitely - clean up old ones manually if needed

## Troubleshooting

### Issue: Dimensions warning during validation
**Solution**: Resize your images to recommended dimensions

### Issue: Changes not visible after apply
**Solution**: Hard refresh browser (Ctrl+Shift+R) or restart dev server

### Issue: Backup restore failed
**Solution**: Check file permissions in branding/backups/
