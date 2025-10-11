#!/bin/bash

# Colors for logging
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

setup_env() {
    log_info "Setting up environment variables..."
    
    if [ ! -f .env.local ]; then
        log_warn ".env.local not found. Creating from configuration..."
        
        echo ""
        log_info "=== Environment Configuration ==="
        echo ""
        
        # Generate JWT secret automatically
        log_info "Generating secure JWT secret..."
        JWT_SECRET=$(openssl rand -base64 32)
        log_info "✓ JWT secret generated"
        
        # Prompt for database path
        read -p "Database path [./data/rag-platform.db]: " DB_PATH
        DB_PATH=${DB_PATH:-./data/rag-platform.db}
        
        # Create data directory
        DB_DIR=$(dirname "$DB_PATH")
        mkdir -p "$DB_DIR"
        log_info "✓ Database directory created: $DB_DIR"
        
        echo ""
        log_info "=== Embedding Provider Configuration ==="
        echo ""
        echo "Choose embedding provider:"
        echo "  1. OpenAI (text-embedding-3-small, 1536 dimensions)"
        echo "  2. Google Gemini (text-embedding-004, 768 dimensions, FREE tier)"
        echo ""
        read -p "Select provider (1 or 2) [1]: " EMBEDDING_CHOICE
        EMBEDDING_CHOICE=${EMBEDDING_CHOICE:-1}
        
        if [ "$EMBEDDING_CHOICE" = "2" ]; then
            EMBEDDING_PROVIDER="gemini"
            echo ""
            log_info "Selected: Google Gemini"
            echo "Get your API key from: https://makersuite.google.com/app/apikey"
            read -p "Enter Gemini API key: " GEMINI_API_KEY
            
            if [ -z "$GEMINI_API_KEY" ]; then
                log_error "Gemini API key is required"
                exit 1
            fi
            
            OPENAI_API_KEY=""
        else
            EMBEDDING_PROVIDER="openai"
            echo ""
            log_info "Selected: OpenAI"
            echo "You can use either:"
            echo "  - OpenAI API key (from https://platform.openai.com/api-keys)"
            echo "  - CustomGPT API key (if it starts with 'sk-')"
            echo ""
            read -p "Enter OpenAI API key (or leave blank to use CustomGPT key): " OPENAI_API_KEY
            GEMINI_API_KEY=""
        fi
        
        echo ""
        log_info "=== CustomGPT Configuration ==="
        echo ""
        echo "CustomGPT is used for generating responses (not embeddings)"
        echo "Get your API key from: https://app.customgpt.ai"
        read -p "Enter CustomGPT API key: " CUSTOMGPT_KEY
        
        if [ -z "$CUSTOMGPT_KEY" ]; then
            log_error "CustomGPT API key is required"
            exit 1
        fi
        
        # If OpenAI key not provided and embedding provider is openai, use CustomGPT key
        if [ "$EMBEDDING_PROVIDER" = "openai" ] && [ -z "$OPENAI_API_KEY" ]; then
            OPENAI_API_KEY="$CUSTOMGPT_KEY"
            log_info "Using CustomGPT key for OpenAI embeddings"
        fi
        
        read -p "Enter CustomGPT base URL [https://app.customgpt.ai/api/v1]: " CUSTOMGPT_BASE_URL
        CUSTOMGPT_BASE_URL=${CUSTOMGPT_BASE_URL:-https://app.customgpt.ai/api/v1}
        
        echo ""
        log_info "=== Agent Configuration (Optional) ==="
        echo ""
        echo "You can configure different CustomGPT agents for different functions."
        echo "Press Enter to skip any agent configuration."
        echo ""
        
        read -p "Default agent ID (fallback): " DEFAULT_AGENT_ID
        read -p "Sales agent ID: " SALES_AGENT_ID
        read -p "Support agent ID: " SUPPORT_AGENT_ID
        read -p "Technical agent ID: " TECHNICAL_AGENT_ID
        read -p "General agent ID: " GENERAL_AGENT_ID
        
        echo ""
        log_info "=== Domain Configuration ==="
        echo ""
        read -p "Enter your domain [http://localhost:3000]: " APP_URL
        APP_URL=${APP_URL:-http://localhost:3000}
        
        # Create .env.local
        cat > .env.local << EOF
# ============================================
# RAG Platform Configuration
# Generated: $(date)
# ============================================

# Backend Configuration
JWT_SECRET=${JWT_SECRET}
DATABASE_PATH=${DB_PATH}
QDRANT_URL=http://localhost:6333

# ============================================
# Embedding Provider: ${EMBEDDING_PROVIDER}
# ============================================
EMBEDDING_PROVIDER=${EMBEDDING_PROVIDER}
EOF

        # Add provider-specific keys
        if [ "$EMBEDDING_PROVIDER" = "gemini" ]; then
            cat >> .env.local << EOF
GEMINI_API_KEY=${GEMINI_API_KEY}
EOF
        else
            cat >> .env.local << EOF
OPENAI_API_KEY=${OPENAI_API_KEY}
EOF
        fi
        
        # Add CustomGPT configuration
        cat >> .env.local << EOF

# ============================================
# CustomGPT Configuration
# ============================================
CUSTOMGPT_API_KEY=${CUSTOMGPT_KEY}
CUSTOMGPT_BASE_URL=${CUSTOMGPT_BASE_URL}
EOF

        # Add agent IDs if provided
        if [ -n "$DEFAULT_AGENT_ID" ]; then
            echo "CUSTOMGPT_DEFAULT_AGENT_ID=${DEFAULT_AGENT_ID}" >> .env.local
        fi
        if [ -n "$SALES_AGENT_ID" ]; then
            echo "CUSTOMGPT_AGENT_SALES=${SALES_AGENT_ID}" >> .env.local
        fi
        if [ -n "$SUPPORT_AGENT_ID" ]; then
            echo "CUSTOMGPT_AGENT_SUPPORT=${SUPPORT_AGENT_ID}" >> .env.local
        fi
        if [ -n "$TECHNICAL_AGENT_ID" ]; then
            echo "CUSTOMGPT_AGENT_TECHNICAL=${TECHNICAL_AGENT_ID}" >> .env.local
        fi
        if [ -n "$GENERAL_AGENT_ID" ]; then
            echo "CUSTOMGPT_AGENT_GENERAL=${GENERAL_AGENT_ID}" >> .env.local
        fi
        
        # Add frontend configuration
        cat >> .env.local << EOF

# ============================================
# Frontend Configuration
# ============================================
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_APP_URL=${APP_URL}
EOF
        
        log_info "✓ .env.local created successfully"
        
        echo ""
        log_info "=== Configuration Summary ==="
        echo "  Embedding Provider: $EMBEDDING_PROVIDER"
        echo "  Database: $DB_PATH"
        echo "  CustomGPT: Configured"
        if [ -n "$DEFAULT_AGENT_ID" ]; then
            echo "  Default Agent: $DEFAULT_AGENT_ID"
        fi
        if [ -n "$SALES_AGENT_ID" ]; then
            echo "  Sales Agent: $SALES_AGENT_ID"
        fi
        if [ -n "$SUPPORT_AGENT_ID" ]; then
            echo "  Support Agent: $SUPPORT_AGENT_ID"
        fi
        if [ -n "$TECHNICAL_AGENT_ID" ]; then
            echo "  Technical Agent: $TECHNICAL_AGENT_ID"
        fi
        echo "  App URL: $APP_URL"
        echo ""
        
    else
        log_info ".env.local already exists"
        
        # Check if required variables are set
        if ! grep -q "JWT_SECRET=" .env.local || ! grep -q "CUSTOMGPT_API_KEY=" .env.local; then
            log_warn "Missing required environment variables in .env.local"
            read -p "Recreate .env.local? (y/n): " RECREATE
            
            if [ "$RECREATE" = "y" ] || [ "$RECREATE" = "Y" ]; then
                rm .env.local
                setup_env
                return
            fi
        fi
        
        log_info "Using existing .env.local configuration"
    fi
}

# Main deployment steps
main() {
    log_info "Starting deployment..."
    
    # Setup environment
    setup_env
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm install
    
    # Build the application
    log_info "Building application..."
    npm run build
    
    # Start or restart the application
    if pm2 list | grep -q "rag-platform"; then
        log_info "Restarting application..."
        pm2 restart rag-platform
    else
        log_info "Starting application..."
        pm2 start npm --name "rag-platform" -- start
    fi
    
    log_info "Deployment complete!"
    echo ""
    echo "Your RAG platform is now running at: ${APP_URL}"
    echo "Check the logs with: pm2 logs rag-platform"
    echo ""
}

# Run main function
main
