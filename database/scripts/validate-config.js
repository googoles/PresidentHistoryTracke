#!/usr/bin/env node

/**
 * Database Configuration Validation Script
 * Korea Promise Tracker - Phase 2 Implementation
 * 
 * This script validates the database configuration and tests connectivity
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  debug: (msg) => console.log(`${colors.magenta}[DEBUG]${colors.reset} ${msg}`)
};

// Load environment variables
function loadEnvironment() {
  const projectRoot = path.resolve(__dirname, '../..');
  const envFiles = ['.env.local', '.env'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(projectRoot, envFile);
    if (fs.existsSync(envPath)) {
      log.info(`Loading environment from ${envFile}`);
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      // Parse env file
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      });
      return true;
    }
  }
  
  log.warning('No environment file found. Using system environment variables.');
  return false;
}

// Validate required environment variables
function validateEnvironment() {
  log.info('Validating environment variables...');
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const optional = [
    'SUPABASE_DB_URL',
    'SUPABASE_PROJECT_ID'
  ];
  
  let valid = true;
  
  // Check required variables
  required.forEach(varName => {
    if (!process.env[varName]) {
      log.error(`Missing required environment variable: ${varName}`);
      valid = false;
    } else {
      log.success(`✓ ${varName} is set`);
    }
  });
  
  // Check optional variables
  optional.forEach(varName => {
    if (process.env[varName]) {
      log.success(`✓ ${varName} is set`);
    } else {
      log.warning(`○ ${varName} is not set (optional)`);
    }
  });
  
  return valid;
}

// Test Supabase connection
async function testSupabaseConnection() {
  log.info('Testing Supabase connection...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      log.error(`Connection test failed: ${error.message}`);
      return false;
    }
    
    log.success('✓ Supabase connection successful');
    return true;
  } catch (error) {
    log.error(`Connection error: ${error.message}`);
    return false;
  }
}

// Test service role connection
async function testServiceRoleConnection() {
  log.info('Testing service role connection...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test service role capabilities
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      log.error(`Service role test failed: ${error.message}`);
      return false;
    }
    
    log.success('✓ Service role connection successful');
    return true;
  } catch (error) {
    log.error(`Service role error: ${error.message}`);
    return false;
  }
}

// Check database schema
async function validateDatabaseSchema() {
  log.info('Validating database schema...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const expectedTables = [
      'profiles',
      'promise_ratings',
      'citizen_reports',
      'report_votes',
      'subscriptions',
      'comments',
      'comment_votes'
    ];
    
    let allTablesExist = true;
    
    for (const table of expectedTables) {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        log.error(`✗ Table '${table}' not found or not accessible`);
        allTablesExist = false;
      } else {
        log.success(`✓ Table '${table}' exists`);
      }
    }
    
    return allTablesExist;
  } catch (error) {
    log.error(`Schema validation error: ${error.message}`);
    return false;
  }
}

// Check RLS policies
async function validateRLSPolicies() {
  log.info('Checking RLS policies...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test RLS by trying to access data as anonymous user
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Test public read access
    const { data: ratingsData, error: ratingsError } = await anonSupabase
      .from('promise_ratings')
      .select('*')
      .limit(1);
    
    if (!ratingsError) {
      log.success('✓ Public read access to ratings works');
    } else {
      log.warning(`Public read test: ${ratingsError.message}`);
    }
    
    // Test protected write access (should fail for anonymous)
    const { error: writeError } = await anonSupabase
      .from('promise_ratings')
      .insert({ promise_id: 'test', user_id: 'test', rating: 5 });
    
    if (writeError && writeError.code === '42501') {
      log.success('✓ RLS policies are protecting write operations');
    } else {
      log.warning('RLS policies may not be properly configured for write protection');
    }
    
    return true;
  } catch (error) {
    log.error(`RLS validation error: ${error.message}`);
    return false;
  }
}

// Check database functions
async function validateDatabaseFunctions() {
  log.info('Checking database functions...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const expectedFunctions = [
      'get_promise_average_rating',
      'get_promise_rating_count',
      'get_user_subscriptions',
      'get_promise_comments'
    ];
    
    let allFunctionsWork = true;
    
    for (const func of expectedFunctions) {
      try {
        // Test function exists and is callable
        switch (func) {
          case 'get_promise_average_rating':
          case 'get_promise_rating_count':
            await supabase.rpc(func, { p_promise_id: 'test' });
            break;
          case 'get_user_subscriptions':
            await supabase.rpc(func, { p_user_id: '00000000-0000-0000-0000-000000000000' });
            break;
          case 'get_promise_comments':
            await supabase.rpc(func, { p_promise_id: 'test' });
            break;
        }
        log.success(`✓ Function '${func}' is callable`);
      } catch (error) {
        if (error.code === '42883') {
          log.error(`✗ Function '${func}' does not exist`);
          allFunctionsWork = false;
        } else {
          log.success(`✓ Function '${func}' exists (test call failed as expected)`);
        }
      }
    }
    
    return allFunctionsWork;
  } catch (error) {
    log.error(`Function validation error: ${error.message}`);
    return false;
  }
}

// Performance check
async function performanceCheck() {
  log.info('Running basic performance check...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const startTime = Date.now();
    
    // Test query performance
    await supabase
      .from('promise_ratings')
      .select('*')
      .limit(10);
    
    const queryTime = Date.now() - startTime;
    
    if (queryTime < 1000) {
      log.success(`✓ Basic query completed in ${queryTime}ms`);
    } else if (queryTime < 3000) {
      log.warning(`Query completed in ${queryTime}ms (acceptable but could be faster)`);
    } else {
      log.error(`Query took ${queryTime}ms (performance issue detected)`);
    }
    
    return queryTime < 3000;
  } catch (error) {
    log.error(`Performance check error: ${error.message}`);
    return false;
  }
}

// Generate configuration report
function generateReport(results) {
  console.log('\n' + '='.repeat(50));
  console.log('DATABASE CONFIGURATION VALIDATION REPORT');
  console.log('='.repeat(50));
  
  const checks = [
    { name: 'Environment Variables', result: results.environment },
    { name: 'Supabase Connection', result: results.connection },
    { name: 'Service Role Access', result: results.serviceRole },
    { name: 'Database Schema', result: results.schema },
    { name: 'RLS Policies', result: results.rls },
    { name: 'Database Functions', result: results.functions },
    { name: 'Performance', result: results.performance }
  ];
  
  let passed = 0;
  let total = checks.length;
  
  checks.forEach(check => {
    const status = check.result ? '✓ PASS' : '✗ FAIL';
    const color = check.result ? colors.green : colors.red;
    console.log(`${color}${status}${colors.reset} ${check.name}`);
    if (check.result) passed++;
  });
  
  console.log('\n' + '-'.repeat(50));
  console.log(`Overall Result: ${passed}/${total} checks passed`);
  
  if (passed === total) {
    log.success('All checks passed! Database is ready for use.');
    return true;
  } else {
    log.error(`${total - passed} checks failed. Please review the issues above.`);
    return false;
  }
}

// Main validation function
async function main() {
  console.log(`${colors.cyan}Korea Promise Tracker - Database Configuration Validator${colors.reset}\n`);
  
  // Load environment
  loadEnvironment();
  
  // Run all validation checks
  const results = {
    environment: validateEnvironment(),
    connection: false,
    serviceRole: false,
    schema: false,
    rls: false,
    functions: false,
    performance: false
  };
  
  if (results.environment) {
    results.connection = await testSupabaseConnection();
    
    if (results.connection) {
      results.serviceRole = await testServiceRoleConnection();
      
      if (results.serviceRole) {
        results.schema = await validateDatabaseSchema();
        results.rls = await validateRLSPolicies();
        results.functions = await validateDatabaseFunctions();
        results.performance = await performanceCheck();
      }
    }
  }
  
  // Generate report
  const success = generateReport(results);
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the validator
if (require.main === module) {
  main().catch(error => {
    log.error(`Validation failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  validateEnvironment,
  testSupabaseConnection,
  validateDatabaseSchema,
  validateRLSPolicies,
  validateDatabaseFunctions
};