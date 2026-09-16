/**
 * Сообщение о завершении прогона — в том числе когда сбор отменили руками.
 * Шаг помечен `if: always()`, поэтому отрабатывает при любом исходе.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN = process.env.BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;
if (!TOKEN || !CHAT) process.exit(0);

const RESULT = process.env.RESULT ?? 'unknown';
const LABEL = { success: '✅ Сбор завершён', cancelled: '⏹ Сбор остановлен', failure: '⚠️ Сбор упал' };

let line = '';
try {
  const s = JSON.parse(readFileSync(resolve(ROOT, 'public/stats.json'), 'utf8'));
  const games = [];
  for (const row of Object.values(s.matchup ?? {})) for (const cell of Object.values(row)) games.push(cell[0]);
  games.sort((a, b) => a - b);
  const median = games.length ? games[Math.floor(games.length / 2)] : 0;
  const moe = median > 0 ? 1.96 * Math.sqrt(0.25 / median) * 100 : 0;
  line =
    `\n\nМатчей в базе: <b>${s.matches.toLocaleString('ru')}</b>` +
    `\nИгр на пару: <b>${median.toLocaleString('ru')}</b> — погрешность ±${moe.toFixed(1)} п.п.`;
} catch {
  /* снапшота может не быть */
}

await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: CHAT,
    text: (LABEL[RESULT] ?? `Прогон завершён (${RESULT})`) + line,
    parse_mode: 'HTML',
  }),
});
