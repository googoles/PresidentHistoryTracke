import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import TestElectionDB from './TestElectionDB'; // 🧪 테스트용 앱
import { DarkModeProvider } from './contexts/DarkModeContext';
import reportWebVitals from './reportWebVitals';

// 🧪 테스트 모드: URL 파라미터로 제어
// http://localhost:3000/?test=election-db
const urlParams = new URLSearchParams(window.location.search);
const testMode = urlParams.get('test');

const root = ReactDOM.createRoot(document.getElementById('root'));

// 🧪 테스트 모드 활성화: ?test=election-db
const AppComponent = testMode === 'election-db' ? TestElectionDB : App;

root.render(
  <React.StrictMode>
    <DarkModeProvider>
      <AppComponent />
    </DarkModeProvider>
  </React.StrictMode>
);

reportWebVitals();