/**
 * Курируемые комбо. У OpenDota нет публичного эндпоинта синергии пар
 * (только матчапы «герой против героя»), поэтому эта часть — знание о игре,
 * а не статистика. Файл намеренно плоский, чтобы его было легко дополнять.
 *
 * Ключ героя = hero.name без префикса npc_dota_hero_ (например "magnataur").
 * value: вклад в очках (примерно в тех же единицах, что и п.п. преимущества).
 */

export interface ComboRule {
  a: string;
  b: string;
  value: number;
  reason: string;
}

/** Порядок в паре не важен — сопоставление идёт в обе стороны. */
export const COMBOS: ComboRule[] = [
  // Сетапы под AoE-ульты
  { a: 'magnataur', b: 'sven', value: 6, reason: 'RP собирает пачку под God\'s Strength' },
  { a: 'magnataur', b: 'juggernaut', value: 5, reason: 'RP под Omnislash' },
  { a: 'magnataur', b: 'luna', value: 5, reason: 'RP под Eclipse' },
  { a: 'magnataur', b: 'invoker', value: 5, reason: 'RP под Sunstrike/Chaos Meteor' },
  { a: 'magnataur', b: 'earthshaker', value: 5, reason: 'RP + Echo Slam' },
  { a: 'enigma', b: 'earthshaker', value: 5, reason: 'Black Hole + Echo Slam' },
  { a: 'enigma', b: 'lina', value: 4, reason: 'Black Hole под Light Strike Array' },
  { a: 'enigma', b: 'leshrac', value: 4, reason: 'Black Hole под Pulse Nova' },
  { a: 'faceless_void', b: 'invoker', value: 5, reason: 'Chronosphere под комбо Invoker' },
  { a: 'faceless_void', b: 'disruptor', value: 5, reason: 'Chrono + Static Storm' },
  { a: 'faceless_void', b: 'lina', value: 4, reason: 'Chrono даёт бесплатный каст Laguna' },
  { a: 'dark_seer', b: 'leshrac', value: 5, reason: 'Vacuum + Wall под Pulse Nova' },
  { a: 'dark_seer', b: 'enigma', value: 5, reason: 'Vacuum собирает пачку под Black Hole' },
  { a: 'dark_seer', b: 'sand_king', value: 5, reason: 'Vacuum + Epicenter' },
  { a: 'naga_siren', b: 'leshrac', value: 6, reason: 'Song of the Siren даёт свободный сетап' },
  { a: 'naga_siren', b: 'enigma', value: 6, reason: 'Song + Black Hole' },
  { a: 'naga_siren', b: 'sand_king', value: 5, reason: 'Song + Epicenter' },
  { a: 'tidehunter', b: 'lina', value: 4, reason: 'Ravage держит цели под спеллы' },
  { a: 'tidehunter', b: 'lich', value: 4, reason: 'Ravage + Chain Frost' },
  { a: 'tidehunter', b: 'magnataur', value: 4, reason: 'Двойной массовый контроль' },
  { a: 'kunkka', b: 'tidehunter', value: 4, reason: 'Torrent/X + Ravage' },
  { a: 'kunkka', b: 'magnataur', value: 4, reason: 'RP держит пачку под Ghost Ship' },
  { a: 'warlock', b: 'enigma', value: 4, reason: 'Chaotic Offering + Black Hole' },
  { a: 'shadow_demon', b: 'lina', value: 4, reason: 'Disruption/Soul Catcher усиливают бёрст' },
  { a: 'shadow_demon', b: 'lion', value: 4, reason: 'Soul Catcher под Finger of Death' },

  // Сейв и баф керри
  { a: 'omniknight', b: 'sven', value: 5, reason: 'Repel и хил под физический керри' },
  { a: 'omniknight', b: 'ursa', value: 5, reason: 'Repel позволяет Ursa стоять в драке' },
  { a: 'dazzle', b: 'ursa', value: 5, reason: 'Shallow Grave вытягивает агрессивные заходы' },
  { a: 'dazzle', b: 'life_stealer', value: 4, reason: 'Grave + Weave под ближний керри' },
  { a: 'oracle', b: 'ursa', value: 5, reason: 'False Promise удваивает окно керри' },
  { a: 'oracle', b: 'juggernaut', value: 4, reason: 'False Promise под Omnislash' },
  { a: 'winter_wyvern', b: 'phantom_assassin', value: 4, reason: 'Cold Embrace держит керри в драке' },
  { a: 'abaddon', b: 'phantom_assassin', value: 4, reason: 'Aphotic Shield снимает контроль с керри' },
  { a: 'crystal_maiden', b: 'ursa', value: 4, reason: 'Аура маны кормит агрессивный лес и рошана' },
  { a: 'crystal_maiden', b: 'juggernaut', value: 3, reason: 'Аура маны и замедление на линии' },
  // Внутреннее имя Io в Dota — wisp, Clockwerk — rattletrap.
  { a: 'wisp', b: 'gyrocopter', value: 6, reason: 'Relocate + Call Down — классический ганк' },
  { a: 'wisp', b: 'chaos_knight', value: 5, reason: 'Tether и реген под заход иллюзиями' },
  { a: 'wisp', b: 'tiny', value: 5, reason: 'Relocate + Toss с ходу' },
  { a: 'shadow_shaman', b: 'lycan', value: 4, reason: 'Пуш вардами вместе с волками' },
  { a: 'undying', b: 'lycan', value: 4, reason: 'Tombstone + пуш — мощный темп' },

  // Аура- и позиционные связки
  { a: 'drow_ranger', b: 'sniper', value: 4, reason: 'Precision Aura бустит дальнобойную линию' },
  { a: 'drow_ranger', b: 'clinkz', value: 4, reason: 'Аура на дальнобойного керри' },
  { a: 'drow_ranger', b: 'windrunner', value: 3, reason: 'Аура на дальнобойного мида' },
  { a: 'vengefulspirit', b: 'sniper', value: 4, reason: 'Vengeance Aura + Swap спасает хрупкого керри' },
  { a: 'vengefulspirit', b: 'drow_ranger', value: 4, reason: 'Минус броня и аура урона' },
  { a: 'beastmaster', b: 'sniper', value: 3, reason: 'Inner Beast ускоряет атаку дальнобойных' },
  { a: 'treant', b: 'phantom_assassin', value: 3, reason: 'Living Armor держит керри и вышки' },

  // Бёрст и пик-офф
  { a: 'lion', b: 'lina', value: 3, reason: 'Двойной бёрст снимает саппортов с ходу' },
  { a: 'zuus', b: 'ancient_apparition', value: 4, reason: 'Ice Blast + добивание магией' },
  { a: 'ancient_apparition', b: 'lich', value: 3, reason: 'Ice Blast режет хил и добивает' },
  { a: 'pudge', b: 'rattletrap', value: 4, reason: 'Cogs фиксируют цель под Hook' },
  { a: 'pudge', b: 'shadow_demon', value: 4, reason: 'Disruption задаёт цель под Hook' },
  { a: 'nyx_assassin', b: 'zuus', value: 3, reason: 'Mana Burn и вижн под бёрст' },

  // Пуш и сплит
  { a: 'chen', b: 'lycan', value: 5, reason: 'Ранний пуш связкой крипов и волков' },
  { a: 'enchantress', b: 'lycan', value: 4, reason: 'Ранний пуш вышек' },
  { a: 'furion', b: 'lycan', value: 4, reason: 'Глобальный сплит-пуш' },
  { a: 'pugna', b: 'furion', value: 4, reason: 'Nether Ward и деревья сносят вышки' },

  // Иллюзии и суммоны под баффы
  { a: 'chaos_knight', b: 'shadow_demon', value: 5, reason: 'Disruption удваивает иллюзии' },
  { a: 'chaos_knight', b: 'legion_commander', value: 4, reason: 'Иллюзии + Duel с Overwhelming Odds' },
  { a: 'phantom_lancer', b: 'shadow_demon', value: 4, reason: 'Disruption множит иллюзии' },
  { a: 'legion_commander', b: 'disruptor', value: 5, reason: 'Kinetic Field гарантирует Duel' },
  { a: 'legion_commander', b: 'shadow_demon', value: 4, reason: 'Disruption гарантирует Duel' },
];

/** Быстрый индекс: "a|b" (отсортированная пара) -> правило. */
const index = new Map<string, ComboRule>();
for (const c of COMBOS) {
  index.set([c.a, c.b].sort().join('|'), c);
}

export function comboFor(shortNameA: string, shortNameB: string): ComboRule | undefined {
  return index.get([shortNameA, shortNameB].sort().join('|'));
}

/** npc_dota_hero_antimage -> antimage */
export function shortName(heroName: string): string {
  return heroName.replace('npc_dota_hero_', '');
}
