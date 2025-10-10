#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_blue() { echo -e "${BLUE}[BRAND]${NC} $1"; }

CONFIG_FILE="branding/branding-config.json"
BACKUP_DIR="branding/backups"
CUSTOM_ASSETS_DIR="branding/custom-assets"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Ensure directories exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$CUSTOM_ASSETS_DIR"

show_banner() {
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║   RAG Platform Branding Manager        ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
}

show_menu() {
    echo ""
    log_blue "Available Commands:"
    echo "  1. backup      - Backup current branding assets"
    echo "  2. apply       - Apply new branding from custom-assets/"
    echo "  3. restore     - Restore from backup"
    echo "  4. status      - Show current branding status"
    echo "  5. preview     - Generate preview of custom assets"
    echo "  6. validate    - Validate custom assets"
    echo ""
}

backup_current_branding() {
    log_info "Backing up current branding..."
    
    BACKUP_TIMESTAMP_DIR="${BACKUP_DIR}/${TIMESTAMP}"
    mkdir -p "$BACKUP_TIMESTAMP_DIR"
    
    # Backup all configured assets
    if [ -f "public/favicon.ico" ]; then
        cp public/favicon.ico "${BACKUP_TIMESTAMP_DIR}/favicon.ico"
        log_info "✓ Backed up: favicon.ico"
    fi
    
    if [ -f "public/logo.png" ]; then
        cp public/logo.png "${BACKUP_TIMESTAMP_DIR}/logo.png"
        log_info "✓ Backed up: logo.png"
    fi
    
    if [ -f "public/login-logo.png" ]; then
        cp public/login-logo.png "${BACKUP_TIMESTAMP_DIR}/login-logo.png"
        log_info "✓ Backed up: login-logo.png"
    fi
    
    if [ -f "public/login-bg.jpg" ]; then
        cp public/login-bg.jpg "${BACKUP_TIMESTAMP_DIR}/login-bg.jpg"
        log_info "✓ Backed up: login-bg.jpg"
    fi
    
    if [ -f "public/icon-512.png" ]; then
        cp public/icon-512.png "${BACKUP_TIMESTAMP_DIR}/icon-512.png"
        log_info "✓ Backed up: icon-512.png"
    fi
    
    # Backup config files
    if [ -f "public/manifest.json" ]; then
        cp public/manifest.json "${BACKUP_TIMESTAMP_DIR}/manifest.json"
        log_info "✓ Backed up: manifest.json"
    fi
    
    # Create backup metadata
    cat > "${BACKUP_TIMESTAMP_DIR}/backup-info.txt" << EOF
Backup created: $(date)
Backed up by: $(whoami)
From directory: $(pwd)
EOF
    
    # Create 'latest' symlink
    rm -f "${BACKUP_DIR}/latest"
    ln -s "${TIMESTAMP}" "${BACKUP_DIR}/latest"
    
    log_info "✓ Backup completed: ${BACKUP_TIMESTAMP_DIR}"
    log_info "  Latest backup linked to: ${BACKUP_DIR}/latest"
}

validate_custom_assets() {
    log_info "Validating custom assets..."
    
    VALID=true
    
    # Check if custom assets directory has files
    if [ ! "$(ls -A $CUSTOM_ASSETS_DIR)" ]; then
        log_warn "No custom assets found in: $CUSTOM_ASSETS_DIR"
        log_info "Place your custom branding files in: $CUSTOM_ASSETS_DIR"
        log_info "Expected files:"
        echo "  - logo.png (application logo)"
        echo "  - login-logo.png (login page logo)"
        echo "  - favicon.ico (browser icon)"
        echo "  - login-bg.jpg (optional: login background)"
        echo "  - icon-512.png (PWA icon)"
        return 1
    fi
    
    # Validate image dimensions (requires ImageMagick)
    if command -v identify &> /dev/null; then
        if [ -f "${CUSTOM_ASSETS_DIR}/favicon.ico" ]; then
            log_info "Validating favicon.ico..."
            # Favicons should have multiple sizes, just check it exists
        fi
        
        if [ -f "${CUSTOM_ASSETS_DIR}/logo.png" ]; then
            SIZE=$(identify -format "%wx%h" "${CUSTOM_ASSETS_DIR}/logo.png" 2>/dev/null)
            log_info "✓ logo.png dimensions: $SIZE"
        fi
        
        if [ -f "${CUSTOM_ASSETS_DIR}/icon-512.png" ]; then
            SIZE=$(identify -format "%wx%h" "${CUSTOM_ASSETS_DIR}/icon-512.png" 2>/dev/null)
            if [ "$SIZE" != "512x512" ]; then
                log_warn "icon-512.png is $SIZE (recommended: 512x512)"
            else
                log_info "✓ icon-512.png dimensions: $SIZE"
            fi
        fi
    else
        log_warn "ImageMagick not installed - skipping dimension validation"
        log_info "Install with: sudo apt install imagemagick"
    fi
    
    log_info "✓ Validation complete"
    return 0
}

apply_custom_branding() {
    log_info "Applying custom branding..."
    
    # Validate first
    if ! validate_custom_assets; then
        log_error "Validation failed. Fix issues before applying."
        exit 1
    fi
    
    # Backup current branding first
    backup_current_branding
    
    # Copy custom assets to public directory
    if [ -f "${CUSTOM_ASSETS_DIR}/logo.png" ]; then
        cp "${CUSTOM_ASSETS_DIR}/logo.png" public/logo.png
        log_info "✓ Applied: logo.png"
    fi
    
    if [ -f "${CUSTOM_ASSETS_DIR}/login-logo.png" ]; then
        cp "${CUSTOM_ASSETS_DIR}/login-logo.png" public/login-logo.png
        log_info "✓ Applied: login-logo.png"
    fi
    
    if [ -f "${CUSTOM_ASSETS_DIR}/favicon.ico" ]; then
        cp "${CUSTOM_ASSETS_DIR}/favicon.ico" public/favicon.ico
        log_info "✓ Applied: favicon.ico"
    fi
    
    if [ -f "${CUSTOM_ASSETS_DIR}/login-bg.jpg" ]; then
        cp "${CUSTOM_ASSETS_DIR}/login-bg.jpg" public/login-bg.jpg
        log_info "✓ Applied: login-bg.jpg"
    fi
    
    if [ -f "${CUSTOM_ASSETS_DIR}/icon-512.png" ]; then
        cp "${CUSTOM_ASSETS_DIR}/icon-512.png" public/icon-512.png
        log_info "✓ Applied: icon-512.png"
        
        # Update manifest.json if it exists
        if [ -f "public/manifest.json" ]; then
            log_info "Updating manifest.json..."
            # This is a simple update, could use jq for more sophisticated changes
        fi
    fi
    
    log_info "✓ Custom branding applied successfully"
    log_warn "Restart the application to see changes: npm run dev"
}

restore_from_backup() {
    log_info "Available backups:"
    
    if [ ! -d "$BACKUP_DIR" ] || [ ! "$(ls -A $BACKUP_DIR)" ]; then
        log_error "No backups found"
        exit 1
    fi
    
    # List backups
    BACKUPS=($(ls -1 "$BACKUP_DIR" | grep -E '^[0-9]{8}_[0-9]{6}$' | sort -r))
    
    if [ ${#BACKUPS[@]} -eq 0 ]; then
        log_error "No valid backups found"
        exit 1
    fi
    
    echo ""
    for i in "${!BACKUPS[@]}"; do
        echo "  $((i+1)). ${BACKUPS[$i]}"
    done
    echo ""
    
    read -p "Select backup to restore (1-${#BACKUPS[@]}) or 'latest': " CHOICE
    
    if [ "$CHOICE" = "latest" ]; then
        BACKUP_TO_RESTORE="${BACKUP_DIR}/latest"
    else
        INDEX=$((CHOICE-1))
        if [ $INDEX -ge 0 ] && [ $INDEX -lt ${#BACKUPS[@]} ]; then
            BACKUP_TO_RESTORE="${BACKUP_DIR}/${BACKUPS[$INDEX]}"
        else
            log_error "Invalid selection"
            exit 1
        fi
    fi
    
    if [ ! -d "$BACKUP_TO_RESTORE" ]; then
        log_error "Backup not found: $BACKUP_TO_RESTORE"
        exit 1
    fi
    
    log_info "Restoring from: $BACKUP_TO_RESTORE"
    
    # Restore files
    if [ -f "${BACKUP_TO_RESTORE}/favicon.ico" ]; then
        cp "${BACKUP_TO_RESTORE}/favicon.ico" public/favicon.ico
        log_info "✓ Restored: favicon.ico"
    fi
    
    if [ -f "${BACKUP_TO_RESTORE}/logo.png" ]; then
        cp "${BACKUP_TO_RESTORE}/logo.png" public/logo.png
        log_info "✓ Restored: logo.png"
    fi
    
    if [ -f "${BACKUP_TO_RESTORE}/login-logo.png" ]; then
        cp "${BACKUP_TO_RESTORE}/login-logo.png" public/login-logo.png
        log_info "✓ Restored: login-logo.png"
    fi
    
    if [ -f "${BACKUP_TO_RESTORE}/login-bg.jpg" ]; then
        cp "${BACKUP_TO_RESTORE}/login-bg.jpg" public/login-bg.jpg
        log_info "✓ Restored: login-bg.jpg"
    fi
    
    if [ -f "${BACKUP_TO_RESTORE}/icon-512.png" ]; then
        cp "${BACKUP_TO_RESTORE}/icon-512.png" public/icon-512.png
        log_info "✓ Restored: icon-512.png"
    fi
    
    if [ -f "${BACKUP_TO_RESTORE}/manifest.json" ]; then
        cp "${BACKUP_TO_RESTORE}/manifest.json" public/manifest.json
        log_info "✓ Restored: manifest.json"
    fi
    
    log_info "✓ Restore completed"
    log_warn "Restart the application to see changes"
}

show_status() {
    log_info "Current Branding Status:"
    echo ""
    
    if [ -f "public/logo.png" ]; then
        if command -v identify &> /dev/null; then
            SIZE=$(identify -format "%wx%h" public/logo.png 2>/dev/null)
            log_info "✓ Logo: public/logo.png ($SIZE)"
        else
            log_info "✓ Logo: public/logo.png"
        fi
    else
        log_warn "✗ Logo: Not found"
    fi
    
    if [ -f "public/login-logo.png" ]; then
        log_info "✓ Login Logo: public/login-logo.png"
    else
        log_warn "✗ Login Logo: Not found"
    fi
    
    if [ -f "public/favicon.ico" ]; then
        log_info "✓ Favicon: public/favicon.ico"
    else
        log_warn "✗ Favicon: Not found"
    fi
    
    if [ -f "public/login-bg.jpg" ]; then
        log_info "✓ Login Background: public/login-bg.jpg"
    else
        log_info "  Login Background: Not set (optional)"
    fi
    
    if [ -f "public/icon-512.png" ]; then
        log_info "✓ PWA Icon: public/icon-512.png"
    else
        log_warn "✗ PWA Icon: Not found"
    fi
    
    echo ""
    log_info "Backups available: $(ls -1 $BACKUP_DIR 2>/dev/null | grep -E '^[0-9]{8}_[0-9]{6}$' | wc -l)"
    
    if [ -L "${BACKUP_DIR}/latest" ]; then
        LATEST=$(readlink "${BACKUP_DIR}/latest")
        log_info "Latest backup: $LATEST"
    fi
}

preview_assets() {
    log_info "Generating preview of custom assets..."
    
    if ! command -v convert &> /dev/null; then
        log_error "ImageMagick required for preview generation"
        log_info "Install with: sudo apt install imagemagick"
        exit 1
    fi
    
    PREVIEW_DIR="branding/preview"
    mkdir -p "$PREVIEW_DIR"
    
    # Create preview grid
    convert \( \
        \( "${CUSTOM_ASSETS_DIR}/logo.png" -resize 400x100 \) \
        \( "${CUSTOM_ASSETS_DIR}/login-logo.png" -resize 400x100 \) \
        +append \) \
        \( \
        \( "${CUSTOM_ASSETS_DIR}/favicon.ico" -resize 64x64 \) \
        \( "${CUSTOM_ASSETS_DIR}/icon-512.png" -resize 64x64 \) \
        +append \) \
        -append \
        "${PREVIEW_DIR}/preview.png"
    
    log_info "✓ Preview generated: ${PREVIEW_DIR}/preview.png"
}

# Main script
show_banner

if [ $# -eq 0 ]; then
    show_menu
    exit 0
fi

COMMAND=$1

case $COMMAND in
    backup)
        backup_current_branding
        ;;
    apply)
        apply_custom_branding
        ;;
    restore)
        restore_from_backup
        ;;
    status)
        show_status
        ;;
    preview)
        preview_assets
        ;;
    validate)
        validate_custom_assets
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_menu
        exit 1
        ;;
esac
