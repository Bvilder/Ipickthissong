'use client';

import { motion } from 'framer-motion';
import AlbumCover from './AlbumCover';
import type { Song } from '@/lib/types';

/** 轻量歌曲选择块：N 选 1 场景用 */
export default function SongTile({
  song,
  onClick,
  index = 0,
}: {
  song: Song;
  onClick: () => void;
  index?: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), type: 'spring', stiffness: 240, damping: 24 }}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-2xl border border-white/12 bg-white/[.06] p-2.5 text-left transition active:scale-[.97] hover:border-fuchsia-300/50"
    >
      <AlbumCover song={song} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold leading-tight text-white">{song.title}</span>
        <span className="mt-0.5 block truncate text-[10px] text-white/45">
          {song.album} · {song.year}
        </span>
      </span>
      <span className="shrink-0 text-xs font-bold text-fuchsia-200">选它 →</span>
    </motion.button>
  );
}
