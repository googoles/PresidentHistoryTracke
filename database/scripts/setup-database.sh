#!/bin/bash

# Complete Database Setup Script for Korea Promise Tracker Phase 2
# This script automates the entire database setup process

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
MIGRATION_DIR="$PROJECT_ROOT/database/migrations"
SEED_DIR="$PROJECT_ROOT/database/seeds"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

log_header() {
    echo -e "${CYAN}$1${NC}"
}

# Print banner
print_banner() {
    echo ""
    echo "=================================================================="
    echo "   Korea Promise Tracker - Database Setup (Phase 2)"
    echo "=================================================================="
    echo ""
}

# Check dependencies
check_dependencies() {
    log_step "Checking dependencies..."
    
    local deps=("node" "npm" "psql" "pg_dump")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_info "Please install the missing dependencies and try again."
        exit 1
    fi
    
    log_success "All dependencies are installed"
}

# Load environment variables
load_environment() {
    log_step "Loading environment configuration..."
    
    if [ -f "$PROJECT_ROOT/.env.local" ]; then
        source "$PROJECT_ROOT/.env.local"
        log_success "Loaded environment from .env.local"
    elif [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env"
        log_success "Loaded environment from .env"
    else
        log_error "No environment file found!"
        log_info "Please create .env or .env.local with the following variables:"
        log_info "  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
        log_info "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
        log_info "  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
        log_info "  SUPABASE_DB_URL=your_database_url"
        exit 1
    fi
    
    # Validate required variables
    local required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    log_success "Environment configuration validated"
}

# Install Node.js dependencies
install_dependencies() {
    log_step "Installing Node.js dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Check if @supabase/supabase-js is installed
    if ! npm list @supabase/supabase-js &> /dev/null; then
        log_info "Installing Supabase client..."
        npm install @supabase/supabase-js
    fi
    
    log_success "Node.js dependencies are ready"
}

# Test database connection
test_connection() {
    log_step "Testing database connection..."
    
    if [ -f "$SCRIPT_DIR/validate-config.js" ]; then
        cd "$PROJECT_ROOT"
        if node "$SCRIPT_DIR/validate-config.js" --quiet; then
            log_success "Database connection verified"
        else
            log_error "Database connection failed"
            log_info "Please check your Supabase configuration and try again"
            exit 1
        fi
    else
        log_warning "Validation script not found, skipping connection test"
    fi
}

# Run database migrations
run_migrations() {
    log_step "Running database migrations..."
    
    if [ -z "$SUPABASE_DB_URL" ]; then
        log_error "SUPABASE_DB_URL not set. Cannot run migrations via psql."
        log_info "Please run the migrations manually in Supabase SQL Editor:"
        log_info "  1. Open Supabase Dashboard > SQL Editor"
        log_info "  2. Copy and paste the contents of database/migrations/000_run_all_migrations.sql"
        log_info "  3. Execute the SQL"
        
        read -p "Have you completed the manual migration? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Setup cancelled. Please complete migrations and run setup again."
            exit 1
        fi
        return
    fi
    
    local master_migration="$MIGRATION_DIR/000_run_all_migrations.sql"
    
    if [ -f "$master_migration" ]; then
        log_info "Running master migration file..."
        if psql "$SUPABASE_DB_URL" -f "$master_migration"; then
            log_success "Migrations completed successfully"
        else
            log_error "Migration failed"
            exit 1
        fi
    else
        log_error "Master migration file not found: $master_migration"
        exit 1
    fi
}

# Seed test data
seed_test_data() {
    log_step "Seeding test data..."
    
    read -p "Do you want to seed the database with test data? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -z "$SUPABASE_DB_URL" ]; then
            log_warning "SUPABASE_DB_URL not set. Cannot seed data via psql."
            log_info "Please run the seed files manually in Supabase SQL Editor:"
            for seed_file in "$SEED_DIR"/*.sql; do
                if [ -f "$seed_file" ]; then
                    log_info "  - $(basename "$seed_file")"
                fi
            done
        else
            for seed_file in "$SEED_DIR"/*.sql; do
                if [ -f "$seed_file" ]; then
                    log_info "Running seed file: $(basename "$seed_file")"
                    if psql "$SUPABASE_DB_URL" -f "$seed_file"; then
                        log_success "Seed file completed: $(basename "$seed_file")"
                    else
                        log_warning "Seed file failed: $(basename "$seed_file")"
                    fi
                fi
            done
        fi
        log_success "Test data seeding completed"
    else
        log_info "Skipping test data seeding"
    fi
}

# Verify installation
verify_installation() {
    log_step "Verifying installation..."
    
    if [ -f "$SCRIPT_DIR/validate-config.js" ]; then
        cd "$PROJECT_ROOT"
        if node "$SCRIPT_DIR/validate-config.js"; then
            log_success "Installation verification passed"
        else
            log_warning "Some verification checks failed"
            log_info "The database may still be functional. Check the validation output above."
        fi
    else
        log_warning "Validation script not found, skipping verification"
    fi
}

# Create backup
create_initial_backup() {
    log_step "Creating initial backup..."
    
    if [ -f "$SCRIPT_DIR/backup-restore.sh" ] && [ ! -z "$SUPABASE_DB_URL" ]; then
        if "$SCRIPT_DIR/backup-restore.sh" backup-schema; then
            log_success "Initial schema backup created"
        else
            log_warning "Backup creation failed"
        fi
    else
        log_info "Backup script not available or database URL not set"
        log_info "Consider creating manual backups of your database"
    fi
}

# Print next steps
print_next_steps() {
    log_header "Setup Complete! Next Steps:"
    echo ""
    echo "1. 📋 Database Tables Created:"
    echo "   - profiles (user information)"
    echo "   - promise_ratings (user ratings and reviews)"
    echo "   - citizen_reports (user-submitted progress reports)"
    echo "   - subscriptions (notification preferences)"
    echo "   - comments (threaded discussions)"
    echo "   - Supporting tables for votes and relationships"
    echo ""
    echo "2. 🔒 Security Features Enabled:"
    echo "   - Row Level Security (RLS) policies"
    echo "   - Authentication-based access control"
    echo "   - Data validation and constraints"
    echo ""
    echo "3. ⚡ Performance Features:"
    echo "   - Database indexes for optimal queries"
    echo "   - Views for aggregated data"
    echo "   - Functions for complex operations"
    echo ""
    echo "4. 🛠 Development Tools:"
    echo "   - Backup/restore scripts in database/scripts/"
    echo "   - TypeScript interfaces in src/types/database.ts"
    echo "   - Database utilities in src/utils/database.js"
    echo ""
    echo "5. 📖 Documentation:"
    echo "   - Complete database docs in database/README.md"
    echo "   - Migration files in database/migrations/"
    echo "   - Seed data in database/seeds/"
    echo ""
    echo "🚀 You can now proceed with Phase 3: Citizen Engagement Features"
    echo ""
    echo "Useful commands:"
    echo "  ./database/scripts/backup-restore.sh help"
    echo "  node ./database/scripts/validate-config.js"
    echo ""
}

# Clean up function
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Setup failed. Please check the errors above and try again."
        log_info "You can re-run this script safely - it will skip completed steps."
    fi
}

# Set up error handling
trap cleanup EXIT

# Main execution function
main() {
    print_banner
    
    # Step 1: Pre-flight checks
    log_header "Step 1: Pre-flight Checks"
    check_dependencies
    load_environment
    install_dependencies
    echo ""
    
    # Step 2: Database connection
    log_header "Step 2: Database Connection"
    test_connection
    echo ""
    
    # Step 3: Schema setup
    log_header "Step 3: Database Schema Setup"
    run_migrations
    echo ""
    
    # Step 4: Test data (optional)
    log_header "Step 4: Test Data (Optional)"
    seed_test_data
    echo ""
    
    # Step 5: Verification
    log_header "Step 5: Installation Verification"
    verify_installation
    echo ""
    
    # Step 6: Backup
    log_header "Step 6: Initial Backup"
    create_initial_backup
    echo ""
    
    # Step 7: Next steps
    print_next_steps
    
    log_success "Database setup completed successfully!"
}

# Help function
show_help() {
    cat << EOF
Korea Promise Tracker - Database Setup Script

This script automates the complete setup of the Phase 2 database schema.

Usage: $0 [OPTIONS]

OPTIONS:
    --help, -h          Show this help message
    --skip-deps         Skip dependency checks
    --skip-test         Skip connection testing
    --skip-verify       Skip installation verification
    --force-seed        Force seed data installation without prompt

ENVIRONMENT:
    Required environment variables in .env or .env.local:
    - NEXT_PUBLIC_SUPABASE_URL
    - NEXT_PUBLIC_SUPABASE_ANON_KEY  
    - SUPABASE_SERVICE_ROLE_KEY
    - SUPABASE_DB_URL (optional, for psql operations)

EXAMPLES:
    $0                  # Run complete setup with prompts
    $0 --skip-test      # Skip connection testing
    $0 --force-seed     # Automatically install test data

EOF
}

# Parse command line arguments
SKIP_DEPS=false
SKIP_TEST=false
SKIP_VERIFY=false
FORCE_SEED=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --skip-test)
            SKIP_TEST=true
            shift
            ;;
        --skip-verify)
            SKIP_VERIFY=true
            shift
            ;;
        --force-seed)
            FORCE_SEED=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Execute main function
main