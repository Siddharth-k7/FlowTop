'use client';
import { useState, type ReactNode } from 'react';

/** Drag to reorder with a handle, plus up/down buttons so keyboard and touch users can reorder too. */
export function SortableList<T>({ items, getKey, onChange, render, label }: {
  items: T[]; getKey: (t: T) => string; onChange: (next: T[]) => void; render: (t: T, i: number) => ReactNode; label: string;
}) {
  const [from, setFrom] = useState<number>();
  const move = (a: number, b: number) => {
    if (b < 0 || b >= items.length || a === b) return;
    const n = [...items]; const [x] = n.splice(a, 1); n.splice(b, 0, x as T); onChange(n);
  };
  const arrow = 'min-h-touch min-w-touch rounded text-lg hover:bg-purple-pale disabled:opacity-30';
  return (
    <ul className="flex flex-col gap-2">
      {items.map((it, i) => (
        <li key={getKey(it)} className="flex items-center gap-1 rounded border border-grey-200 bg-white p-2"
          onDragOver={(e) => e.preventDefault()} onDrop={() => { if (from !== undefined) move(from, i); setFrom(undefined); }}>
          <span draggable aria-hidden className="cursor-grab select-none px-2 text-grey-500"
            onDragStart={(e) => { setFrom(i); e.dataTransfer.setDragImage(e.currentTarget.parentElement as Element, 0, 0); }}>⠿</span>
          <div className="min-w-0 flex-1">{render(it, i)}</div>
          <button type="button" className={arrow} aria-label={`Move ${label} ${i + 1} up`} disabled={i === 0} onClick={() => move(i, i - 1)}>↑</button>
          <button type="button" className={arrow} aria-label={`Move ${label} ${i + 1} down`} disabled={i === items.length - 1} onClick={() => move(i, i + 1)}>↓</button>
        </li>
      ))}
    </ul>
  );
}
