/**
 * Add metro city names to Candidates table in election_data.db
 *
 * This script adds a 'metro_city' column to the Candidates table
 * and populates it based on the sgg_name (district name).
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Metro city mapping function
function extractMetroCity(districtName, candidateName) {
  if (!districtName) return null;

  // Handle specific ambiguous single-character district names based on candidate name
  const ambiguousMap = {
    '남구': { '박수영': '부산' },
    '남구갑': { '김상욱': '울산' },
    '남구을': { '김기현': '울산' },
    '북구': { '윤종오': '울산' },
    '동구': { '김태선': '울산', '장철민': '대전' },
    '서구': { '김상훈': '대구' },
    '중구': { '박성민': '울산', '박용갑': '대전' }
  };

  if (ambiguousMap[districtName] && ambiguousMap[districtName][candidateName]) {
    return ambiguousMap[districtName][candidateName];
  }

  // Check specific metro cities FIRST before generic checks

  // 부산광역시
  const busanDistricts = [
    '중구영도구', '서구동구', '부산진구', '동래구', '해운대구',
    '사하구', '금정구', '연제구', '수영구', '사상구', '기장군'
  ];
  if (districtName.includes('부산') || busanDistricts.some(d => districtName.includes(d))) {
    return '부산';
  }

  // 대구광역시
  const daeguDistricts = [
    '중구남구', '동구군위군', '수성구', '달서구', '달성군', '북구'
  ];
  if (districtName.includes('대구') || daeguDistricts.some(d => districtName.includes(d))) {
    return '대구';
  }

  // 인천광역시
  const incheonDistricts = [
    '중구강화군옹진군', '동구미추홀구', '연수구', '남동구', '부평구', '계양구', '서구'
  ];
  if (districtName.includes('인천') || incheonDistricts.some(d => districtName.includes(d))) {
    return '인천';
  }

  // 광주광역시
  if (districtName.includes('광주') && !districtName.includes('시')) {
    return '광주';
  }

  // 대전광역시
  if (districtName.includes('대전') || districtName.includes('유성구') || districtName.includes('대덕구')) {
    return '대전';
  }

  // 울산광역시
  if (districtName.includes('울산') || districtName.includes('울주군')) {
    return '울산';
  }

  // 세종특별자치시
  if (districtName.includes('세종')) {
    return '세종';
  }

  // 경기도
  const gyeonggiCities = [
    '수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시',
    '동두천시', '안산시', '고양시', '과천시', '구리시', '남양주시', '오산시',
    '시흥시', '군포시', '하남시', '용인시', '파주시', '이천시', '안성시',
    '김포시', '화성시', '광주시', '양주시', '포천시', '여주시', '연천군',
    '가평군', '양평군'
  ];
  if (gyeonggiCities.some(city => districtName.includes(city))) {
    return '경기';
  }

  // 강원특별자치도
  const gangwonCities = [
    '춘천', '원주', '강릉', '동해', '태백', '속초', '삼척',
    '홍천', '횡성', '영월', '평창', '정선', '철원', '화천',
    '양구', '인제', '고성', '양양'
  ];
  if (gangwonCities.some(city => districtName.includes(city))) {
    return '강원';
  }

  // 충청북도
  const chungbukCities = [
    '청주', '충주', '제천', '보은', '옥천', '영동',
    '증평', '진천', '괴산', '음성', '단양'
  ];
  if (chungbukCities.some(city => districtName.includes(city))) {
    return '충북';
  }

  // 충청남도
  const chungnamCities = [
    '천안', '공주', '보령', '아산', '서산', '논산',
    '계룡', '당진', '금산', '부여', '서천', '청양',
    '홍성', '예산', '태안'
  ];
  if (chungnamCities.some(city => districtName.includes(city))) {
    return '충남';
  }

  // 전북특별자치도
  const jeonbukCities = [
    '전주', '군산', '익산', '정읍', '남원', '김제',
    '완주', '진안', '무주', '장수', '임실', '순창',
    '고창', '부안'
  ];
  if (jeonbukCities.some(city => districtName.includes(city))) {
    return '전북';
  }

  // 전라남도
  const jeonnamCities = [
    '목포', '여수', '순천', '나주', '광양', '담양',
    '곡성', '구례', '고흥', '보성', '화순', '장흥',
    '강진', '해남', '영암', '무안', '함평', '영광',
    '장성', '완도', '진도', '신안'
  ];
  if (jeonnamCities.some(city => districtName.includes(city))) {
    return '전남';
  }

  // 경상북도
  const gyeongbukCities = [
    '포항', '경주', '김천', '안동', '구미', '영주',
    '영천', '상주', '문경', '경산', '군위', '의성',
    '청송', '영양', '영덕', '청도', '고령', '성주',
    '칠곡', '예천', '봉화', '울진', '울릉'
  ];
  if (gyeongbukCities.some(city => districtName.includes(city))) {
    return '경북';
  }

  // 경상남도
  const gyeongnamCities = [
    '창원', '진주', '통영', '사천', '김해', '밀양',
    '거제', '양산', '의령', '함안', '창녕', '고성',
    '남해', '하동', '산청', '함양', '거창', '합천'
  ];
  if (gyeongnamCities.some(city => districtName.includes(city))) {
    return '경남';
  }

  // 제주특별자치도
  if (districtName.includes('제주') || districtName.includes('서귀포')) {
    return '제주';
  }

  // 서울특별시 (마지막에 체크 - 다른 광역시의 '구'와 구분하기 위해)
  if (districtName.includes('구') && !districtName.includes('시')) {
    return '서울';
  }

  return null;
}

async function addMetroCityColumn() {
  try {
    console.log('Initializing sql.js...');
    const SQL = await initSqlJs();

    const dbPath = path.join(__dirname, '../data/election_data.db');
    console.log(`Loading database from ${dbPath}...`);

    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);

    // Check if metro_city column already exists
    const columns = db.exec("PRAGMA table_info(Candidates)");
    const hasMetroCity = columns[0]?.values.some(col => col[1] === 'metro_city');

    if (!hasMetroCity) {
      console.log('Adding metro_city column...');
      db.run("ALTER TABLE Candidates ADD COLUMN metro_city TEXT");
    } else {
      console.log('metro_city column already exists');
    }

    // Get all candidates with name
    const candidates = db.exec("SELECT hubo_id, name, sgg_name FROM Candidates");

    if (candidates.length === 0) {
      console.log('No candidates found');
      return;
    }

    const rows = candidates[0].values;
    console.log(`Processing ${rows.length} candidates...`);

    let updated = 0;
    let skipped = 0;

    // Update each candidate with metro city
    for (const [hubo_id, name, sgg_name] of rows) {
      const metroCity = extractMetroCity(sgg_name, name);

      if (metroCity) {
        db.run(
          "UPDATE Candidates SET metro_city = ? WHERE hubo_id = ?",
          [metroCity, hubo_id]
        );
        updated++;

        if (updated <= 10) {
          console.log(`  ${name} (${sgg_name}) -> ${metroCity}`);
        }
      } else {
        skipped++;
        console.log(`  Skipped: ${sgg_name} (no metro city match)`);
      }
    }

    // Save changes
    console.log('\nSaving changes to database...');
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));

    // Copy to public folder
    const publicDbPath = path.join(__dirname, '../public/data/election_data.db');
    fs.writeFileSync(publicDbPath, Buffer.from(data));

    console.log(`\nCompleted!`);
    console.log(`  Updated: ${updated} candidates`);
    console.log(`  Skipped: ${skipped} candidates`);
    console.log(`  Database saved to: ${dbPath}`);
    console.log(`  Database copied to: ${publicDbPath}`);

    // Verify results
    const verification = db.exec(`
      SELECT metro_city, COUNT(*) as count
      FROM Candidates
      WHERE metro_city IS NOT NULL
      GROUP BY metro_city
      ORDER BY count DESC
    `);

    if (verification.length > 0) {
      console.log('\nMetro city distribution:');
      verification[0].values.forEach(([city, count]) => {
        console.log(`  ${city}: ${count} candidates`);
      });
    }

    db.close();

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
addMetroCityColumn();
