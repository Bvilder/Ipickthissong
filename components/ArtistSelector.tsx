'use client';

import { ARTISTS } from '@/lib/musicProvider';

export default function ArtistSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {ARTISTS.map((a) => {
        const active = a.id === value;
        const disabled = !a.available;
        return (
          <button
            key={a.id}
            disabled={disabled}
            onClick={() => onChange(a.id)}
            className={`flex-1 rounded-2xl border px-3 py-2.5 text-left transition ${
              active
                ? 'border-fuchsia-300/60 bg-fuchsia-400/15 shadow-md shadow-fuchsia-900/20'
                : 'border-white/10 bg-black/10'
            } ${disabled ? 'opacity-40' : ''}`}
          >
            <p className={`text-sm font-black ${active ? 'text-white' : 'text-white/60'}`}>{a.name}</p>
            <p className="mt-0.5 text-[10px] leading-4 text-white/40">{a.subtitle}</p>
          </button>
        );
      })}
    </div>
  );
}
