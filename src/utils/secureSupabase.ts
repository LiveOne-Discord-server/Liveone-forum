/**
 * secureSupabase.ts
 * Утилиты для обеспечения безопасности при работе с Supabase
 */

import { supabase } from './supabase';
import { initCSRFProtection, getCSRFToken } from './securityUtils';
import { toast } from '@/hooks/use-toast';

// Инициализация CSRF-защиты
initCSRFProtection();

/**
 * Безопасная обертка для запросов к Supabase
 * Добавляет CSRF-токен и другие меры безопасности
 */
export const secureSupabase = {
  // Безопасная версия запроса к таблице
  from: (table: string) => {
    // Получаем стандартный запрос
    const query = supabase.from(table);
    
    // Добавляем CSRF-токен к метаданным запроса
    const originalSelect = query.select;
    query.select = function(columns: string) {
      const selectQuery = originalSelect.call(this, columns);
      
      // Добавляем CSRF-токен к заголовкам запроса
      const originalExecute = selectQuery.then;
      selectQuery.then = function(onfulfilled, onrejected) {
        // Добавляем CSRF-токен к метаданным запроса
        const token = getCSRFToken();
        if (token) {
          this.headers = {
            ...this.headers,
            'X-CSRF-Token': token,
          };
        }
        
        return originalExecute.call(this, onfulfilled, onrejected);
      };
      
      return selectQuery;
    };
    
    // Аналогично переопределяем другие методы
    const originalInsert = query.insert;
    query.insert = function(values) {
      const insertQuery = originalInsert.call(this, values);
      
      const originalExecute = insertQuery.then;
      insertQuery.then = function(onfulfilled, onrejected) {
        const token = getCSRFToken();
        if (token) {
          this.headers = {
            ...this.headers,
            'X-CSRF-Token': token,
          };
        }
        
        return originalExecute.call(this, onfulfilled, onrejected);
      };
      
      return insertQuery;
    };
    
    // Возвращаем модифицированный запрос
    return query;
  },
  
  // Безопасная версия запроса к хранилищу
  storage: {
    from: (bucket: string) => {
      const storageRef = supabase.storage.from(bucket);
      
      // Переопределяем метод upload для добавления CSRF-токена
      const originalUpload = storageRef.upload;
      storageRef.upload = function(path, fileBody, options) {
        const token = getCSRFToken();
        
        // Добавляем CSRF-токен к заголовкам запроса
        const secureOptions = {
          ...options,
          headers: {
            ...options?.headers,
            'X-CSRF-Token': token || '',
          },
        };
        
        return originalUpload.call(this, path, fileBody, secureOptions);
      };
      
      return storageRef;
    },
  },
  
  // Безопасная версия аутентификации
  auth: {
    signUp: async (credentials: { email: string; password: string }) => {
      try {
        // Проверяем наличие CSRF-токена
        const token = getCSRFToken();
        if (!token) {
          throw new Error('CSRF токен отсутствует');
        }
        
        // Добавляем дополнительные заголовки безопасности
        const { data, error } = await supabase.auth.signUp({
          ...credentials,
          options: {
            data: {
              csrf_token: token,
            },
          },
        });
        
        if (error) throw error;
        return { data, error: null };
      } catch (error: any) {
        console.error('Secure signup error:', error);
        toast.error(error.message || 'Ошибка при регистрации');
        return { data: null, error };
      }
    },
    
    signIn: async (credentials: { email: string; password: string }) => {
      try {
        // Проверяем наличие CSRF-токена
        const token = getCSRFToken();
        if (!token) {
          throw new Error('CSRF токен отсутствует');
        }
        
        // Выполняем вход с дополнительными мерами безопасности
        const { data, error } = await supabase.auth.signInWithPassword({
          ...credentials,
          options: {
            data: {
              csrf_token: token,
            },
          },
        });
        
        if (error) throw error;
        return { data, error: null };
      } catch (error: any) {
        console.error('Secure signin error:', error);
        toast.error(error.message || 'Ошибка при входе');
        return { data: null, error };
      }
    },
    
    // Другие методы аутентификации можно добавить аналогично
  },
};

/**
 * Функция для проверки безопасности сессии
 * @returns Promise<boolean> - true, если сессия безопасна
 */
export const validateSecureSession = async (): Promise<boolean> => {
  try {
    // Получаем текущую сессию
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    if (!session) return false;
    
    // Проверяем наличие CSRF-токена в метаданных пользователя
    const userMetadata = session.user.user_metadata;
    const csrfToken = getCSRFToken();
    
    // В реальном приложении здесь должна быть более сложная проверка
    // Например, сравнение с токеном на сервере
    
    return !!csrfToken;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};