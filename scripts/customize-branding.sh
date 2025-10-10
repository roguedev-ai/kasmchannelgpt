#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging functions
log_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

log_info() {
    echo -e "${GREEN}INFO: $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}WARN: $1${NC}"
}

# Check image file exists
check_file() {
    if [ ! -f "$1" ]; then
        log_error "File not found: $1"
        return 1
    fi
    return 0
}

# Check image dimensions
check_dimensions() {
    local file=$1
    local expected_width=$2
    local expected_height=$3
    
    # Check if ImageMagick is installed
    if ! command -v identify &> /dev/null; then
        log_warn "ImageMagick not installed. Skipping dimension check."
        return 0
    fi
    
    # Get dimensions
    local dimensions=$(identify -format "%wx%h" "$file")
    local width=$(echo $dimensions | cut -d'x' -f1)
    local height=$(echo $dimensions | cut -d'x' -f2)
    
    if [ "$width" -ne "$expected_width" ] || [ "$height" -ne "$expected_height" ]; then
        log_error "Invalid dimensions for $file"
        log_error "Expected ${expected_width}x${expected_height}, got ${width}x${height}"
        return 1
    fi
    return 0
}

# Update application name
update_app_name() {
    local name=$1
    local description=$2
    
    # Update package.json
    if [ -f "package.json" ]; then
        sed -i "s/\"name\": \".*\"/\"name\": \"$name\"/" package.json
        sed -i "s/\"description\": \".*\"/\"description\": \"$description\"/" package.json
        log_info "✓ Updated package.json"
    fi
    
    # Update manifest.json
    if [ -f "public/manifest.json" ]; then
        sed -i "s/\"name\": \".*\"/\"name\": \"$name\"/" public/manifest.json
        sed -i "s/\"short_name\": \".*\"/\"short_name\": \"$name\"/" public/manifest.json
        log_info "✓ Updated manifest.json"
    fi
    
    # Update layout.tsx
    if [ -f "src/app/layout.tsx" ]; then
        sed -i "s/title: '.*'/title: '$name'/" src/app/layout.tsx
        sed -i "s/description: '.*'/description: '$description'/" src/app/layout.tsx
        log_info "✓ Updated layout.tsx"
    fi
}

# Main function
main() {
    echo "=== CustomGPT RAG Platform Branding Customization ==="
    echo ""
    
    # 1. Application Name
    echo "Enter application name:"
    read -p "Name: " APP_NAME
    
    echo "Enter application description:"
    read -p "Description: " APP_DESCRIPTION
    
    if [ ! -z "$APP_NAME" ]; then
        update_app_name "$APP_NAME" "$APP_DESCRIPTION"
    fi
    
    echo ""
    
    # 2. Favicon
    echo "Do you want to update the favicon? (y/n)"
    read -p "Update favicon: " UPDATE_FAVICON
    
    if [ "$UPDATE_FAVICON" = "y" ]; then
        echo "Enter path to new favicon.ico (32x32):"
        read -p "Path: " FAVICON_PATH
        
        if check_file "$FAVICON_PATH"; then
            if check_dimensions "$FAVICON_PATH" 32 32; then
                cp "$FAVICON_PATH" "public/favicon.ico"
                log_info "✓ Updated favicon"
            fi
        fi
    fi
    
    echo ""
    
    # 3. Vector Logo
    echo "Do you want to update the vector logo? (y/n)"
    read -p "Update logo: " UPDATE_LOGO
    
    if [ "$UPDATE_LOGO" = "y" ]; then
        echo "Enter path to new logo.svg:"
        read -p "Path: " LOGO_PATH
        
        if check_file "$LOGO_PATH"; then
            cp "$LOGO_PATH" "public/favicon/logo.svg"
            log_info "✓ Updated vector logo"
        fi
    fi
    
    echo ""
    
    # 4. Mobile Logo
    echo "Do you want to update the mobile logo? (y/n)"
    read -p "Update mobile logo: " UPDATE_MOBILE
    
    if [ "$UPDATE_MOBILE" = "y" ]; then
        echo "Enter path to new mobile logo (192x192 PNG):"
        read -p "Path: " MOBILE_PATH
        
        if check_file "$MOBILE_PATH"; then
            if check_dimensions "$MOBILE_PATH" 192 192; then
                cp "$MOBILE_PATH" "public/icons/logo.png"
                cp "$MOBILE_PATH" "public/icons/icon-192x192.png"
                log_info "✓ Updated mobile logos"
            fi
        fi
    fi
    
    echo ""
    
    # 5. Theme Colors
    echo "Do you want to update theme colors? (y/n)"
    read -p "Update colors: " UPDATE_COLORS
    
    if [ "$UPDATE_COLORS" = "y" ]; then
        echo "Enter primary theme color (hex, e.g., #007bff):"
        read -p "Color: " THEME_COLOR
        
        echo "Enter background color (hex, e.g., #ffffff):"
        read -p "Background: " BG_COLOR
        
        if [ ! -z "$THEME_COLOR" ] && [ ! -z "$BG_COLOR" ]; then
            # Update manifest.json
            if [ -f "public/manifest.json" ]; then
                sed -i "s/\"theme_color\": \".*\"/\"theme_color\": \"$THEME_COLOR\"/" public/manifest.json
                sed -i "s/\"background_color\": \".*\"/\"background_color\": \"$BG_COLOR\"/" public/manifest.json
                log_info "✓ Updated theme colors"
            fi
        fi
    fi
    
    echo ""
    log_info "=== Branding Customization Complete ==="
    echo ""
    log_info "Next steps:"
    echo "1. Review changes in browser"
    echo "2. Test PWA installation"
    echo "3. Check mobile display"
    echo "4. Verify dark mode"
    echo ""
    
    # Rebuild if needed
    echo "Do you want to rebuild the application? (y/n)"
    read -p "Rebuild: " REBUILD
    
    if [ "$REBUILD" = "y" ]; then
        npm run build
        log_info "✓ Application rebuilt"
    fi
}

# Run main
main
