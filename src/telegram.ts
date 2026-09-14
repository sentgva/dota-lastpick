/** Тонкая обёртка над Telegram WebApp SDK. Вне Telegram всё деградирует в no-op. */

interface TelegramWebApp {
  ready(): void;
  expand(): void;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  initDataUnsafe?: { user?: { id: number; first_name: string; username?: string } };
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy'): void;
    selectionChanged(): void;
  };
  BackButton?: { show(): void; hide(): void; onClick(cb: () => void): void; offClick(cb: () => void): void };
  setHeaderColor?(color: string): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export const tg = (): TelegramWebApp | undefined => window.Telegram?.WebApp;

export const inTelegram = (): boolean => Boolean(tg()?.initDataUnsafe?.user || tg()?.themeParams?.bg_color);

export function initTelegram(): void {
  const app = tg();
  if (!app) return;
  app.ready();
  app.expand();
  // Пробрасываем тему Telegram в CSS-переменные — дизайн подтянем позже.
  for (const [key, value] of Object.entries(app.themeParams ?? {})) {
    document.documentElement.style.setProperty(`--tg-${key.replace(/_/g, '-')}`, value);
  }
  document.documentElement.dataset.theme = app.colorScheme;
}

export function haptic(kind: 'select' | 'tap' = 'select'): void {
  const hf = tg()?.HapticFeedback;
  if (!hf) return;
  if (kind === 'select') hf.selectionChanged();
  else hf.impactOccurred('light');
}
