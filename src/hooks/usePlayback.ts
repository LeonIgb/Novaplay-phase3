import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useVideoPlayer } from 'expo-video';
import type { SubtitleTrack } from 'expo-video';
import { friendlyPlaybackError, PlaybackError } from '../utils/playbackErrors';

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
export type PlaybackStatus = 'idle' | 'loading' | 'ready' | 'error';

type Options = {
  onEnd?: () => void; // called when the video plays to its end
  onDuration?: (sec: number) => void; // called once the real duration is known
};

/**
 * Wraps expo-video. A new source creates a new player; expo-video releases the
 * old one automatically when the source changes or the screen unmounts.
 */
export function usePlayback(uri: string | null, { onEnd, onDuration }: Options = {}) {
  const rateRef = useRef(1);
  const onEndRef = useRef(onEnd);
  const onDurationRef = useRef(onDuration);
  onEndRef.current = onEnd;
  onDurationRef.current = onDuration;

  const player = useVideoPlayer(uri, (p) => {
    p.timeUpdateEventInterval = 0.5;
    p.playbackRate = rateRef.current;
    if (uri) p.play();
  });

  const [status, setStatus] = useState<PlaybackStatus>(uri ? 'loading' : 'idle');
  const [error, setError] = useState<PlaybackError | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [subtitleTrack, setSubtitleTrackState] = useState<SubtitleTrack | null>(null);

  // Subscribe to real player events (re-runs for every new player).
  useEffect(() => {
    let alive = true;
    const toStatus = (s: string): PlaybackStatus =>
      s === 'readyToPlay' ? 'ready' : s === 'error' ? 'error' : uri ? 'loading' : 'idle';

    const syncDuration = () => {
      try {
        if (player.duration > 0) {
          setDuration(player.duration);
          onDurationRef.current?.(player.duration);
        }
      } catch {}
    };

    const syncTracks = () => {
      try {
        setSubtitleTracks([...(player.availableSubtitleTracks ?? [])]);
        setSubtitleTrackState(player.subtitleTrack ?? null);
      } catch {}
    };

    setSubtitleTracks([]);
    setSubtitleTrackState(null);
    setPosition(0);
    setBuffered(0);
    setDuration(0);
    setError(null);
    try {
      setStatus(toStatus(player.status));
      setIsPlaying(player.playing);
      if (player.status === 'readyToPlay') { syncDuration(); syncTracks(); }
    } catch {}

    const subs = [
      player.addListener('statusChange', (e: any) => {
        if (!alive) return;
        const s = toStatus(e.status);
        setStatus(s);
        setError(s === 'error' ? friendlyPlaybackError(e.error?.message) : null);
        if (s === 'ready') { syncDuration(); syncTracks(); }
      }),
      player.addListener('availableSubtitleTracksChange', () => alive && syncTracks()),
      player.addListener('subtitleTrackChange', () => alive && syncTracks()),
      player.addListener('playingChange', (e: any) => alive && setIsPlaying(!!e.isPlaying)),
      player.addListener('timeUpdate', (e: any) => {
        if (!alive) return;
        setPosition(e.currentTime ?? 0);
        if (typeof e.bufferedPosition === 'number' && e.bufferedPosition >= 0) setBuffered(e.bufferedPosition);
        syncDuration();
      }),
      player.addListener('playToEnd', () => alive && onEndRef.current?.()),
    ];

    return () => {
      alive = false;
      subs.forEach((s) => { try { s.remove(); } catch {} });
      try { player.pause(); } catch {}
    };
  }, [player, uri]);

  // Pause when the app leaves the foreground. Playback stays paused on return.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        try { if (player.playing) player.pause(); } catch {}
      }
    });
    return () => sub.remove();
  }, [player]);

  const togglePlay = useCallback(() => {
    try {
      if (player.playing) {
        player.pause();
      } else {
        if (player.duration > 0 && player.currentTime >= player.duration - 0.3) player.currentTime = 0;
        player.play();
      }
    } catch {}
  }, [player]);

  const seekTo = useCallback((sec: number) => {
    try {
      const max = player.duration > 0 ? player.duration : sec;
      const v = Math.min(max, Math.max(0, sec));
      player.currentTime = v;
      setPosition(v);
    } catch {}
  }, [player]);

  const seekBy = useCallback((delta: number) => {
    try { seekTo(player.currentTime + delta); } catch {}
  }, [player, seekTo]);

  const setRate = useCallback((r: number) => {
    rateRef.current = r;
    setRateState(r);
    try { player.playbackRate = r; } catch {}
  }, [player]);

  const setSubtitleTrack = useCallback((t: SubtitleTrack | null) => {
    try { player.subtitleTrack = t; setSubtitleTrackState(t); } catch {}
  }, [player]);

  const retry = useCallback(() => {
    if (!uri) return;
    setError(null);
    setStatus('loading');
    try { player.replace(uri); player.play(); } catch {}
  }, [player, uri]);

  return { player, status, error, isPlaying, position, buffered, duration, rate, togglePlay, seekTo, seekBy, setRate, retry, subtitleTracks, subtitleTrack, setSubtitleTrack };
}
