const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/election_data.db');

console.log('=== DATABASE SCHEMA ===\n');

db.all("SELECT sql FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  rows.forEach(row => {
    console.log(row.sql + ';\n');
  });

  console.log('\n=== TABLE COUNTS ===\n');

  // Get table names
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      return;
    }

    let pending = tables.length;
    tables.forEach(table => {
      db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, result) => {
        if (!err) {
          console.log(`${table.name}: ${result.count} rows`);
        }
        pending--;
        if (pending === 0) {
          console.log('\n=== SAMPLE DATA ===\n');
          showSampleData(tables);
        }
      });
    });
  });
});

function showSampleData(tables) {
  let pending = tables.length;
  tables.forEach(table => {
    db.all(`SELECT * FROM ${table.name} LIMIT 3`, (err, rows) => {
      if (!err && rows.length > 0) {
        console.log(`\n--- ${table.name} (sample) ---`);
        console.log(JSON.stringify(rows, null, 2));
      }
      pending--;
      if (pending === 0) {
        db.close();
      }
    });
  });
}
