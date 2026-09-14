/**
 * Отчёты сборщика в Telegram и кнопка «собрать ещё».
 *
 * Постоянно работающего бота у нас нет, поэтому опрашиваем getUpdates прямо
 * из прогона сборщика: отправили отчёт — несколько минут ждём нажатия.
 * Нажал — собираем ещё порцию, промолчал — прогон завершается.
 */

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export const telegramReady = Boolean(TOKEN && CHAT_ID);

async function call(method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  });
  const data = await res.json().catch(() => ({ ok: false }));
  if (!data.ok) console.log(`telegram ${method}: ${data.description ?? 'ошибка'}`);
  return data.result;
}

/** Отчёт с кнопкой продления. Возвращает id сообщения, чтобы потом убрать кнопку. */
export async function sendReport(text, { withButton = true } = {}) {
  if (!telegramReady) return null;
  const msg = await call('sendMessage', {
    chat_id: CHAT_ID,
    text,
    parse_mode: 'HTML',
    reply_markup: withButton
      ? { inline_keyboard: [[{ text: '➕ Собрать ещё', callback_data: 'collect_more' }]] }
      : undefined,
  });
  return msg?.message_id ?? null;
}

export async function editMessage(messageId, text) {
  if (!telegramReady || !messageId) return;
  await call('editMessageText', { chat_id: CHAT_ID, message_id: messageId, text, parse_mode: 'HTML' });
}

/**
 * Ждём нажатия кнопки. Telegram отдаёт апдейты через long polling,
 * поэтому ожидание почти не тратит запросов.
 *
 * @returns true — нажали «Собрать ещё», false — время вышло
 */
export async function waitForContinue(messageId, waitSeconds) {
  if (!telegramReady) return false;

  // Пропускаем накопившиеся апдейты, чтобы не поймать старое нажатие.
  let offset = 0;
  const backlog = await call('getUpdates', { timeout: 0, offset: -1 });
  if (backlog?.length) offset = backlog[backlog.length - 1].update_id + 1;

  const deadline = Date.now() + waitSeconds * 1000;
  while (Date.now() < deadline) {
    const left = Math.max(1, Math.min(30, Math.round((deadline - Date.now()) / 1000)));
    const updates = await call('getUpdates', { timeout: left, offset, allowed_updates: ['callback_query'] });
    for (const u of updates ?? []) {
      offset = u.update_id + 1;
      const q = u.callback_query;
      if (q?.data !== 'collect_more') continue;
      await call('answerCallbackQuery', { callback_query_id: q.id, text: 'Собираю дальше…' });
      // Кнопку убираем, чтобы её не нажали повторно
      await call('editMessageReplyMarkup', {
        chat_id: CHAT_ID,
        message_id: messageId,
        reply_markup: { inline_keyboard: [] },
      });
      return true;
    }
  }
  await call('editMessageReplyMarkup', {
    chat_id: CHAT_ID,
    message_id: messageId,
    reply_markup: { inline_keyboard: [] },
  });
  return false;
}
