import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { VideoItem } from '../types';

export type NewVideo = { name: string; uri: string; sizeBytes: number };

type Ctx = {
  videos: VideoItem[];
  addVideos: (items: NewVideo[]) => number; // returns how many were actually added
  setDuration: (id: string, sec: number) => void;
};

const TINTS = ['#12313A', '#16332F', '#1E2B3F', '#2A2540', '#27333A', '#143440'];
const LibraryContext = createContext<Ctx | null>(null);

// In-memory only. Saving the library across app restarts is a later phase.
export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [videos, setVideos] = useState<VideoItem[]>([]);

  const addVideos = useCallback((items: NewVideo[]) => {
    let added = 0;
    setVideos((prev) => {
      const next = [...prev];
      items.forEach((it, i) => {
        const sizeMb = it.sizeBytes / (1024 * 1024);
        const title = it.name.replace(/\.[^.]+$/, '');
        if (next.some((v) => v.title === title && Math.abs(v.sizeMb - sizeMb) < 0.01)) return;
        added += 1;
        next.push({
          id: `${Date.now()}-${next.length}-${i}`,
          title,
          uri: it.uri,
          sizeMb,
          addedLabel: 'Just now',
          folder: 'Imported',
          tint: TINTS[next.length % TINTS.length],
        });
      });
      return next;
    });
    return added;
  }, []);

  const setDuration = useCallback((id: string, sec: number) => {
    setVideos((prev) => {
      const v = prev.find((x) => x.id === id);
      if (!v || v.durationSec === sec) return prev;
      return prev.map((x) => (x.id === id ? { ...x, durationSec: sec } : x));
    });
  }, []);

  const value = useMemo(() => ({ videos, addVideos, setDuration }), [videos, addVideos, setDuration]);
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): Ctx {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used inside LibraryProvider');
  return ctx;
}
