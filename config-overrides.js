/**
 * Webpack Config Override for sql.js
 *
 * sql.js는 Node.js 환경과 브라우저 환경 모두를 지원하려고 하지만,
 * webpack 5는 기본적으로 Node.js polyfill을 포함하지 않습니다.
 *
 * 이 설정은 sql.js가 브라우저에서 작동하도록 Node.js 모듈을 무시합니다.
 */
module.exports = function override(config, env) {
  // Node.js 모듈 polyfill 설정
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "fs": false,           // 파일 시스템 - 브라우저에서 불필요
    "path": false,         // 경로 - 브라우저에서 불필요
    "crypto": false        // 암호화 - sql.js WASM에서 직접 처리
  };

  // WASM 파일 처리 (sql.js)
  config.experiments = {
    ...config.experiments,
    asyncWebAssembly: true
  };

  return config;
};
