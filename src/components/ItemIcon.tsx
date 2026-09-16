import type { ItemConstant } from '../types';
import { itemImg } from '../api/opendota';

interface Props {
  item: ItemConstant | undefined;
  fallbackName?: string;
  title?: string;
  /** Короткая подпись под иконкой — например доля сборок. */
  caption?: string;
  captionTone?: 'pos' | 'neg';
  /** Вторая строка подписи — винрейт с предметом. */
  subCaption?: string;
  subCaptionTone?: 'pos' | 'neg';
  /** Клик открывает карточку с описанием предмета. */
  onOpen?(item: ItemConstant): void;
}

export function ItemIcon({
  item,
  fallbackName,
  title,
  caption,
  captionTone,
  subCaption,
  subCaptionTone,
  onOpen,
}: Props) {
  const label = item?.dname ?? fallbackName ?? 'Unknown item';
  return (
    <button
      className="item"
      title={title ?? label}
      onClick={item && onOpen ? () => onOpen(item) : undefined}
      disabled={!item || !onOpen}
    >
      {item ? (
        <img src={itemImg(item)} alt={label} loading="lazy" />
      ) : (
        <div className="item-placeholder" />
      )}
      <span className="item-name">{label}</span>
      {caption && <span className={`item-caption${captionTone ? ' ' + captionTone : ''}`}>{caption}</span>}
      {subCaption && (
        <span className={`item-caption item-sub${subCaptionTone ? ' ' + subCaptionTone : ''}`}>{subCaption}</span>
      )}
    </button>
  );
}
