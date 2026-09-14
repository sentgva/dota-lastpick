import type { Hero } from '../types';
import { heroImg } from '../api/opendota';

interface Props {
  hero: Hero | null;
  onClick(): void;
  onClear(): void;
  /** Сторона различается формой: враг — срезанный угол, союзник — скругление. */
  variant: 'enemy' | 'ally';
}

export function HeroSlot({ hero, onClick, onClear, variant }: Props) {
  if (!hero) {
    return (
      <button className={`slot slot-empty slot-${variant}`} onClick={onClick} aria-label="Выбрать героя">
        +
      </button>
    );
  }
  return (
    <div className={`slot slot-${variant}`} onClick={onClick}>
      <img src={heroImg(hero)} alt={hero.localized_name} />
      <span className="slot-name">{hero.localized_name}</span>
      <button
        className="slot-clear"
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        aria-label="Убрать героя"
      >
        ×
      </button>
    </div>
  );
}

/** Пустое место последнего пика — то, что подбирает приложение. */
export function LastPickSlot({ suggested }: { suggested: Hero | null }) {
  return (
    <div className="slot-lastpick" title={suggested ? `Рекомендация: ${suggested.localized_name}` : undefined}>
      {suggested && <img src={heroImg(suggested)} alt="" />}
      <span className="slot-lastpick-label">{suggested ? suggested.localized_name : 'последний пик'}</span>
    </div>
  );
}
