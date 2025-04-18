/**
 * secure-content.tsx
 * Компонент для безопасного отображения пользовательского контента с защитой от XSS
 */

import React from 'react';
import { createSafeHTML } from '@/utils/securityUtils';

interface SecureContentProps {
  html: string;
  className?: string;
  allowedTags?: string[];
}

/**
 * Компонент для безопасного отображения HTML-контента
 * Защищает от XSS-атак при отображении пользовательского контента
 */
export const SecureContent: React.FC<SecureContentProps> = ({
  html,
  className = '',
  allowedTags = [],
}) => {
  // Создаем безопасный HTML с защитой от XSS
  const safeHTML = createSafeHTML(html);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={safeHTML}
    />
  );
};

/**
 * Компонент для безопасного отображения текстового контента
 * Экранирует все HTML-теги
 */
export const SecureText: React.FC<{ text: string; className?: string }> = ({
  text,
  className = '',
}) => {
  return (
    <span className={className}>
      {text}
    </span>
  );
};