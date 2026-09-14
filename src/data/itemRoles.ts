import type { Position } from './positions';

/**
 * Какие предметы уместны на какой позиции.
 *
 * Зачем это нужно: OpenDota отдаёт ОДИН закуп на героя — разбивки по позициям
 * в API нет вообще. Поэтому сборку под позицию мы получаем фильтрацией общего
 * популярного закупа: показываем только то, что на этой позиции действительно
 * собирают. Это приближение, а не отдельная статистика.
 *
 * Ключи совпадают с ключами /api/constants/items.
 */

/** Годится всем: мобильность, спасение, иммунитет. */
const UNIVERSAL = [
  'black_king_bar', 'blink', 'magic_wand', 'boots', 'travel_boots', 'travel_boots_2',
  'ultimate_scepter', 'aghanims_shard', 'aeon_disk', 'cyclone', 'wind_waker',
  'ghost', 'sphere', 'lotus_orb', 'shivas_guard', 'octarine_core', 'refresher',
  'sheepstick', 'orchid', 'bloodthorn', 'silver_edge', 'nullifier', 'overwhelming_blink',
  'swift_blink', 'arcane_blink', 'force_staff', 'eternal_shroud', 'tpscroll',
];

/** Профильные предметы каждой позиции. */
const BY_POSITION: Record<Position, string[]> = {
  // Керри: урон, скорость атаки, выживание в драке
  1: [
    'power_treads', 'phase_boots', 'bfury', 'maelstrom', 'mjollnir', 'manta', 'sange_and_yasha',
    'yasha_and_kaya', 'diffusal_blade', 'disperser', 'desolator', 'echo_sabre', 'harpoon',
    'basher', 'abyssal_blade', 'skadi', 'butterfly', 'satanic', 'monkey_king_bar',
    'radiance', 'heart', 'assault', 'moon_shard', 'greater_crit', 'mask_of_madness',
    'hurricane_pike', 'revenants_brooch', 'wraith_band', 'orb_of_corrosion', 'invis_sword',
    'vanguard', 'crimson_guard', 'talisman_of_evasion', 'helm_of_the_overlord', 'bloodstone',
  ],
  // Мид: темп, бёрст, предметы под способности
  2: [
    'power_treads', 'phase_boots', 'bottle', 'kaya', 'kaya_and_sange', 'yasha_and_kaya',
    'veil_of_discord', 'ethereal_blade', 'dagon', 'dagon_2', 'dagon_3', 'dagon_4', 'dagon_5',
    'hand_of_midas', 'maelstrom', 'mjollnir', 'desolator', 'gungir', 'witch_blade',
    'null_talisman', 'wraith_band', 'bracer', 'soul_ring', 'falcon_blade', 'echo_sabre',
    'bloodstone', 'arcane_boots', 'invis_sword', 'harpoon', 'angels_demise',
  ],
  // Оффлейн: живучесть, инициация, командные ауры
  3: [
    'phase_boots', 'tranquil_boots', 'arcane_boots', 'vanguard', 'crimson_guard', 'pipe',
    'blade_mail', 'heart', 'assault', 'shivas_guard', 'heavens_halberd', 'sange',
    'kaya_and_sange', 'echo_sabre', 'meteor_hammer', 'spirit_vessel', 'vladmir', 'wraith_pact',
    'guardian_greaves', 'mekansm', 'soul_ring', 'bracer', 'helm_of_the_dominator',
    'helm_of_the_overlord', 'hood_of_defiance', 'solar_crest', 'radiance', 'bloodstone',
    'ancient_janggo', 'boots_of_bearing', 'harpoon', 'angels_demise',
  ],
  // Сап (4): темп, ганки, расходники
  4: [
    'tranquil_boots', 'arcane_boots', 'phase_boots', 'urn_of_shadows', 'spirit_vessel',
    'glimmer_cape', 'solar_crest', 'medallion_of_courage', 'ancient_janggo', 'boots_of_bearing',
    'meteor_hammer', 'rod_of_atos', 'gungir', 'veil_of_discord', 'aether_lens', 'holy_locket',
    'pavise', 'vladmir', 'wraith_pact', 'blade_mail', 'soul_ring', 'magic_stick', 'dust',
    'ward_sentry', 'ward_observer', 'smoke_of_deceit', 'mekansm', 'guardian_greaves', 'pipe',
  ],
  // Хард сап (5): сейв, ауры, вижн
  5: [
    'tranquil_boots', 'arcane_boots', 'glimmer_cape', 'force_staff', 'aether_lens',
    'holy_locket', 'pavise', 'mekansm', 'guardian_greaves', 'solar_crest',
    'medallion_of_courage', 'urn_of_shadows', 'spirit_vessel', 'ancient_janggo',
    'boots_of_bearing', 'vladmir', 'wraith_pact', 'pipe', 'crimson_guard', 'ward_sentry',
    'ward_observer', 'dust', 'smoke_of_deceit', 'magic_stick', 'headdress', 'buckler',
    'ring_of_basilius', 'soul_ring', 'rod_of_atos', 'veil_of_discord',
  ],
};

const SETS: Record<Position, Set<string>> = {
  1: new Set([...UNIVERSAL, ...BY_POSITION[1]]),
  2: new Set([...UNIVERSAL, ...BY_POSITION[2]]),
  3: new Set([...UNIVERSAL, ...BY_POSITION[3]]),
  4: new Set([...UNIVERSAL, ...BY_POSITION[4]]),
  5: new Set([...UNIVERSAL, ...BY_POSITION[5]]),
};

export function fitsPosition(itemKey: string, position: Position): boolean {
  return SETS[position].has(itemKey);
}

/** Все ключи из этого файла — для проверки, что они существуют в API. */
export function allItemKeys(): string[] {
  return [...new Set([...UNIVERSAL, ...Object.values(BY_POSITION).flat()])];
}
