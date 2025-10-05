/**
 * Map winners to metro cities based on winner_list.txt structure
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Metro city section markers from winner_list.txt
const METRO_CITY_MARKERS = {
  '서울': '4.1.1. 서울특별시',
  '부산': '4.1.2. 부산광역시',
  '대구': '4.1.3. 대구광역시',
  '인천': '4.1.4. 인천광역시',
  '광주': '4.1.5. 광주광역시',
  '대전': '4.1.6. 대전광역시',
  '울산': '4.1.7. 울산광역시',
  '세종': '4.1.8. 세종특별자치시',
  '경기': '4.1.9. 경기도',
  '강원': '4.1.10. 강원특별자치도',
  '충북': '4.1.11. 충청북도',
  '충남': '4.1.12. 충청남도',
  '전북': '4.1.13. 전북특별자치도',
  '전남': '4.1.14. 전라남도',
  '경북': '4.1.15. 경상북도',
  '경남': '4.1.16. 경상남도',
  '제주': '4.1.17. 제주특별자치도'
};

async function mapWinnersFromList() {
  try {
    console.log('Loading winner_list.txt...');
    const winnerList = fs.readFileSync(path.join(__dirname, '../data/winner_list.txt'), 'utf-8');
    const lines = winnerList.split('\n');

    // Parse winners by section
    const winnerMetroMap = {}; // name -> metro_city
    let currentMetroCity = '서울'; // Start with Seoul (first section has no header)
    console.log('\nStarting with Seoul section (no header)...');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if this line is a metro city marker
      for (const [metroCity, marker] of Object.entries(METRO_CITY_MARKERS)) {
        if (line.includes(marker)) {
          currentMetroCity = metroCity;
          console.log(`\nFound section: ${marker} -> ${metroCity}`);
          break;
        }
      }

      // If we found a name line (after 지역구)
      // Pattern: line contains Korean name, next line is party, next is 선수/초선/재선
      if (currentMetroCity && line.length > 0 && line.length < 10) {
        // Check if this is likely a name (single Korean word/phrase)
        const isKoreanName = /^[가-힣]+$/.test(line);

        if (isKoreanName) {
          // Verify next lines for party and 선수 pattern
          const nextLine1 = lines[i + 1]?.trim() || '';
          const nextLine2 = lines[i + 2]?.trim() || '';

          if ((nextLine1.includes('민주당') || nextLine1.includes('국민의힘') || nextLine1.includes('무소속') ||
               nextLine1.includes('진보당') || nextLine1.includes('개혁신당')) &&
              (nextLine2.includes('선') || nextLine2.includes('초선') || nextLine2.includes('재선'))) {
            winnerMetroMap[line] = currentMetroCity;
            console.log(`  ${line} -> ${currentMetroCity}`);
          }
        }
      }
    }

    console.log(`\n\nParsed ${Object.keys(winnerMetroMap).length} winners from winner_list.txt`);

    // Now update database
    console.log('\nUpdating database...');
    const SQL = await initSqlJs();
    const db = new SQL.Database(fs.readFileSync(path.join(__dirname, '../data/election_data.db')));

    let updated = 0;
    let notFound = 0;

    for (const [name, metroCity] of Object.entries(winnerMetroMap)) {
      const result = db.exec(
        'UPDATE Candidates SET metro_city = ? WHERE name = ? AND is_winner = 1',
        [metroCity, name]
      );

      const check = db.exec('SELECT changes()');
      const changed = check[0].values[0][0];

      if (changed > 0) {
        updated++;
      } else {
        notFound++;
        console.log(`  Not found in DB: ${name}`);
      }
    }

    // Save database
    console.log('\nSaving changes...');
    const data = db.export();
    const dbPath = path.join(__dirname, '../data/election_data.db');
    const publicDbPath = path.join(__dirname, '../public/data/election_data.db');

    fs.writeFileSync(dbPath, Buffer.from(data));
    fs.writeFileSync(publicDbPath, Buffer.from(data));

    console.log(`\nCompleted!`);
    console.log(`  Updated: ${updated} winners`);
    console.log(`  Not found: ${notFound} winners`);

    // Verification
    const distribution = db.exec(`
      SELECT metro_city, COUNT(*) as count
      FROM Candidates
      WHERE is_winner = 1
      GROUP BY metro_city
      ORDER BY count DESC
    `);

    console.log('\nFinal metro city distribution (winners only):');
    distribution[0].values.forEach(([city, count]) => {
      console.log(`  ${city}: ${count} winners`);
    });

    const total = db.exec('SELECT COUNT(*) FROM Candidates WHERE is_winner = 1');
    console.log(`\nTotal winners in DB: ${total[0].values[0][0]}`);

    db.close();

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

mapWinnersFromList();
