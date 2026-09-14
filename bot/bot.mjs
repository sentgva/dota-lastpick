/**
 * Минимальный бот-запускалка Web App. Без зависимостей: long polling через fetch.
 *
 * Запуск:  BOT_TOKEN=... WEBAPP_URL=https://... node bot/bot.mjs
 * или создайте .env в корне проекта (см. .env.example).
 *
 * Важно: Telegram принимает в web_app только HTTPS-ссылки.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Простейший .env — чтобы не тянуть dotenv ради двух переменных.
try {
  for (const line of readFileSync(resolve(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {
  /* .env не обязателен */
}

const TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

if (!TOKEN || !WEBAPP_URL) {
  console.error('Нужны переменные BOT_TOKEN и WEBAPP_URL (HTTPS). См. .env.example');
  process.exit(1);
}
if (!WEBAPP_URL.startsWith('https://')) {
  console.error('WEBAPP_URL должен начинаться с https:// — Telegram не откроет http.');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;

async function call(method, payload) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`${method}: ${data.description}`);
  return data.result;
}

/** Кнопка меню рядом с полем ввода — основной вход в приложение. */
async function setupMenuButton() {
  await call('setChatMenuButton', {
    menu_button: { type: 'web_app', text: 'Ласт пик', web_app: { url: WEBAPP_URL } },
  });
  await call('setMyCommands', {
    commands: [{ command: 'start', description: 'Открыть помощник по драфту' }],
  });
}

async function handleUpdate(update) {
  const msg = update.message;
  if (!msg?.text) return;

  await call('sendMessage', {
    chat_id: msg.chat.id,
    text:
      'Помощник по драфту Dota 2.\n\n' +
      'Выберите героев соперника и своих союзников — приложение покажет, кого лучше взять последним пиком, ' +
      'и что покупать против этого драфта.',
    reply_markup: {
      inline_keyboard: [[{ text: '🎯 Открыть приложение', web_app: { url: WEBAPP_URL } }]],
    },
  });
}

async function poll() {
  let offset = 0;
  console.log('Бот запущен, ожидаю обновления…');
  for (;;) {
    try {
      const updates = await call('getUpdates', { offset, timeout: 30 });
      for (const update of updates) {
        offset = update.update_id + 1;
        await handleUpdate(update).catch((e) => console.error('update:', e.message));
      }
    } catch (e) {
      console.error('polling:', e.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

const setupOnly = process.argv.includes('--setup');

try {
  await setupMenuButton();
} catch (e) {
  if (e.message.includes('Unauthorized')) {
    console.error('Telegram отклонил токен. Проверьте BOT_TOKEN — его выдаёт @BotFather.');
  } else {
    console.error('Не удалось настроить бота:', e.message);
  }
  process.exit(1);
}

console.log(`Web App: ${WEBAPP_URL}`);

if (setupOnly) {
  // Кнопка меню хранится на стороне Telegram — держать процесс не нужно.
  console.log('Кнопка меню установлена. Откройте чат с ботом — она уже там.');
  process.exit(0);
}

await poll();
