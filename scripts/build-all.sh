#!/bin/bash

# Build all deployment formats for CustomGPT UI
# This script builds standalone app, widget, and iframe bundles

echo "🚀 Building CustomGPT UI - All Formats"
echo "====================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 completed successfully${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Clean previous builds
echo -e "\n${BLUE}Cleaning previous builds...${NC}"
rm -rf dist/ .next/
check_status "Clean"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "\n${BLUE}Installing dependencies...${NC}"
    npm install
    check_status "Dependencies installation"
fi

# Build standalone Next.js app
echo -e "\n${BLUE}Building standalone app...${NC}"
npm run build:standalone
check_status "Standalone build"

# Build widget bundle
echo -e "\n${BLUE}Building widget bundle...${NC}"
npm run build:widget
check_status "Widget build"

# Build iframe bundle
echo -e "\n${BLUE}Building iframe bundle...${NC}"
npm run build:iframe
check_status "Iframe build"

# Create deployment info
echo -e "\n${BLUE}Creating deployment info...${NC}"
cat > dist/BUILD_INFO.txt << EOF
CustomGPT UI Build Information
==============================
Build Date: $(date)
Node Version: $(node --version)
NPM Version: $(npm --version)

Deployment Files:
-----------------
1. Standalone App: /.next (deploy with Next.js server)
2. Widget Bundle: /dist/widget/
3. Iframe Bundle: /dist/iframe/

CDN URLs (update with your domain):
-----------------------------------
Widget: https://your-domain.com/widget/customgpt-widget.js
Iframe: https://your-domain.com/iframe/
Embed Script: https://your-domain.com/embed/customgpt-embed.js

Integration Examples:
--------------------
See /examples/ directory for integration examples
EOF

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ All builds completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nBuild outputs:"
echo -e "  • Standalone: ${BLUE}.next/${NC} (run with: npm start)"
echo -e "  • Widget: ${BLUE}dist/widget/${NC}"
echo -e "  • Iframe: ${BLUE}dist/iframe/${NC}"
echo -e "\nNext steps:"
echo -e "  1. Deploy the appropriate build to your server/CDN"
echo -e "  2. Update the script URLs in your integration code"
echo -e "  3. Test with your API key and agent ID"
echo -e "\nFor integration examples, see: ${BLUE}examples/${NC}"