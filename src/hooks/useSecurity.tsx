/**
 * useSecurity.tsx
 * Провайдер безопасности для приложения
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initSecurity, setSecurityHeaders } from '@/utils/securityUtils';
import { validateSecureSession } from '@/utils/secureSupabase';
import { toast } from './use-toast';

interface SecurityContextType {
  isSecurityInitialized: boolean;
  securityHeaders: Record<string, string>;
  isSessionSecure: boolean;
  refreshSecurity: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSecurityInitialized, setIsSecurityInitialized] = useState(false);
  const [securityHeaders, setSecurityHeadersState] = useState<Record<string, string>>({});
  const [isSessionSecure, setIsSessionSecure] = useState(false);

  const initializeSecurityMeasures = async () => {
    try {
      // Инициализация базовых мер безопасности
      initSecurity();
      
      // Установка безопасных заголовков
      const headers = setSecurityHeaders();
      setSecurityHeadersState(headers);
      
      // Проверка безопасности сессии
      const isSecure = await validateSecureSession();
      setIsSessionSecure(isSecure);
      
      setIsSecurityInitialized(true);
    } catch (error) {
      console.error('Error initializing security measures:', error);
      toast.error('Ошибка при инициализации мер безопасности');
    }
  };

  // Обновление мер безопасности
  const refreshSecurity = async () => {
    try {
      // Проверка безопасности сессии
      const isSecure = await validateSecureSession();
      setIsSessionSecure(isSecure);
    } catch (error) {
      console.error('Error refreshing security:', error);
    }
  };

  useEffect(() => {
    // Инициализация мер безопасности при загрузке приложения
    initializeSecurityMeasures();
    
    // Добавление обработчика для проверки безопасности при фокусе окна
    const handleFocus = () => {
      refreshSecurity();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <SecurityContext.Provider
      value={{
        isSecurityInitialized,
        securityHeaders,
        isSessionSecure,
        refreshSecurity,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  
  return context;
};