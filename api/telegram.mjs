/**
 * Управление сбором из Telegram. Живёт как serverless-функция на Vercel,
 * поэтому бот отвечает всегда — держать процесс не нужно.
 *
 * Переменные окружения Vercel:
 *   BOT_TOKEN        — токен бота от @BotFather
 *   TELEGRAM_CHAT_ID — кому разрешено управлять (свой chat id)
 *   GITHUB_TOKEN     — PAT с правом actions:write, чтобы запускать и отменять сбор
 *   WEBHOOK_SECRET   — произвольная строка, ею Telegram подписывает запросы
 */

const REPO = 'sentgva/dota-lastpick';
const WORKFLOW = 'collect.yml';
const SITE = 'https://dota-lastpick.vercel.app';

const tg = (method, payload) =>
  fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((r) => r.json());

const gh = (path, init = {}) =>
  fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'User-Agent': 'dota-draft-bot',
      ...(init.headers ?? {}),
    },
  });

/** Идущий прямо сейчас прогон сбора, если он есть. */
async function runningCollect() {
  const res = await gh('/actions/runs?status=in_progress&per_page=10');
  if (!res.ok) return null;
  const { workflow_runs = [] } = await res.json();
  return workflow_runs.find((r) => r.path?.endsWith(WORKFLOW)) ?? null;
}

const MENU = {
  inline_keyboard: [
    [{ text: '▶️ Начать сбор', callback_data: 'start' }],
    [{ text: '⏹ Остановить сбор', callback_data: 'stop' }],
    [{ text: '📊 Статистика', callback_data: 'stats' }],
  ],
};

async function statsText() {
  const res = await fetch(`${SITE}/stats.json`, { cache: 'no-store' });
  if (!res.ok) return 'Снапшот пока недоступен.';
  const s = await res.json();

  const games = [];
  for (const row of Object.values(s.matchup ?? {})) for (const cell of Object.values(row)) games.push(cell[0]);
  games.sort((a, b) => a - b);
  const median = games.length ? games[Math.floor(games.length / 2)] : 0;
  const moe = median > 0 ? 1.96 * Math.sqrt(0.25 / median) * 100 : 0;
  const withVs = Object.values(s.vsItems ?? {}).filter((e) => e.games >= 200).length;
  const updated = s.updated ? new Date(s.updated) : null;
  const hours = updated ? ((Date.now() - updated.getTime()) / 3600000).toFixed(1) : '?';

  return (
    `<b>Статистика сбора</b>\n\n` +
    `Матчей в базе: <b>${s.matches.toLocaleString('ru')}</b>\n` +
    `Игр на пару героев: <b>${median.toLocaleString('ru')}</b> — погрешность ±${moe.toFixed(1)} п.п.\n` +
    `Героев с контрпредметами: <b>${withVs}</b> из 127\n` +
    `Обновлено: ${hours} ч назад`
  );
}

async function handleAction(action, chatId) {
  if (action === 'stats') return statsText();

  if (!process.env.GITHUB_TOKEN) {
    return 'Нет GITHUB_TOKEN — управлять сбором не могу, только показывать статистику.';
  }

  if (action === 'start') {
    const running = await runningCollect();
    if (running) {
      const mins = Math.round((Date.now() - new Date(running.created_at)) / 60000);
      return `Сбор уже идёт — запущен ${mins} мин назад.\n${running.html_url}`;
    }
    const res = await gh(`/actions/workflows/${WORKFLOW}/dispatches`, {
      method: 'POST',
      body: JSON.stringify({ ref: 'main', inputs: { requests: '1500', ask: '10' } }),
    });
    return res.ok
      ? 'Сбор запущен. Отчёт придёт, когда порция досчитается.'
      : `Не удалось запустить: ${res.status} ${(await res.text()).slice(0, 120)}`;
  }

  if (action === 'stop') {
    const running = await runningCollect();
    if (!running) return 'Сбор сейчас не идёт.';
    const res = await gh(`/actions/runs/${running.id}/cancel`, { method: 'POST' });
    // Собранное не пропадёт: снапшот пишется по ходу прогона.
    return res.ok ? 'Сбор останавливается. Уже собранное сохранено.' : `Не удалось остановить: ${res.status}`;
  }

  return 'Неизвестная команда.';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('ok');

  // Telegram подписывает запросы секретом — чужие сюда не достучатся.
  const secret = req.headers['x-telegram-bot-api-secret-token'];
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).send('unauthorized');
  }

  const update = req.body ?? {};
  const allowed = String(process.env.TELEGRAM_CHAT_ID ?? '');

  try {
    if (update.message?.text) {
      const chatId = String(update.message.chat.id);
      if (allowed && chatId !== allowed) return res.status(200).send('ok');
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          '<b>Сбор статистики Dota 2</b>\n\n' +
          'Управление сбором матчей для приложения.\n' +
          'Уведомления о старте и завершении приходят сюда же.',
        parse_mode: 'HTML',
        reply_markup: MENU,
      });
    } else if (update.callback_query) {
      const q = update.callback_query;
      const chatId = String(q.message.chat.id);
      if (allowed && chatId !== allowed) {
        await tg('answerCallbackQuery', { callback_query_id: q.id, text: 'Нет доступа' });
        return res.status(200).send('ok');
      }
      // Отвечаем сразу, иначе Telegram крутит часики у кнопки.
      await tg('answerCallbackQuery', { callback_query_id: q.id });
      const text = await handleAction(q.data, chatId);
      await tg('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: MENU,
        disable_web_page_preview: true,
      });
    }
  } catch (e) {
    console.error('telegram handler:', e);
  }

  return res.status(200).send('ok');
}
