
import { useLanguage } from './useLanguage';

export const useTranslation = () => {
  const { t } = useLanguage();
  return { t };
};
