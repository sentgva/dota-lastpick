/**
 * Что покупать против вражеского драфта. Правила курируемые: OpenDota не
 * отдаёт «предметы против героя», только популярность закупа у самого героя.
 *
 * Ключи предметов совпадают с ключами /api/constants/items.
 * Ключи героев — hero.name без npc_dota_hero_.
 */

export interface ItemRule {
  item: string;
  reason: string;
  /** Вес вклада; при совпадении нескольких врагов веса складываются. */
  weight: number;
}

/** Категории врагов: список героев -> какие предметы против них нужны. */
interface Category {
  id: string;
  label: string;
  heroes: string[];
  items: ItemRule[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'invis',
    label: 'Invisibility',
    heroes: [
      'riki', 'bounty_hunter', 'clinkz', 'nyx_assassin', 'weaver', 'templar_assassin',
      'invoker', 'mirana', 'sand_king', 'slark', 'phantom_assassin', 'treant', 'broodmother',
    ],
    items: [
      { item: 'ward_sentry', reason: 'Vision against invisibility', weight: 5 },
      { item: 'dust', reason: 'Reveals invisible heroes in fights', weight: 4 },
      { item: 'gem', reason: 'Permanent detection when invisibility is central', weight: 2 },
    ],
  },
  {
    id: 'heal',
    label: 'Healing',
    heroes: [
      'huskar', 'necrolyte', 'alchemist', 'abaddon', 'dazzle', 'omniknight', 'treant',
      'oracle', 'life_stealer', 'skeleton_king', 'undying', 'bloodseeker',
    ],
    items: [
      { item: 'spirit_vessel', reason: 'Cuts healing and regeneration', weight: 5 },
      { item: 'shivas_guard', reason: 'Mass healing reduction and attack slow', weight: 3 },
    ],
  },
  {
    id: 'illusions',
    label: 'Illusions',
    heroes: [
      'phantom_lancer', 'naga_siren', 'chaos_knight', 'terrorblade', 'meepo',
      'broodmother', 'lycan', 'beastmaster', 'enigma', 'furion', 'visage', 'arc_warden',
    ],
    items: [
      { item: 'mjollnir', reason: 'Chain lightning clears illusions and summons', weight: 4 },
      { item: 'shivas_guard', reason: 'AoE damage and attack slow on the whole group', weight: 4 },
      { item: 'radiance', reason: 'Constant AoE damage burns illusions down', weight: 3 },
      { item: 'bfury', reason: 'Cleave shreds clones on a right-click carry', weight: 2 },
    ],
  },
  {
    id: 'burst_magic',
    label: 'Magic Burst',
    heroes: [
      'lina', 'lion', 'zuus', 'leshrac', 'tinker', 'invoker', 'skywrath_mage', 'pugna',
      'queenofpain', 'nevermore', 'storm_spirit', 'puck', 'jakiro', 'silencer', 'grimstroke',
    ],
    items: [
      { item: 'pipe', reason: 'Team-wide magic shield', weight: 5 },
      { item: 'eternal_shroud', reason: 'Magic resistance plus a barrier from damage taken', weight: 4 },
      { item: 'hood_of_defiance', reason: 'Early magic resistance', weight: 3 },
      { item: 'black_king_bar', reason: 'Spell immunity for fights', weight: 4 },
    ],
  },
  {
    id: 'right_click',
    label: 'Right-Click',
    heroes: [
      'sniper', 'drow_ranger', 'phantom_assassin', 'juggernaut', 'troll_warlord', 'ursa',
      'antimage', 'slark', 'morphling', 'gyrocopter', 'luna', 'medusa',
      'templar_assassin', 'monkey_king', 'skeleton_king', 'clinkz',
    ],
    items: [
      { item: 'crimson_guard', reason: 'Blocks physical damage for the team', weight: 5 },
      { item: 'ghost', reason: 'Full physical immunity for 4 seconds', weight: 4 },
      { item: 'heavens_halberd', reason: 'Disarms the carry for 4 seconds', weight: 4 },
      { item: 'solar_crest', reason: 'Strips enemy armour or adds your own', weight: 2 },
      { item: 'assault', reason: 'Team-wide armour aura', weight: 3 },
    ],
  },
  {
    id: 'evasion',
    label: 'Evasion',
    heroes: ['phantom_assassin', 'brewmaster', 'windrunner', 'riki', 'faceless_void'],
    items: [
      { item: 'monkey_king_bar', reason: 'Pierces evasion', weight: 5 },
      { item: 'bloodthorn', reason: 'True strike plus silence', weight: 3 },
      { item: 'witch_blade', reason: 'Early answer to evasion', weight: 2 },
    ],
  },
  {
    id: 'lockdown',
    label: 'Lockdown',
    heroes: [
      'faceless_void', 'enigma', 'tidehunter', 'magnataur', 'shadow_shaman', 'lion',
      'sand_king', 'bane', 'disruptor', 'warlock', 'winter_wyvern', 'legion_commander',
    ],
    items: [
      { item: 'black_king_bar', reason: 'The only reliable answer to chain lockdown', weight: 6 },
      { item: 'aeon_disk', reason: 'Saves from focus fire and breaks lockdown', weight: 4 },
      { item: 'lotus_orb', reason: 'Reflects targeted spells', weight: 3 },
      { item: 'cyclone', reason: 'Removes silence and escapes combos', weight: 3 },
    ],
  },
  {
    id: 'silence',
    label: 'Silences',
    heroes: ['silencer', 'death_prophet', 'disruptor', 'skywrath_mage', 'night_stalker', 'riki', 'doom_bringer'],
    items: [
      { item: 'cyclone', reason: 'Dispels silence from yourself', weight: 4 },
      { item: 'manta', reason: 'Clears silences and debuffs', weight: 4 },
      { item: 'sphere', reason: 'Blocks the first targeted spell', weight: 3 },
    ],
  },
  {
    id: 'passive',
    label: 'Key Passives',
    heroes: [
      'phantom_assassin', 'bristleback', 'spectre', 'ursa', 'juggernaut', 'huskar',
      'tidehunter', 'centaur', 'templar_assassin', 'razor', 'medusa', 'axe',
    ],
    items: [
      { item: 'silver_edge', reason: 'Breaks passives for 5 seconds', weight: 4 },
      { item: 'nullifier', reason: 'Strips buffs and stops healing', weight: 3 },
    ],
  },
  {
    id: 'blink_gap',
    label: 'Gap Closers',
    heroes: ['storm_spirit', 'queenofpain', 'antimage', 'ember_spirit', 'puck', 'void_spirit', 'slark'],
    items: [
      { item: 'sheepstick', reason: 'Catches blinkers and shuts down mobility', weight: 4 },
      { item: 'orchid', reason: 'Silence denies the escape blink', weight: 3 },
      { item: 'rod_of_atos', reason: 'Root against mobile targets', weight: 3 },
    ],
  },
  {
    id: 'mana_burn',
    label: 'Mana Burn',
    heroes: ['antimage', 'nyx_assassin', 'invoker', 'lion', 'pugna', 'keeper_of_the_light'],
    items: [{ item: 'soul_ring', reason: 'Extra mana source when your pool is drained', weight: 2 }],
  },
];

/** Конкретные герои, против которых есть точечный ответ. */
export const HERO_RULES: Record<string, ItemRule[]> = {
  huskar: [{ item: 'heavens_halberd', reason: 'Disarms Huskar during his window', weight: 5 }],
  bristleback: [{ item: 'silver_edge', reason: 'Breaks Bristleback and leaves him exposed', weight: 5 }],
  medusa: [{ item: 'diffusal_blade', reason: 'Burns mana and strips Mana Shield', weight: 4 }],
  spectre: [{ item: 'silver_edge', reason: 'Breaks Dispersion', weight: 4 }],
  tinker: [{ item: 'ward_sentry', reason: 'Blocks the jungle teleport spot near base', weight: 3 }],
  broodmother: [{ item: 'ward_sentry', reason: 'Blocks webs and gives lane vision', weight: 4 }],
  omniknight: [{ item: 'nullifier', reason: 'Strips Repel from the carry', weight: 4 }],
  dazzle: [{ item: 'ancient_janggo', reason: 'You need burst the moment Grave expires', weight: 2 }],
  axe: [{ item: 'sphere', reason: 'Blocks Culling Blade and Berserker Call', weight: 3 }],
  legion_commander: [{ item: 'sphere', reason: 'Blocks Duel', weight: 5 }],
  doom_bringer: [{ item: 'sphere', reason: 'Blocks Doom', weight: 4 }],
  bane: [{ item: 'sphere', reason: 'Blocks Fiend Grip', weight: 4 }],
  lion: [{ item: 'sphere', reason: 'Blocks Finger of Death and Hex', weight: 3 }],
  pudge: [{ item: 'force_staff', reason: 'Pulls an ally out of Dismember', weight: 3 }],
  necrolyte: [{ item: 'spirit_vessel', reason: 'Cuts Heartstopper healing and Reaper Scythe', weight: 5 }],
};

export interface AggregatedItem {
  item: string;
  weight: number;
  reasons: string[];
  /** Из-за каких врагов предмет попал в список. */
  triggeredBy: string[];
}

/**
 * Сводит правила по вражескому драфту в один отсортированный список.
 * @param enemyShortNames короткие имена врагов (npc_dota_hero_ уже снят)
 * @param enemyLabels локализованные имена для подписей, в том же порядке
 */
export function counterItems(enemyShortNames: string[], enemyLabels: string[]): AggregatedItem[] {
  const acc = new Map<string, AggregatedItem>();

  const add = (rule: ItemRule, by: string) => {
    const existing = acc.get(rule.item);
    if (existing) {
      existing.weight += rule.weight;
      if (!existing.reasons.includes(rule.reason)) existing.reasons.push(rule.reason);
      if (!existing.triggeredBy.includes(by)) existing.triggeredBy.push(by);
    } else {
      acc.set(rule.item, { item: rule.item, weight: rule.weight, reasons: [rule.reason], triggeredBy: [by] });
    }
  };

  enemyShortNames.forEach((name, i) => {
    const label = enemyLabels[i] ?? name;
    for (const cat of CATEGORIES) {
      if (cat.heroes.includes(name)) {
        for (const rule of cat.items) add(rule, label);
      }
    }
    for (const rule of HERO_RULES[name] ?? []) add(rule, label);
  });

  return [...acc.values()].sort((a, b) => b.weight - a.weight);
}

/** Какие категории сработали на этом драфте — для короткой сводки «чего бояться». */
export function draftThreats(enemyShortNames: string[]): { label: string; heroes: string[] }[] {
  return CATEGORIES.map((cat) => ({
    label: cat.label,
    heroes: enemyShortNames.filter((n) => cat.heroes.includes(n)),
  })).filter((t) => t.heroes.length > 0);
}
