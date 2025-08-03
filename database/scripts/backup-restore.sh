#!/bin/bash

# Database Backup and Restore Scripts for Korea Promise Tracker
# Usage: ./backup-restore.sh [command] [options]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
BACKUP_DIR="$PROJECT_ROOT/database/backups"
DATE=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check dependencies
check_dependencies() {
    local deps=("psql" "pg_dump" "curl")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "$dep is not installed or not in PATH"
            exit 1
        fi
    done
}

# Load environment variables
load_env() {
    if [ -f "$PROJECT_ROOT/.env.local" ]; then
        source "$PROJECT_ROOT/.env.local"
    elif [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env"
    else
        log_error "No environment file found. Please create .env or .env.local with database credentials."
        exit 1
    fi
    
    # Check required variables
    if [ -z "$SUPABASE_DB_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        log_error "SUPABASE_DB_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment file"
        exit 1
    fi
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Created backup directory: $BACKUP_DIR"
    fi
}

# Backup functions
backup_schema() {
    local output_file="$BACKUP_DIR/schema_$DATE.sql"
    log_info "Creating schema backup..."
    
    pg_dump "$SUPABASE_DB_URL" \
        --schema-only \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        > "$output_file"
    
    log_success "Schema backup created: $output_file"
}

backup_data() {
    local output_file="$BACKUP_DIR/data_$DATE.sql"
    log_info "Creating data backup..."
    
    pg_dump "$SUPABASE_DB_URL" \
        --data-only \
        --no-owner \
        --no-privileges \
        --column-inserts \
        > "$output_file"
    
    log_success "Data backup created: $output_file"
}

backup_full() {
    local output_file="$BACKUP_DIR/full_$DATE.sql"
    log_info "Creating full database backup..."
    
    pg_dump "$SUPABASE_DB_URL" \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        > "$output_file"
    
    log_success "Full backup created: $output_file"
}

backup_tables() {
    local tables=("profiles" "promise_ratings" "citizen_reports" "report_votes" "subscriptions" "comments" "comment_votes")
    local output_file="$BACKUP_DIR/tables_$DATE.sql"
    
    log_info "Creating tables backup..."
    
    for table in "${tables[@]}"; do
        log_info "Backing up table: $table"
        pg_dump "$SUPABASE_DB_URL" \
            --table="public.$table" \
            --data-only \
            --no-owner \
            --no-privileges \
            --column-inserts \
            >> "$output_file"
    done
    
    log_success "Tables backup created: $output_file"
}

# Restore functions
restore_schema() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_warning "This will drop existing tables and recreate them. Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    log_info "Restoring schema from: $backup_file"
    psql "$SUPABASE_DB_URL" < "$backup_file"
    log_success "Schema restored successfully"
}

restore_data() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_warning "This will insert data into existing tables. Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    log_info "Restoring data from: $backup_file"
    psql "$SUPABASE_DB_URL" < "$backup_file"
    log_success "Data restored successfully"
}

restore_full() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_warning "This will completely replace the existing database. Continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    log_info "Restoring full database from: $backup_file"
    psql "$SUPABASE_DB_URL" < "$backup_file"
    log_success "Database restored successfully"
}

# Migration functions
run_migrations() {
    local migration_dir="$PROJECT_ROOT/database/migrations"
    
    log_info "Running database migrations..."
    
    # Run master migration file
    if [ -f "$migration_dir/000_run_all_migrations.sql" ]; then
        log_info "Running master migration file..."
        psql "$SUPABASE_DB_URL" < "$migration_dir/000_run_all_migrations.sql"
    else
        # Run individual migration files
        for migration_file in "$migration_dir"/*.sql; do
            if [[ "$migration_file" == *"000_run_all_migrations.sql" ]]; then
                continue
            fi
            
            if [ -f "$migration_file" ]; then
                log_info "Running migration: $(basename "$migration_file")"
                psql "$SUPABASE_DB_URL" < "$migration_file"
            fi
        done
    fi
    
    log_success "Migrations completed successfully"
}

seed_data() {
    local seed_dir="$PROJECT_ROOT/database/seeds"
    
    log_info "Seeding test data..."
    
    for seed_file in "$seed_dir"/*.sql; do
        if [ -f "$seed_file" ]; then
            log_info "Running seed file: $(basename "$seed_file")"
            psql "$SUPABASE_DB_URL" < "$seed_file"
        fi
    done
    
    log_success "Test data seeded successfully"
}

# Verification functions
verify_installation() {
    log_info "Verifying database installation..."
    
    # Check tables exist
    local tables=("profiles" "promise_ratings" "citizen_reports" "subscriptions" "comments")
    for table in "${tables[@]}"; do
        local count=$(psql "$SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table';")
        if [ "$count" -eq 1 ]; then
            log_success "Table $table exists"
        else
            log_error "Table $table not found"
        fi
    done
    
    # Check RLS policies
    local policy_count=$(psql "$SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';")
    log_info "Found $policy_count RLS policies"
    
    # Check functions
    local functions=("get_promise_average_rating" "get_promise_rating_count" "get_user_subscriptions")
    for func in "${functions[@]}"; do
        local func_count=$(psql "$SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = '$func';")
        if [ "$func_count" -eq 1 ]; then
            log_success "Function $func exists"
        else
            log_error "Function $func not found"
        fi
    done
    
    log_success "Database verification completed"
}

# Cleanup functions
cleanup_old_backups() {
    local days=${1:-7}
    log_info "Cleaning up backups older than $days days..."
    
    find "$BACKUP_DIR" -name "*.sql" -type f -mtime +$days -delete
    log_success "Cleanup completed"
}

list_backups() {
    log_info "Available backups in $BACKUP_DIR:"
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A "$BACKUP_DIR")" ]; then
        ls -la "$BACKUP_DIR"/*.sql 2>/dev/null || log_info "No backup files found"
    else
        log_info "No backups found"
    fi
}

# Help function
show_help() {
    cat << EOF
Database Backup and Restore Tool for Korea Promise Tracker

Usage: $0 [COMMAND] [OPTIONS]

COMMANDS:
    backup-schema           Backup database schema only
    backup-data            Backup data only
    backup-full            Backup complete database
    backup-tables          Backup specific application tables
    
    restore-schema FILE    Restore schema from backup file
    restore-data FILE      Restore data from backup file
    restore-full FILE      Restore complete database from backup file
    
    migrate                Run database migrations
    seed                   Seed database with test data
    verify                 Verify database installation
    
    list-backups           List available backup files
    cleanup [DAYS]         Remove backups older than DAYS (default: 7)
    
    help                   Show this help message

EXAMPLES:
    $0 backup-full                    # Create full database backup
    $0 restore-schema schema.sql      # Restore schema from file
    $0 migrate                        # Run all migrations
    $0 cleanup 30                     # Remove backups older than 30 days

ENVIRONMENT:
    Set SUPABASE_DB_URL and SUPABASE_SERVICE_ROLE_KEY in .env file

EOF
}

# Main execution
main() {
    local command="$1"
    local arg="$2"
    
    # Check dependencies
    check_dependencies
    
    # Load environment
    load_env
    
    # Create backup directory
    create_backup_dir
    
    case "$command" in
        "backup-schema")
            backup_schema
            ;;
        "backup-data")
            backup_data
            ;;
        "backup-full")
            backup_full
            ;;
        "backup-tables")
            backup_tables
            ;;
        "restore-schema")
            restore_schema "$arg"
            ;;
        "restore-data")
            restore_data "$arg"
            ;;
        "restore-full")
            restore_full "$arg"
            ;;
        "migrate")
            run_migrations
            ;;
        "seed")
            seed_data
            ;;
        "verify")
            verify_installation
            ;;
        "list-backups")
            list_backups
            ;;
        "cleanup")
            cleanup_old_backups "$arg"
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"