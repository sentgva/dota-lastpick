/**
 * Подключает бота к serverless-функции на Vercel: после этого он отвечает
 * на /start и кнопки всегда, без запущенного процесса.
 *
 * Запуск: node scripts/setup-webhook.mjs
 * Нужны BOT_TOKEN и WEBHOOK_SECRET в .env (секрет — любая строка).
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
try {
  for (const line of readFileSync(resolve(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {
  /* .env не обязателен */
}

const TOKEN = process.env.BOT_TOKEN;
const SECRET = process.env.WEBHOOK_SECRET;
const URL_BASE = process.env.WEBAPP_URL?.replace(/\/$/, '') ?? 'https://dota-lastpick.vercel.app';

if (!TOKEN) {
  console.error('Нужен BOT_TOKEN');
  process.exit(1);
}

const call = async (method, payload) => {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  });
  return r.json();
};

const url = `${URL_BASE}/api/telegram`;
const res = await call('setWebhook', {
  url,
  secret_token: SECRET || undefined,
  allowed_updates: ['message', 'callback_query'],
  drop_pending_updates: true,
});
console.log(res.ok ? `вебхук установлен: ${url}` : `ошибка: ${res.description}`);

const info = await call('getWebhookInfo');
console.log('адрес:', info.result?.url || '—');
if (info.result?.last_error_message) {
  console.log('последняя ошибка:', info.result.last_error_message);
}

await call('setMyCommands', {
  commands: [
    { command: 'start', description: 'Управление сбором и статистика' },
    { command: 'clear', description: 'Очистить переписку' },
  ],
});
