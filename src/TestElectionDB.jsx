import React from 'react';
import { ElectionDataProvider } from './contexts/ElectionDataContext';
import ElectionDataTest from './components/ElectionDataTest';

/**
 * Election DB Test Entry Point
 *
 * 로컬 DB 통합을 테스트하기 위한 별도 진입점입니다.
 * package.json에서 이 파일을 임시로 entry point로 변경하여 테스트할 수 있습니다.
 *
 * 또는 브라우저에서 /test-db 경로로 접근하도록 라우팅 추가
 */
function TestElectionDB() {
  return (
    <ElectionDataProvider>
      <ElectionDataTest />
    </ElectionDataProvider>
  );
}

export default TestElectionDB;
