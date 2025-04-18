/**
 * secureFetch.ts
 * Безопасная обертка над fetch API с добавлением CSRF-защиты и других мер безопасности
 */

import { addCSRFTokenToRequest, sanitizeInput } from './securityUtils';
import { toast } from '@/hooks/use-toast';

interface SecureFetchOptions extends RequestInit {
  sanitizeResponse?: boolean;
  showErrorToast?: boolean;
}

/**
 * Безопасная версия fetch с добавлением CSRF-токена и других мер безопасности
 * @param url URL для запроса
 * @param options Опции запроса
 * @returns Promise с результатом запроса
 */
export const secureFetch = async <T>(
  url: string,
  options: SecureFetchOptions = {}
): Promise<T> => {
  try {
    // Добавляем CSRF-токен к запросу
    const secureOptions = addCSRFTokenToRequest(options);
    
    // Добавляем дополнительные заголовки безопасности
    secureOptions.headers = {
      ...secureOptions.headers,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    // Выполняем запрос
    const response = await fetch(url, secureOptions);

    // Проверяем статус ответа
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Ошибка ${response.status}: ${response.statusText}`;
      
      if (options.showErrorToast !== false) {
        toast.error(errorMessage);
      }
      
      throw new Error(errorMessage);
    }

    // Получаем данные ответа
    const data = await response.json();

    // Если требуется санитизация ответа
    if (options.sanitizeResponse && typeof data === 'object') {
      return sanitizeResponseData(data);
    }

    return data as T;
  } catch (error) {
    console.error('Secure fetch error:', error);
    
    if (options.showErrorToast !== false) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при выполнении запроса');
    }
    
    throw error;
  }
};

/**
 * Рекурсивная санитизация данных ответа для предотвращения XSS
 * @param data Данные для санитизации
 * @returns Санитизированные данные
 */
function sanitizeResponseData<T>(data: T): T {
  if (typeof data === 'string') {
    return sanitizeInput(data) as unknown as T;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponseData(item)) as unknown as T;
  }
  
  if (data !== null && typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      sanitized[key] = sanitizeResponseData(value);
    }
    
    return sanitized as T;
  }
  
  return data;
}

/**
 * Безопасная версия POST запроса
 * @param url URL для запроса
 * @param data Данные для отправки
 * @param options Дополнительные опции
 * @returns Promise с результатом запроса
 */
export const securePost = async <T>(
  url: string,
  data: any,
  options: SecureFetchOptions = {}
): Promise<T> => {
  return secureFetch<T>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * Безопасная версия PUT запроса
 * @param url URL для запроса
 * @param data Данные для отправки
 * @param options Дополнительные опции
 * @returns Promise с результатом запроса
 */
export const securePut = async <T>(
  url: string,
  data: any,
  options: SecureFetchOptions = {}
): Promise<T> => {
  return secureFetch<T>(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    ...options,
  });
};

/**
 * Безопасная версия DELETE запроса
 * @param url URL для запроса
 * @param options Дополнительные опции
 * @returns Promise с результатом запроса
 */
export const secureDelete = async <T>(
  url: string,
  options: SecureFetchOptions = {}
): Promise<T> => {
  return secureFetch<T>(url, {
    method: 'DELETE',
    ...options,
  });
};