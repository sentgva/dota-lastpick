import type { Hero } from '../types';
import { heroImg } from '../api/opendota';

interface Props {
  hero: Hero | null;
  onClick(): void;
  onClear(): void;
  variant: 'enemy' | 'ally';
}

export function HeroSlot({ hero, onClick, onClear, variant }: Props) {
  if (!hero) {
    return (
      <button className={`slot slot-empty slot-${variant}`} onClick={onClick}>
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
