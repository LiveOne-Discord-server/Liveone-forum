/**
 * securityUtils.ts
 * Утилиты для обеспечения безопасности приложения
 */

import { toast } from '@/hooks/use-toast';

// Генерация CSRF-токена
export const generateCSRFToken = (): string => {
  const randomBytes = new Uint8Array(32);
  window.crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

// Сохранение CSRF-токена в localStorage
export const storeCSRFToken = (token: string): void => {
  localStorage.setItem('csrf_token', token);
};

// Получение CSRF-токена из localStorage
export const getCSRFToken = (): string | null => {
  return localStorage.getItem('csrf_token');
};

// Проверка CSRF-токена
export const validateCSRFToken = (token: string): boolean => {
  const storedToken = getCSRFToken();
  return storedToken === token;
};

// Добавление CSRF-токена к запросу
export const addCSRFTokenToRequest = (options: RequestInit = {}): RequestInit => {
  const token = getCSRFToken();
  if (!token) {
    // Если токен не найден, генерируем новый
    const newToken = generateCSRFToken();
    storeCSRFToken(newToken);
    return {
      ...options,
      headers: {
        ...options.headers,
        'X-CSRF-Token': newToken,
      },
    };
  }

  return {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': token,
    },
  };
};

// Санитизация ввода для предотвращения XSS-атак
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Проверка безопасности пароля
export const checkPasswordStrength = (password: string): { score: number; feedback: string } => {
  let score = 0;
  const feedback: string[] = [];

  // Длина пароля
  if (password.length < 8) {
    feedback.push('Пароль должен содержать не менее 8 символов');
  } else {
    score += 1;
  }

  // Наличие цифр
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Добавьте цифры для усиления пароля');
  }

  // Наличие строчных букв
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Добавьте строчные буквы для усиления пароля');
  }

  // Наличие заглавных букв
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Добавьте заглавные буквы для усиления пароля');
  }

  // Наличие специальных символов
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Добавьте специальные символы для усиления пароля');
  }

  return {
    score,
    feedback: feedback.join('. '),
  };
};

// Функция для безопасного хранения чувствительных данных
export const secureStore = {
  // Шифрование данных перед сохранением
  setItem: (key: string, value: string): void => {
    try {
      // В реальном приложении здесь должно быть шифрование
      // Для демонстрации используем простое кодирование
      const encodedValue = btoa(value);
      localStorage.setItem(`secure_${key}`, encodedValue);
    } catch (error) {
      console.error('Error storing secure data:', error);
      toast.error('Ошибка при сохранении данных');
    }
  },

  // Расшифровка данных при получении
  getItem: (key: string): string | null => {
    try {
      const encodedValue = localStorage.getItem(`secure_${key}`);
      if (!encodedValue) return null;
      // В реальном приложении здесь должна быть расшифровка
      // Для демонстрации используем простое декодирование
      return atob(encodedValue);
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      toast.error('Ошибка при получении данных');
      return null;
    }
  },

  // Удаление данных
  removeItem: (key: string): void => {
    localStorage.removeItem(`secure_${key}`);
  },
};

// Функция для установки безопасных заголовков
export const setSecurityHeaders = (): Record<string, string> => {
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
};

// Функция для проверки и обновления CSRF-токена
export const initCSRFProtection = (): void => {
  // Проверяем наличие токена, если нет - создаем новый
  if (!getCSRFToken()) {
    const newToken = generateCSRFToken();
    storeCSRFToken(newToken);
  }
};

// Функция для защиты от XSS при отображении пользовательского контента
export const createSafeHTML = (html: string): { __html: string } => {
  // Используем DOMPurify или другую библиотеку для очистки HTML
  // В этом примере используем простую санитизацию
  return { __html: sanitizeInput(html) };
};

// Инициализация защиты при загрузке приложения
export const initSecurity = (): void => {
  // Инициализируем CSRF-защиту
  initCSRFProtection();
  
  // Можно добавить другие меры безопасности при инициализации
  console.log('Security measures initialized');
};