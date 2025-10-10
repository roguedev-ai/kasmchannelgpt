#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }

log_info "Restarting application..."

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Stop the application
log_info "Stopping current instance..."
"$DIR/stop.sh"

# Wait for processes to fully stop
sleep 2

# Start the application
log_info "Starting new instance..."
"$DIR/deploy.sh"
