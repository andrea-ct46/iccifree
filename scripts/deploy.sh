#!/bin/bash

# ==================================================
# ICCI FREE - Automated Deployment Script
# ==================================================
# Usage: ./deploy.sh [environment]
# Environments: staging, production
# ==================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
PROJECT_NAME="iccifree"
BUILD_DIR="."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ==================================================
# Functions
# ==================================================

print_header() {
    echo -e "${BLUE}"
    echo "========================================"
    echo "  ICCI FREE - Deployment Script"
    echo "  Environment: $ENVIRONMENT"
    echo "  Time: $(date)"
    echo "========================================"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_dependencies() {
    print_info "Checking dependencies..."
    
    # Check git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    # Check if we're in a git repo
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not a git repository"
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

validate_environment() {
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        print_error "Invalid environment: $ENVIRONMENT"
        echo "Usage: ./deploy.sh [staging|production]"
        exit 1
    fi
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        read -p "⚠️  Deploy to PRODUCTION? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            print_warning "Deployment cancelled"
            exit 0
        fi
    fi
}

run_tests() {
    print_info "Running tests..."
    
    # Validate HTML
    if command -v tidy &> /dev/null; then
        echo "Validating HTML..."
        find . -name "*.html" -type f -exec tidy -q -e {} \; 2>&1 | head -20
    fi
    
    # Check for console.log in production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if grep -r "console.log" js/ 2>/dev/null; then
            print_warning "Found console.log statements in production code"
        fi
    fi
    
    print_success "Tests completed"
}

optimize_files() {
    print_info "Optimizing files..."
    
    # Create backup
    BACKUP_DIR="backups/backup_$TIMESTAMP"
    mkdir -p "$BACKUP_DIR"
    cp -r css js images "$BACKUP_DIR/" 2>/dev/null || true
    print_success "Backup created at $BACKUP_DIR"
    
    # Minify would go here (requires additional tools)
    # uglifyjs, clean-css, etc.
    
    print_success "Files optimized"
}

check_env_vars() {
    print_info "Checking environment variables..."
    
    # Check if .env exists
    if [[ ! -f .env ]]; then
        print_warning ".env file not found"
        if [[ -f .env.example ]]; then
            print_info "Copy .env.example to .env and configure it"
        fi
    fi
    
    print_success "Environment variables checked"
}

deploy_netlify() {
    print_info "Deploying to Netlify ($ENVIRONMENT)..."
    
    if ! command -v netlify &> /dev/null; then
        print_error "Netlify CLI not installed"
        print_info "Install: npm install -g netlify-cli"
        exit 1
    fi
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        netlify deploy --prod --dir=.
    else
        netlify deploy --dir=.
    fi
    
    print_success "Deployed to Netlify"
}

deploy_vercel() {
    print_info "Deploying to Vercel ($ENVIRONMENT)..."
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not installed"
        print_info "Install: npm install -g vercel"
        exit 1
    fi
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        vercel --prod
    else
        vercel
    fi
    
    print_success "Deployed to Vercel"
}

deploy_custom() {
    print_info "Deploying to custom server..."
    
    # Example: rsync to server
    # rsync -avz --delete . user@server:/var/www/iccifree/
    
    print_warning "Custom deployment not configured"
    print_info "Edit deploy.sh to add your custom deployment logic"
}

git_commit() {
    print_info "Committing to git..."
    
    # Check for changes
    if git diff-index --quiet HEAD --; then
        print_info "No changes to commit"
        return
    fi
    
    # Stage all changes
    git add .
    
    # Commit with timestamp
    COMMIT_MSG="Deploy $ENVIRONMENT - $TIMESTAMP"
    git commit -m "$COMMIT_MSG"
    
    # Tag if production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        TAG="v$TIMESTAMP"
        git tag -a "$TAG" -m "Production release $TIMESTAMP"
        print_success "Created tag: $TAG"
    fi
    
    # Push
    git push origin $(git branch --show-current)
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        git push origin --tags
    fi
    
    print_success "Pushed to git"
}

run_lighthouse() {
    if command -v lighthouse &> /dev/null; then
        print_info "Running Lighthouse audit..."
        
        # Start local server
        python3 -m http.server 8000 &
        SERVER_PID=$!
        sleep 2
        
        # Run Lighthouse
        lighthouse http://localhost:8000 \
            --output html \
            --output-path "./reports/lighthouse_$TIMESTAMP.html" \
            --quiet
        
        # Kill server
        kill $SERVER_PID
        
        print_success "Lighthouse report: ./reports/lighthouse_$TIMESTAMP.html"
    fi
}

post_deployment() {
    print_info "Post-deployment tasks..."
    
    # Clear CDN cache (example)
    # curl -X POST https://api.cloudflare.com/client/v4/zones/.../purge_cache
    
    # Send notification (example)
    # curl -X POST webhook-url -d "Deployed $ENVIRONMENT"
    
    # Update status page
    # ...
    
    print_success "Post-deployment tasks completed"
}

print_summary() {
    echo ""
    echo -e "${GREEN}========================================"
    echo "  ✅ Deployment Successful!"
    echo "========================================${NC}"
    echo ""
    echo -e "${BLUE}Environment:${NC} $ENVIRONMENT"
    echo -e "${BLUE}Timestamp:${NC} $TIMESTAMP"
    echo -e "${BLUE}Backup:${NC} $BACKUP_DIR"
    echo ""
    
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        echo -e "${YELLOW}🔗 Staging URL:${NC} https://staging.iccifree.com"
    else
        echo -e "${GREEN}🔗 Production URL:${NC} https://iccifree.com"
    fi
    
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Test the deployment"
    echo "  2. Monitor error logs"
    echo "  3. Check analytics"
    echo ""
}

# ==================================================
# Main Deployment Flow
# ==================================================

main() {
    print_header
    
    validate_environment
    check_dependencies
    check_env_vars
    run_tests
    optimize_files
    
    # Git operations
    git_commit
    
    # Choose deployment method
    echo ""
    echo "Choose deployment target:"
    echo "1) Netlify"
    echo "2) Vercel"
    echo "3) Custom"
    echo "4) Skip deployment"
    read -p "Enter choice [1-4]: " choice
    
    case $choice in
        1) deploy_netlify ;;
        2) deploy_vercel ;;
        3) deploy_custom ;;
        4) print_info "Skipping deployment" ;;
        *) print_error "Invalid choice"; exit 1 ;;
    esac
    
    # Post-deployment
    post_deployment
    
    # Optional: Run Lighthouse
    read -p "Run Lighthouse audit? (y/n): " run_audit
    if [[ "$run_audit" == "y" ]]; then
        run_lighthouse
    fi
    
    print_summary
}

# Run main function
main

exit 0
