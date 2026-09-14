import { useState } from 'react';
import type { Hero, ItemConstant, ItemPopularity } from '../types';
import { ItemDetails } from './ItemDetails';
import { useItemConstants, useItemPopularity } from '../hooks/useDota';
import { ItemIcon } from './ItemIcon';
import { counterItems, draftThreats } from '../data/itemCounters';
import { shortName } from '../data/synergy';
import { isWholeItem } from '../data/wholeItems';
import { fitsPosition } from '../data/itemRoles';
import { POSITION_LABEL, positionsOf, type Position } from '../data/positions';

const PHASES: { key: keyof ItemPopularity; label: string }[] = [
  { key: 'start_game_items', label: 'Starting Items' },
  { key: 'early_game_items', label: 'Early Game' },
  { key: 'mid_game_items', label: 'Mid Game' },
  { key: 'late_game_items', label: 'Late Game' },
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

  const heroPositions = positionsOf(shortName(hero.name));
  // По умолчанию — основная позиция героя; «Все» показывает закуп целиком.
  const [position, setPosition] = useState<Position | null>(heroPositions[0] ?? null);
  const [openItem, setOpenItem] = useState<ItemConstant | null>(null);

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
          <h4>Against Enemy Draft</h4>
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
            <p className="muted small">No special item requirements — go with the standard build.</p>
          ) : (
            <>
              <div className="item-row">
                {counters.slice(0, 10).map((c) => (
                  <ItemIcon
                    key={c.item}
                    item={lookup(byKey, c.item)}
                    fallbackName={c.item}
                    title={`${c.reasons.join('; ')} — because of ${c.triggeredBy.join(', ')}`}
                    onOpen={setOpenItem}
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

      <h4>Item Build</h4>

      {heroPositions.length > 0 && (
        <div className="chips chips-sm">
          {heroPositions.map((p) => (
            <button
              key={p}
              className={`chip${position === p ? ' is-on' : ''}`}
              onClick={() => setPosition(p)}
            >
              {POSITION_LABEL[p]}
            </button>
          ))}
          <button className={`chip${position === null ? ' is-on' : ''}`} onClick={() => setPosition(null)}>
            All
          </button>
        </div>
      )}

      {popularity.loading && <p className="muted small">Loading items…</p>}
      {popularity.error && <p className="error small">{popularity.error}</p>}

      {popularity.data &&
        PHASES.map(({ key, label }) => {
          // Компоненты отсеиваем всегда, а при выбранной позиции оставляем только
          // то, что на ней собирают: разбивки по позициям в API нет, это фильтр.
          const entries = Object.entries(popularity.data![key] ?? {})
            .map(([id, count]) => ({ id: Number(id), count: count as number }))
            .sort((a, b) => b.count - a.count)
            .map((e) => ({ ...e, found: byId?.get(e.id) }))
            .filter((e) => isWholeItem(e.found?.key ?? '', e.found?.item))
            .filter((e) => position === null || fitsPosition(e.found?.key ?? '', position))
            .slice(0, TOP_PER_PHASE);
          if (entries.length === 0) return null;
          return (
            <section key={key} className="phase">
              <p className="phase-label">{label}</p>
              <div className="item-row">
                {entries.map(({ id, found }) => (
                  <ItemIcon key={id} item={found?.item} fallbackName={`#${id}`} onOpen={setOpenItem} />
                ))}
              </div>
            </section>
          );
        })}

      {position !== null && (
        <p className="build-note">
          {POSITION_LABEL[position]} build — the hero's overall item stats filtered to what this
          position actually buys. OpenDota does not publish per-position data.
        </p>
      )}
      {openItem && <ItemDetails item={openItem} onClose={() => setOpenItem(null)} />}
    </div>
  );
}

function lookup(byKey: Record<string, ItemConstant> | undefined, key: string): ItemConstant | undefined {
  return byKey?.[key];
}
