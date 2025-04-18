// Специальная конфигурация Rollup для Vercel
export default {
  // Отключаем использование нативных модулей
  context: 'browser',
  // Игнорируем предупреждения о платформо-зависимых модулях
  onwarn(warning, warn) {
    // Игнорируем предупреждения о платформо-зависимых модулях
    if (
      warning.code === 'MODULE_LEVEL_DIRECTIVE' || 
      warning.message.includes('@rollup/rollup-') ||
      warning.message.includes('Could not resolve') ||
      warning.message.includes('native addon') ||
      warning.message.includes('optional dependency')
    ) {
      return;
    }
    warn(warning);
  },
  // Отключаем оптимизации, которые могут использовать нативные модули
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
  }
};