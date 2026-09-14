import type { Hero, ItemConstant, ItemPopularity } from '../types';
import { useItemConstants, useItemPopularity } from '../hooks/useDota';
import { ItemIcon } from './ItemIcon';
import { counterItems, draftThreats } from '../data/itemCounters';
import { shortName } from '../data/synergy';
import { isWholeItem } from '../data/wholeItems';

const PHASES: { key: keyof ItemPopularity; label: string }[] = [
  { key: 'start_game_items', label: 'Старт' },
  { key: 'early_game_items', label: 'Ранняя игра' },
  { key: 'mid_game_items', label: 'Середина' },
  { key: 'late_game_items', label: 'Поздняя игра' },
];

const TOP_PER_PHASE = 8;

interface Props {
  hero: Hero;
  /** Если передан вражеский драфт — сверху появится блок «против этого драфта». */
  enemies?: Hero[];
}

export function HeroBuild({ hero, enemies = [] }: Props) {
  const items = useItemConstants();
  const popularity = useItemPopularity(hero.id);

  const byId = items.data?.byId;
  const byKey = items.data?.byKey;

  const enemyShort = enemies.map((e) => shortName(e.name));
  const counters = enemies.length ? counterItems(enemyShort, enemies.map((e) => e.localized_name)) : [];
  const threats = enemies.length ? draftThreats(enemyShort) : [];

  return (
    <div className="build">
      {/* Этот блок ценнее популярного закупа: такого нигде больше не посмотреть,
          поэтому он идёт первым и выделен акцентной рамкой. */}
      {enemies.length > 0 && (
        <section className="counter-build">
          <h4>Против драфта соперника</h4>
          {threats.length > 0 && (
            <ul className="threats">
              {threats.map((t) => (
                <li key={t.label}>
                  {t.label}
                  <b>{t.heroes.length}</b>
                </li>
              ))}
            </ul>
          )}
          {counters.length === 0 ? (
            <p className="muted small">Особых требований к закупу нет — берите стандартный билд.</p>
          ) : (
            <>
              <div className="item-row">
                {counters.slice(0, 10).map((c) => (
                  <ItemIcon
                    key={c.item}
                    item={lookup(byKey, c.item)}
                    fallbackName={c.item}
                    title={`${c.reasons.join('; ')} — из-за: ${c.triggeredBy.join(', ')}`}
                  />
                ))}
              </div>
              <ul className="reasons">
                {counters.slice(0, 5).map((c) => (
                  <li key={c.item}>
                    <strong>{lookup(byKey, c.item)?.dname ?? c.item}</strong> — {c.reasons[0]} (
                    {c.triggeredBy.join(', ')})
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <h4>
        Популярный закуп
        {enemies.length > 0 && <span className="section-count">без учёта драфта</span>}
      </h4>

      {popularity.loading && <p className="muted small">Загрузка закупа…</p>}
      {popularity.error && <p className="error small">{popularity.error}</p>}

      {popularity.data &&
        PHASES.map(({ key, label }) => {
          // Компоненты (палочки, Ultimate Orb, Broadsword) отсеиваем — в билде
          // интересны только собранные предметы.
          const entries = Object.entries(popularity.data![key] ?? {})
            .map(([id, count]) => ({ id: Number(id), count: count as number }))
            .sort((a, b) => b.count - a.count)
            .map((e) => ({ ...e, found: byId?.get(e.id) }))
            .filter((e) => isWholeItem(e.found?.key ?? '', e.found?.item))
            .slice(0, TOP_PER_PHASE);
          if (entries.length === 0) return null;
          return (
            <section key={key} className="phase">
              <p className="muted small" style={{ margin: '0 0 5px' }}>
                {label}
              </p>
              <div className="item-row">
                {entries.map(({ id, count, found }) => (
                  <ItemIcon key={id} item={found?.item} fallbackName={`#${id}`} caption={formatCount(count)} />
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}

function lookup(byKey: Record<string, ItemConstant> | undefined, key: string): ItemConstant | undefined {
  return byKey?.[key];
}

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
