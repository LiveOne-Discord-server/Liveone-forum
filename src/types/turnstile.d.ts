
interface TurnstileObject {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  tabindex?: number;
  'response-field'?: boolean;
  'refresh-expired'?: 'auto' | 'manual';
  appearance?: 'always' | 'execute' | 'interaction-only';
}

declare global {
  interface Window {
    turnstile?: TurnstileObject;
  }
}

export {};
