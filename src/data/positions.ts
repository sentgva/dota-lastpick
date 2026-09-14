/**
 * Позиции героев (1–5). В OpenDota их нет — API отдаёт только роли вроде
 * Carry/Durable/Nuker, из которых позицию не вывести: Wraith King числится
 * и Carry, и Durable, и Disabler одновременно. Поэтому список курируемый
 * и правится руками по мере смены меты.
 *
 * Ключи — hero.name без префикса npc_dota_hero_.
 */

export type Position = 1 | 2 | 3 | 4 | 5;

export const POSITION_LABEL: Record<Position, string> = {
  1: 'Carry',
  2: 'Mid',
  3: 'Offlane',
  4: 'Support',
  5: 'Hard Support',
};

/** Кто играет на каждой позиции. Герой может встречаться в нескольких списках. */
const BY_POSITION: Record<Position, string[]> = {
  1: [
    'antimage', 'arc_warden', 'bloodseeker', 'chaos_knight', 'clinkz', 'drow_ranger',
    'ember_spirit', 'faceless_void', 'gyrocopter', 'juggernaut', 'kez', 'life_stealer',
    'luna', 'lycan', 'medusa', 'meepo', 'monkey_king', 'morphling', 'muerta', 'naga_siren',
    'nevermore', 'phantom_assassin', 'phantom_lancer', 'razor', 'riki',
    'skeleton_king', 'slark', 'sniper', 'spectre', 'sven', 'templar_assassin', 'terrorblade',
    'troll_warlord', 'ursa', 'weaver', 'alchemist', 'lone_druid', 'kunkka', 'tiny',
    'dragon_knight', 'legion_commander',
  ],
  2: [
    'alchemist', 'arc_warden', 'death_prophet', 'dragon_knight', 'ember_spirit', 'huskar',
    'invoker', 'kez', 'leshrac', 'lina', 'monkey_king', 'necrolyte', 'nevermore',
    'obsidian_destroyer', 'pangolier', 'puck', 'pugna', 'queenofpain', 'razor',
    'sniper', 'storm_spirit', 'templar_assassin', 'tinker', 'tiny',
    'viper', 'void_spirit', 'windrunner', 'zuus', 'batrider', 'medusa', 'muerta',
    'broodmother', 'morphling', 'kunkka',
  ],
  3: [
    'abaddon', 'axe', 'batrider', 'elder_titan', 'largo', 'beastmaster', 'brewmaster', 'bristleback', 'broodmother',
    'centaur', 'dark_seer', 'dawnbreaker', 'doom_bringer', 'enigma', 'kunkka',
    'legion_commander', 'lycan', 'magnataur', 'marci', 'mars', 'necrolyte', 'night_stalker',
    'omniknight', 'pangolier', 'primal_beast', 'sand_king', 'shredder', 'slardar',
    'abyssal_underlord', 'tidehunter', 'viper', 'windrunner', 'death_prophet',
    'phoenix', 'bloodseeker',
  ],
  4: [
    'bounty_hunter', 'dark_willow', 'techies', 'ringmaster', 'elder_titan', 'largo', 'earth_spirit', 'earthshaker', 'enigma',
    'grimstroke', 'hoodwink', 'mirana', 'nyx_assassin', 'ogre_magi', 'phoenix', 'pudge',
    'rattletrap', 'riki', 'rubick', 'sand_king', 'shadow_demon', 'silencer', 'skywrath_mage',
    'snapfire', 'spirit_breaker', 'tusk', 'venomancer', 'vengefulspirit', 'void_spirit',
    'marci', 'monkey_king', 'jakiro', 'lion', 'shadow_shaman', 'magnataur', 'slardar',
    'furion',
  ],
  5: [
    'abaddon', 'ancient_apparition', 'bane', 'chen', 'techies', 'ringmaster', 'elder_titan', 'crystal_maiden', 'dazzle', 'disruptor',
    'enchantress', 'grimstroke', 'jakiro', 'keeper_of_the_light', 'lich', 'lion', 'ogre_magi',
    'omniknight', 'oracle', 'shadow_demon', 'shadow_shaman', 'silencer', 'skywrath_mage',
    'snapfire', 'treant', 'undying', 'vengefulspirit', 'warlock', 'winter_wyvern', 'wisp',
    'witch_doctor', 'venomancer', 'dark_willow', 'visage', 'pugna', 'phoenix',
  ],
};

/** shortName -> позиции, в которых героя реально играют. */
const INDEX = new Map<string, Position[]>();
for (const [pos, names] of Object.entries(BY_POSITION)) {
  for (const name of names) {
    const list = INDEX.get(name) ?? [];
    const p = Number(pos) as Position;
    if (!list.includes(p)) list.push(p);
    INDEX.set(name, list);
  }
}
for (const list of INDEX.values()) list.sort((a, b) => a - b);

export function positionsOf(shortName: string): Position[] {
  return INDEX.get(shortName) ?? [];
}

export function playsPosition(shortName: string, position: Position): boolean {
  return positionsOf(shortName).includes(position);
}

/**
 * Подпись позиций для карточки героя: «Carry · Mid».
 * Принимает полное имя из API (npc_dota_hero_antimage).
 */
export function positionLabelsOf(heroName: string): string {
  const list = positionsOf(heroName.replace('npc_dota_hero_', ''));
  return list.length ? list.map((p) => POSITION_LABEL[p]).join(' · ') : 'позиция не указана';
}
