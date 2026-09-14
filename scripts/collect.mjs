/**
 * Сборщик собственной статистики матчапов и синергии.
 *
 * Зачем: матчапы OpenDota считаются по распарсенным матчам — на пару героев
 * там 20–120 игр, то есть погрешность ±9…±21 п.п. Здесь мы агрегируем сырые
 * публичные матчи сами, и объём растёт с каждым запуском.
 *
 * Запуск:
 *   node scripts/collect.mjs --requests=200            # OpenDota, ~20k матчей
 *   node scripts/collect.mjs --source=steam --requests=500
 *
 * Снапшот дописывается в public/stats.json — запуски накапливаются.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/stats.json');

// Ключи лежат в .env (он в .gitignore). В GitHub Actions переменные приходят из секретов.
try {
  const env = readFileSync(resolve(ROOT, '.env'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {
  /* .env не обязателен */
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

const SOURCE = args.source ?? 'opendota';
const REQUESTS = Number(args.requests ?? 100);
/** Steam отдаёт 429 при частых запросах, поэтому держим паузу между ними. */
const DELAY_MS = Number(args.delay ?? 1100);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Режимы, где драфт осмысленный: All Pick, Captains Mode, Random/Single Draft,
 * Captains Draft, Ranked All Pick. Турбо (23) и Ability Draft (18) исключены —
 * там другая мета. В потоке Steam на эти режимы приходится около 60% матчей.
 */
const GOOD_MODES = new Set([1, 2, 3, 4, 16, 22]);

function loadSnapshot() {
  try {
    const s = JSON.parse(readFileSync(OUT, 'utf8'));
    console.log(`снапшот: ${s.matches.toLocaleString('ru')} матчей, обновлён ${s.updated}`);
    return s;
  } catch {
    console.log('снапшот не найден, начинаем с нуля');
    return {
      version: 3,
      updated: null,
      matches: 0,
      sources: {},
      cursor: {},
      matchup: {},
      synergy: {},
      items: {},
      vsItems: {},
    };
  }
}

/** matchup[a][b] = [игр, побед a] — хранится в обе стороны для быстрого чтения. */
function bump(table, a, b, win) {
  const row = (table[a] ??= {});
  const cell = (row[b] ??= [0, 0]);
  cell[0] += 1;
  if (win) cell[1] += 1;
}

function ingest(snap, match) {
  snap.items ??= {};
  snap.vsItems ??= {};
  const R = match.radiant;
  const D = match.dire;
  if (R.length !== 5 || D.length !== 5) return false;
  if (R.some((h) => !h) || D.some((h) => !h)) return false;
  if (new Set([...R, ...D]).size !== 10) return false;

  snap.matches += 1;
  const radiantWon = match.radiantWin;

  for (const a of R) {
    for (const b of D) {
      bump(snap.matchup, a, b, radiantWon);
      bump(snap.matchup, b, a, !radiantWon);
    }
  }
  for (const [team, won] of [
    [R, radiantWon],
    [D, !radiantWon],
  ]) {
    for (let i = 0; i < 5; i++) {
      for (let k = i + 1; k < 5; k++) {
        bump(snap.synergy, team[i], team[k], won);
        bump(snap.synergy, team[k], team[i], won);
      }
    }
  }
  // Финальные предметы героя: сколько раз собран и сколько с ним выиграно.
  // Стартовых закупов в Steam API нет — только инвентарь на момент конца матча.
  for (const p of match.players ?? []) {
    if (!p.hero || !p.items?.length) continue;
    const row = (snap.items[p.hero] ??= {});
    for (const item of new Set(p.items)) {
      if (!item) continue;
      const cell = (row[item] ??= [0, 0]);
      cell[0] += 1;
      if (p.won) cell[1] += 1;
    }
  }

  // Что собирали ПРОТИВ каждого героя те, кто выиграл. Курируемые правила
  // («против невидимости — сентри») так заменяются фактическими данными.
  const losers = radiantWon ? D : R;
  for (const p of match.players ?? []) {
    if (!p.won || !p.hero || !p.items?.length) continue;
    for (const enemy of losers) {
      const entry = (snap.vsItems[enemy] ??= { games: 0, items: {} });
      // games считаем один раз на игрока-победителя, а не на предмет
      entry.games += 1;
      for (const item of new Set(p.items)) {
        if (!item) continue;
        entry.items[item] = (entry.items[item] ?? 0) + 1;
      }
    }
  }
  return true;
}

/** OpenDota: компактно (100 матчей ≈ 20 КБ), но лимит 2000 запросов в сутки. */
async function* fromOpenDota(startCursor) {
  let cursor = startCursor ?? null;
  for (let i = 0; i < REQUESTS; i++) {
    const url = 'https://api.opendota.com/api/publicMatches' + (cursor ? `?less_than_match_id=${cursor}` : '');
    const res = await fetch(url);
    if (res.status === 429) {
      console.log('лимит запросов OpenDota — останавливаемся');
      return;
    }
    if (!res.ok) {
      console.log(`OpenDota ${res.status} — останавливаемся`);
      return;
    }
    const page = await res.json();
    if (!Array.isArray(page) || page.length === 0) return;
    cursor = Math.min(...page.map((m) => m.match_id));

    for (const m of page) {
      if (!GOOD_MODES.has(m.game_mode)) continue;
      if (m.duration < 600) continue;
      yield {
        radiant: m.radiant_team ?? [],
        dire: m.dire_team ?? [],
        radiantWin: m.radiant_win,
      };
    }
    yield { cursor };
  }
}

/**
 * Steam Web API: 100 матчей за запрос, лимит 100k запросов в сутки, и можно
 * идти назад по истории, а не ждать накопления. Нужен бесплатный ключ
 * https://steamcommunity.com/dev/apikey в переменной STEAM_API_KEY.
 */
async function* fromSteam(startCursor) {
  const key = process.env.STEAM_API_KEY;
  if (!key) throw new Error('Нужен STEAM_API_KEY (см. https://steamcommunity.com/dev/apikey)');

  // Без курсора Steam отдаёт матчи с 2011 года, поэтому стартуем от свежего
  // номера последовательности и отступаем назад: ~1.7 млн матчей в сутки.
  let seq = startCursor ?? null;
  if (!seq) {
    const head = await fetch(
      `https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1/?key=${key}&matches_requested=1`,
    );
    const latest = (await head.json())?.result?.matches?.[0]?.match_seq_num;
    if (!latest) throw new Error('Не удалось получить свежий match_seq_num');
    const daysBack = Number(args['days-back'] ?? 3);
    seq = latest - Math.round(daysBack * 1_700_000);
    console.log(`старт с seq ${seq.toLocaleString('ru')} (${daysBack} дн. назад от ${latest.toLocaleString('ru')})`);
  }

  for (let i = 0; i < REQUESTS; i++) {
    const url = new URL('https://api.steampowered.com/IDOTA2Match_570/GetMatchHistoryBySequenceNum/v1/');
    url.searchParams.set('key', key);
    url.searchParams.set('matches_requested', '100');
    if (seq) url.searchParams.set('start_at_match_seq_num', String(seq));

    // 429 — не повод бросать сбор: ждём и повторяем тот же запрос.
    let res = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      if (attempt > 0) await sleep(5000 * attempt);
      res = await fetch(url);
      if (res.status !== 429) break;
    }
    if (!res || !res.ok) {
      console.log(`Steam ${res?.status ?? 'нет ответа'} — останавливаемся на ${i} запросе`);
      return;
    }
    if (i > 0 && i % 100 === 0) {
      console.log(`  … ${i} запросов, ${snap.matches.toLocaleString('ru')} матчей`);
    }
    await sleep(DELAY_MS);
    const body = await res.json();
    const matches = body?.result?.matches ?? [];
    if (matches.length === 0) return;
    seq = matches[matches.length - 1].match_seq_num + 1;

    for (const m of matches) {
      if (!GOOD_MODES.has(m.game_mode)) continue;
      if (m.duration < 600) continue;
      const radiant = [];
      const dire = [];
      const players = [];
      for (const p of m.players ?? []) {
        // player_slot < 128 — Radiant, иначе Dire
        const isRadiant = p.player_slot < 128;
        (isRadiant ? radiant : dire).push(p.hero_id);
        players.push({
          hero: p.hero_id,
          won: isRadiant === m.radiant_win,
          items: [p.item_0, p.item_1, p.item_2, p.item_3, p.item_4, p.item_5].filter(Boolean),
        });
      }
      yield { radiant, dire, radiantWin: m.radiant_win, players };
    }
    yield { cursor: seq };
  }
}

const snap = loadSnapshot();
const before = snap.matches;
const t0 = Date.now();

/** Длинный прогон не должен пропадать при обрыве — пишем снапшот по ходу. */
function save() {
  snap.updated = new Date().toISOString();
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(snap));
}
process.on('SIGINT', () => {
  save();
  console.log('прервано — снапшот сохранён');
  process.exit(0);
});

const stream = SOURCE === 'steam' ? fromSteam(snap.cursor?.steam) : fromOpenDota(snap.cursor?.opendota);
let taken = 0;
for await (const item of stream) {
  if (item.cursor !== undefined) {
    snap.cursor[SOURCE] = item.cursor;
    continue;
  }
  if (ingest(snap, item)) taken += 1;
  if (taken > 0 && taken % 20000 === 0) {
    save();
    console.log(`  … ${snap.matches.toLocaleString('ru')} матчей, снапшот сохранён`);
  }
}

snap.updated = new Date().toISOString();
snap.sources[SOURCE] = (snap.sources[SOURCE] ?? 0) + taken;

const games = Object.values(snap.matchup).flatMap((row) => Object.values(row).map((c) => c[0]));
const avg = games.length ? games.reduce((a, b) => a + b, 0) / games.length : 0;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(snap));

const secs = (Date.now() - t0) / 1000;
const kb = (readFileSync(OUT).length / 1024).toFixed(0);
console.log(`добавлено матчей: ${taken.toLocaleString('ru')} за ${secs.toFixed(0)} с`);
console.log(`всего в снапшоте: ${snap.matches.toLocaleString('ru')} (было ${before.toLocaleString('ru')})`);
const itemRows = Object.values(snap.items ?? {}).reduce((n, row) => n + Object.keys(row).length, 0);
console.log(`пар в матрице: ${Object.keys(snap.matchup).length} героев, в среднем ${avg.toFixed(0)} игр на пару`);
const vsRows = Object.values(snap.vsItems ?? {}).reduce((n, e) => n + Object.keys(e.items).length, 0);
console.log(`статистика предметов: ${Object.keys(snap.items ?? {}).length} героев, ${itemRows.toLocaleString('ru')} записей`);
console.log(`предметы против героев: ${Object.keys(snap.vsItems ?? {}).length} героев, ${vsRows.toLocaleString('ru')} записей`);
console.log(`файл: ${OUT} — ${kb} КБ`);
