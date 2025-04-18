// Этот файл используется для игнорирования платформо-зависимых модулей при сборке на Vercel

module.exports = {
  // Игнорировать все платформо-зависимые модули Rollup
  '@rollup/rollup-linux-*': true,
  '@rollup/rollup-darwin-*': true,
  '@rollup/rollup-win32-*': true,
  // Игнорировать конкретный модуль, вызывающий ошибку
  '@rollup/rollup-linux-x64-gnu': true
};