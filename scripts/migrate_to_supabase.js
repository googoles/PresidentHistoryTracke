/**
 * Supabase Data Migration Script
 *
 * This script migrates data from SQLite to Supabase
 * Run: node scripts/migrate_to_supabase.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use Service Key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Please set REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateData() {
    try {
        console.log('🚀 Starting data migration to Supabase...\n');

        // Load SQLite database
        console.log('📂 Loading SQLite database...');
        const SQL = await initSqlJs();
        const dbPath = path.join(__dirname, '../data/election_data.db');
        const dbBuffer = fs.readFileSync(dbPath);
        const db = new SQL.Database(dbBuffer);

        // Step 1: Migrate Candidates
        console.log('\n📊 Migrating candidates...');
        const candidatesResult = db.exec('SELECT * FROM Candidates WHERE is_winner = 1');

        if (candidatesResult.length > 0) {
            const columns = candidatesResult[0].columns;
            const candidateData = candidatesResult[0].values.map(row => {
                const obj = {};
                columns.forEach((col, idx) => {
                    obj[col] = row[idx];
                });
                return obj;
            });

            console.log(`  Found ${candidateData.length} winners to migrate`);

            // Batch upsert candidates
            const { data, error } = await supabase
                .from('candidates')
                .upsert(candidateData, {
                    onConflict: 'hubo_id'
                });

            if (error) {
                console.error('  ❌ Error migrating candidates:', error);
                throw error;
            }

            console.log(`  ✅ Successfully migrated ${candidateData.length} candidates`);
        } else {
            console.log('  ⚠️  No candidates found');
        }

        // Step 2: Migrate Pledges
        console.log('\n📋 Migrating pledges...');
        const pledgesResult = db.exec(`
            SELECT p.* FROM Pledges p
            JOIN Candidates c ON p.hubo_id = c.hubo_id
            WHERE c.is_winner = 1
        `);

        if (pledgesResult.length > 0) {
            const columns = pledgesResult[0].columns;
            const pledgeData = pledgesResult[0].values.map(row => {
                const obj = {};
                columns.forEach((col, idx) => {
                    obj[col] = row[idx];
                });
                return obj;
            });

            console.log(`  Found ${pledgeData.length} pledges to migrate`);

            // Batch insert in chunks (Supabase has a limit)
            const batchSize = 1000;
            let migratedCount = 0;

            for (let i = 0; i < pledgeData.length; i += batchSize) {
                const batch = pledgeData.slice(i, i + batchSize);

                const { data, error } = await supabase
                    .from('pledges')
                    .upsert(batch, {
                        onConflict: 'pledge_id'
                    });

                if (error) {
                    console.error(`  ❌ Error migrating pledges batch ${i / batchSize + 1}:`, error);
                    throw error;
                }

                migratedCount += batch.length;
                console.log(`  ✅ Migrated pledges ${i + 1} to ${Math.min(i + batchSize, pledgeData.length)} (${Math.round(migratedCount / pledgeData.length * 100)}%)`);
            }

            console.log(`  ✅ Successfully migrated ${migratedCount} pledges`);
        } else {
            console.log('  ⚠️  No pledges found');
        }

        // Step 3: Verify migration
        console.log('\n🔍 Verifying migration...');

        const { count: candidateCount } = await supabase
            .from('candidates')
            .select('*', { count: 'exact', head: true });

        const { count: pledgeCount } = await supabase
            .from('pledges')
            .select('*', { count: 'exact', head: true });

        console.log(`  📊 Candidates in Supabase: ${candidateCount}`);
        console.log(`  📋 Pledges in Supabase: ${pledgeCount}`);

        // Close SQLite database
        db.close();

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('  1. Verify data in Supabase Dashboard');
        console.log('  2. Update .env.local with your Supabase credentials');
        console.log('  3. Switch to SupabaseDataSource in the app');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        if (error.details) console.error('Details:', error.details);
        if (error.hint) console.error('Hint:', error.hint);
        process.exit(1);
    }
}

// Run migration
migrateData();
