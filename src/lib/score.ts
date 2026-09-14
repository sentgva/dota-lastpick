import type {
  Bracket,
  CounterBreakdown,
  Hero,
  Matchup,
  Suggestion,
  SynergyBreakdown,
  Weights,
} from '../types';
import { comboFor, shortName } from '../data/synergy';

export const DEFAULT_WEIGHTS: Weights = { counter: 1, synergy: 0.5, meta: 0.8 };

/**
 * Насколько сильно доверять выборке матчапа. Игр меньше SHRINK — вклад
 * пропорционально режется, чтобы редкие пары не выносили топ.
 */
const SHRINK = 300;

/** Базовый винрейт героя в выбранной скобке ранга, %. */
export function baseWinrate(hero: Hero, bracket: Bracket | 'all'): number {
  let picks = 0;
  let wins = 0;
  const brackets: Bracket[] = bracket === 'all' ? [1, 2, 3, 4, 5, 6, 7, 8] : [bracket];
  for (const b of brackets) {
    picks += (hero[`${b}_pick`] as number | undefined) ?? 0;
    wins += (hero[`${b}_win`] as number | undefined) ?? 0;
  }
  if (picks < 100) {
    // В узкой скобке данных может не хватить — падаем на общую статистику.
    if (bracket !== 'all') return baseWinrate(hero, 'all');
    return 50;
  }
  return (wins / picks) * 100;
}

/** Популярность героя в скобке (доля пиков), нужна только для сортировки списков. */
export function pickCount(hero: Hero, bracket: Bracket | 'all'): number {
  const brackets: Bracket[] = bracket === 'all' ? [1, 2, 3, 4, 5, 6, 7, 8] : [bracket];
  return brackets.reduce((sum, b) => sum + ((hero[`${b}_pick`] as number | undefined) ?? 0), 0);
}

/**
 * Преимущество кандидата над врагом.
 * matchup взят из /heroes/{enemy}/matchups, поэтому wins — победы ВРАГА.
 * Из сырого винрейта вычитаем ожидаемый, иначе сильные герои патча
 * выглядели бы контрпиком вообще ко всему.
 */
function advantage(
  candidate: Hero,
  enemy: Hero,
  matchup: Matchup,
  bracket: Bracket | 'all',
): CounterBreakdown {
  const games = matchup.games_played;
  const winrate = games > 0 ? (1 - matchup.wins / games) * 100 : 50;
  const expected = 50 + (baseWinrate(candidate, bracket) - baseWinrate(enemy, bracket)) / 2;
  const confidence = games / (games + SHRINK);
  return {
    enemy,
    winrate,
    advantage: (winrate - expected) * confidence,
    games,
  };
}

/** Ролевой профиль команды союзников — чего не хватает. */
function roleGaps(allies: Hero[]): { role: string; value: number }[] {
  if (allies.length === 0) return [];
  const count = (role: string) => allies.filter((a) => a.roles.includes(role)).length;
  const gaps: { role: string; value: number }[] = [];
  if (count('Carry') === 0) gaps.push({ role: 'Carry', value: 4 });
  if (count('Support') < 2) gaps.push({ role: 'Support', value: 3 });
  if (count('Initiator') === 0) gaps.push({ role: 'Initiator', value: 3 });
  if (count('Disabler') === 0) gaps.push({ role: 'Disabler', value: 2 });
  if (count('Durable') === 0) gaps.push({ role: 'Durable', value: 1 });
  return gaps;
}

/** Не хватает ли команде магического или физического урона. */
function damageGap(allies: Hero[], candidate: Hero): { value: number; note: string } | null {
  if (allies.length < 3) return null;
  const magical = allies.filter((a) => a.primary_attr === 'int').length;
  const physical = allies.filter((a) => a.primary_attr === 'agi' || a.primary_attr === 'str').length;
  if (magical === 0 && candidate.primary_attr === 'int') {
    return { value: 2, note: 'у команды нет магического урона' };
  }
  if (physical === 0 && (candidate.primary_attr === 'agi' || candidate.primary_attr === 'str')) {
    return { value: 2, note: 'у команды нет физического урона' };
  }
  return null;
}

export interface ScoreInput {
  heroes: Hero[];
  enemies: Hero[];
  allies: Hero[];
  /** enemy.id -> его матчапы */
  matchups: Map<number, Matchup[]>;
  bracket: Bracket | 'all';
  weights: Weights;
  /** Необязательный фильтр: показывать только героев с этой ролью. */
  roleFilter?: string | null;
}

export function buildSuggestions(input: ScoreInput): Suggestion[] {
  const { heroes, enemies, allies, matchups, bracket, weights, roleFilter } = input;

  const taken = new Set([...enemies, ...allies].map((h) => h.id));
  const gaps = roleGaps(allies);

  // Плоский доступ: enemyId -> (candidateId -> matchup)
  const byEnemy = new Map<number, Map<number, Matchup>>();
  for (const [enemyId, list] of matchups) {
    byEnemy.set(enemyId, new Map(list.map((m) => [m.hero_id, m])));
  }

  const suggestions: Suggestion[] = [];

  for (const candidate of heroes) {
    if (taken.has(candidate.id)) continue;
    if (roleFilter && !candidate.roles.includes(roleFilter)) continue;

    // 1. Контрпик: среднее преимущество против выбранных врагов.
    const counters: CounterBreakdown[] = [];
    for (const enemy of enemies) {
      const m = byEnemy.get(enemy.id)?.get(candidate.id);
      if (!m) continue;
      counters.push(advantage(candidate, enemy, m, bracket));
    }
    const counterScore = counters.length
      ? counters.reduce((s, c) => s + c.advantage, 0) / counters.length
      : 0;

    // 2. Синергия: курируемые комбо + закрытие ролевых дыр.
    const synergies: SynergyBreakdown[] = [];
    let comboSum = 0;
    for (const ally of allies) {
      const combo = comboFor(shortName(candidate.name), shortName(ally.name));
      if (!combo) continue;
      comboSum += combo.value;
      synergies.push({ ally, value: combo.value, reason: combo.reason });
    }

    let roleBonus = 0;
    const roleNotes: string[] = [];
    for (const gap of gaps) {
      if (candidate.roles.includes(gap.role)) {
        roleBonus += gap.value;
        roleNotes.push(`закрывает роль ${gap.role}`);
      }
    }
    const dmg = damageGap(allies, candidate);
    if (dmg) {
      roleBonus += dmg.value;
      roleNotes.push(dmg.note);
    }

    const synergyScore = (comboSum + roleBonus) / 2;

    // 3. Мета: отклонение базового винрейта от 50% в выбранной скобке.
    const metaScore = baseWinrate(candidate, bracket) - 50;

    suggestions.push({
      hero: candidate,
      score:
        weights.counter * counterScore + weights.synergy * synergyScore + weights.meta * metaScore,
      counterScore,
      synergyScore,
      metaScore,
      counters: counters.sort((a, b) => b.advantage - a.advantage),
      synergies: synergies.sort((a, b) => b.value - a.value),
      roleNote: roleNotes.length ? roleNotes.join(', ') : undefined,
    });
  }

  return suggestions.sort((a, b) => b.score - a.score);
}
