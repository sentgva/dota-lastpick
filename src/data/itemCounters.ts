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
    label: 'невидимость',
    heroes: [
      'riki', 'bounty_hunter', 'clinkz', 'nyx_assassin', 'weaver', 'templar_assassin',
      'invoker', 'mirana', 'sand_king', 'slark', 'phantom_assassin', 'treant', 'broodmother',
    ],
    items: [
      { item: 'ward_sentry', reason: 'вижн против инвиза', weight: 5 },
      { item: 'dust', reason: 'снимает невидимость в драке', weight: 4 },
      { item: 'gem', reason: 'постоянный детект, если инвиз ключевой', weight: 2 },
    ],
  },
  {
    id: 'heal',
    label: 'хил и реген',
    heroes: [
      'huskar', 'necrolyte', 'alchemist', 'abaddon', 'dazzle', 'omniknight', 'treant',
      'oracle', 'life_stealer', 'wraith_king', 'skeleton_king', 'undying', 'bloodseeker',
    ],
    items: [
      { item: 'spirit_vessel', reason: 'режет хил и реген', weight: 5 },
      { item: 'shivas_guard', reason: 'массовый минус к хилу и скорости атаки', weight: 3 },
    ],
  },
  {
    id: 'illusions',
    label: 'иллюзии и суммоны',
    heroes: [
      'phantom_lancer', 'naga_siren', 'chaos_knight', 'terrorblade', 'meepo',
      'broodmother', 'lycan', 'beastmaster', 'enigma', 'furion', 'visage', 'arc_warden',
    ],
    items: [
      { item: 'mjollnir', reason: 'молнии выносят иллюзии и суммонов', weight: 4 },
      { item: 'shivas_guard', reason: 'AoE-урон и минус скорость атаки по пачке', weight: 4 },
      { item: 'radiance', reason: 'постоянный AoE-урон по иллюзиям', weight: 3 },
      { item: 'battle_fury', reason: 'сплэш по клонам, если вы керри с рукой', weight: 2 },
    ],
  },
  {
    id: 'burst_magic',
    label: 'магический бёрст',
    heroes: [
      'lina', 'lion', 'zuus', 'leshrac', 'tinker', 'invoker', 'skywrath_mage', 'pugna',
      'queenofpain', 'nevermore', 'storm_spirit', 'puck', 'jakiro', 'silencer', 'grimstroke',
    ],
    items: [
      { item: 'pipe', reason: 'щит от магии на всю команду', weight: 5 },
      { item: 'eternal_shroud', reason: 'резист к магии и барьер из полученного урона', weight: 4 },
      { item: 'hood_of_defiance', reason: 'ранний резист к магии', weight: 3 },
      { item: 'black_king_bar', reason: 'иммунитет к заклинаниям в драке', weight: 4 },
    ],
  },
  {
    id: 'right_click',
    label: 'сильная правая рука',
    heroes: [
      'sniper', 'drow_ranger', 'phantom_assassin', 'juggernaut', 'troll_warlord', 'ursa',
      'anti_mage', 'antimage', 'slark', 'morphling', 'gyrocopter', 'luna', 'medusa',
      'templar_assassin', 'monkey_king', 'wraith_king', 'skeleton_king', 'clinkz',
    ],
    items: [
      { item: 'crimson_guard', reason: 'блок физического урона на команду', weight: 5 },
      { item: 'ghost', reason: 'полный иммунитет к физическому урону на 4 секунды', weight: 4 },
      { item: 'heavens_halberd', reason: 'разоружает керри на 4 секунды', weight: 4 },
      { item: 'solar_crest', reason: 'минус броня врагу или плюс себе', weight: 2 },
      { item: 'assault', reason: 'плюс броня команде', weight: 3 },
    ],
  },
  {
    id: 'evasion',
    label: 'уклонение и промахи',
    heroes: ['phantom_assassin', 'brewmaster', 'windrunner', 'riki', 'faceless_void'],
    items: [
      { item: 'monkey_king_bar', reason: 'снимает уклонение', weight: 5 },
      { item: 'bloodthorn', reason: 'гарантированные попадания и сайленс', weight: 3 },
      { item: 'witch_blade', reason: 'ранний ответ на уклонение', weight: 2 },
    ],
  },
  {
    id: 'lockdown',
    label: 'длинный контроль',
    heroes: [
      'faceless_void', 'enigma', 'tidehunter', 'magnataur', 'shadow_shaman', 'lion',
      'sand_king', 'bane', 'disruptor', 'warlock', 'winter_wyvern', 'legion_commander',
    ],
    items: [
      { item: 'black_king_bar', reason: 'единственный надёжный ответ на цепочку контроля', weight: 6 },
      { item: 'aeon_disk', reason: 'спасает от фокуса и снимает контроль', weight: 4 },
      { item: 'lotus_orb', reason: 'отражает направленные заклинания', weight: 3 },
      { item: 'cyclone', reason: 'снимает сайленс и вытаскивает из комбо', weight: 3 },
    ],
  },
  {
    id: 'silence',
    label: 'сайленс и подавление',
    heroes: ['silencer', 'death_prophet', 'disruptor', 'skywrath_mage', 'night_stalker', 'riki', 'doom_bringer'],
    items: [
      { item: 'cyclone', reason: 'снимает сайленс с себя', weight: 4 },
      { item: 'manta', reason: 'сбрасывает сайленс и дебаффы', weight: 4 },
      { item: 'sphere', reason: 'блокирует первый направленный спелл', weight: 3 },
    ],
  },
  {
    id: 'passive',
    label: 'ключевые пассивки',
    heroes: [
      'phantom_assassin', 'bristleback', 'spectre', 'ursa', 'juggernaut', 'huskar',
      'tidehunter', 'centaur', 'templar_assassin', 'razor', 'medusa', 'axe',
    ],
    items: [
      { item: 'silver_edge', reason: 'отключает пассивку на 5 секунд', weight: 4 },
      { item: 'nullifier', reason: 'снимает баффы и не даёт отхилиться', weight: 3 },
    ],
  },
  {
    id: 'blink_gap',
    label: 'резкое сближение',
    heroes: ['storm_spirit', 'queenofpain', 'antimage', 'anti_mage', 'ember_spirit', 'puck', 'void_spirit', 'slark'],
    items: [
      { item: 'sheepstick', reason: 'ловит прыгунов и отключает мобильность', weight: 4 },
      { item: 'orchid', reason: 'сайленс не даёт уйти прыжком', weight: 3 },
      { item: 'rod_of_atos', reason: 'рут против мобильных целей', weight: 3 },
    ],
  },
  {
    id: 'mana_burn',
    label: 'сжигание маны',
    heroes: ['antimage', 'anti_mage', 'nyx_assassin', 'invoker', 'lion', 'pugna', 'keeper_of_the_light'],
    items: [{ item: 'soul_ring', reason: 'ман-пул страдает, нужен дополнительный источник', weight: 2 }],
  },
];

/** Конкретные герои, против которых есть точечный ответ. */
export const HERO_RULES: Record<string, ItemRule[]> = {
  huskar: [{ item: 'heavens_halberd', reason: 'разоружает Huskar в его окне', weight: 5 }],
  bristleback: [{ item: 'silver_edge', reason: 'отключает Bristleback и делает его уязвимым', weight: 5 }],
  medusa: [{ item: 'diffusal_blade', reason: 'сжигает ману и снимает Mana Shield', weight: 4 }],
  spectre: [{ item: 'silver_edge', reason: 'выключает Dispersion', weight: 4 }],
  tinker: [{ item: 'ward_sentry', reason: 'блок телепорта в лес рядом с базой', weight: 3 }],
  broodmother: [{ item: 'ward_sentry', reason: 'блок паутины и вижн на линии', weight: 4 }],
  omniknight: [{ item: 'nullifier', reason: 'снимает Repel с керри', weight: 4 }],
  dazzle: [{ item: 'ancient_janggo', reason: 'нужен бёрст после окончания Grave', weight: 2 }],
  axe: [{ item: 'sphere', reason: 'блокирует Culling Blade и Call', weight: 3 }],
  legion_commander: [{ item: 'sphere', reason: 'блокирует Duel', weight: 5 }],
  doom_bringer: [{ item: 'sphere', reason: 'блокирует Doom', weight: 4 }],
  bane: [{ item: 'sphere', reason: 'блокирует Fiend\'s Grip', weight: 4 }],
  lion: [{ item: 'sphere', reason: 'блокирует Finger of Death и Hex', weight: 3 }],
  pudge: [{ item: 'force_staff', reason: 'вытаскивает союзника из-под Dismember', weight: 3 }],
  necrolyte: [{ item: 'spirit_vessel', reason: 'режет хил Heartstopper и Reaper\'s Scythe', weight: 5 }],
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
