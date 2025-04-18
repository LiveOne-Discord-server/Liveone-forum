/**
 * secure-form.tsx
 * Безопасная форма с защитой от CSRF и XSS атак
 */

import React, { FormEvent, useEffect, useState } from 'react';
import { generateCSRFToken, storeCSRFToken, getCSRFToken } from '@/utils/securityUtils';
import { toast } from '@/hooks/use-toast';
import { useSecurity } from '@/hooks/useSecurity';

interface SecureFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSecureSubmit: (e: FormEvent, csrfToken: string) => void | Promise<void>;
  children: React.ReactNode;
}

/**
 * Компонент безопасной формы с защитой от CSRF и XSS атак
 */
const SecureForm = ({
  onSecureSubmit,
  children,
  ...props
}: SecureFormProps) => {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const { isSecurityInitialized } = useSecurity();

  // Инициализация CSRF-токена при монтировании компонента
  useEffect(() => {
    const initToken = () => {
      // Проверяем наличие токена, если нет - создаем новый
      let token = getCSRFToken();
      if (!token) {
        token = generateCSRFToken();
        storeCSRFToken(token);
      }
      setCsrfToken(token);
    };

    if (isSecurityInitialized) {
      initToken();
    }
  }, [isSecurityInitialized]);

  // Обработчик отправки формы с CSRF-защитой
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Проверяем наличие CSRF-токена
    if (!csrfToken) {
      toast.error('Ошибка безопасности: отсутствует CSRF-токен');
      return;
    }

    try {
      // Вызываем обработчик с передачей CSRF-токена
      await onSecureSubmit(e, csrfToken);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Ошибка при отправке формы');
    }
  };

  return (
    <form {...props} onSubmit={handleSubmit}>
      {/* Скрытое поле с CSRF-токеном */}
      <input type="hidden" name="csrf_token" value={csrfToken} />
      {children}
    </form>
  );
};

export { SecureForm };