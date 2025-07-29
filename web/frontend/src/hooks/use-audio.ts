import { useRef, useState, useCallback, useEffect } from 'react';

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  error: string | null;
}

export interface AudioControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  load: (src: string) => void;
}

export function useAudio(): [AudioState, AudioControls] {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isLoading: false,
    error: null,
  });

  const updateState = useCallback((updates: Partial<AudioState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      updateState({
        currentTime: audio.currentTime,
        duration: audio.duration || 0,
      });
    };

    const handleLoadStart = () => updateState({ isLoading: true, error: null });
    const handleCanPlay = () => updateState({ isLoading: false, duration: audio.duration || 0 });
    const handlePlay = () => updateState({ isPlaying: true });
    const handlePause = () => updateState({ isPlaying: false });
    const handleEnded = () => updateState({ isPlaying: false, currentTime: 0 });
    const handleError = () => updateState({ 
      isLoading: false, 
      error: 'Failed to load audio file',
      isPlaying: false 
    });

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [updateState]);

  const controls: AudioControls = {
    play: useCallback(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(err => {
          updateState({ error: 'Failed to play audio', isPlaying: false });
        });
      }
    }, [updateState]),

    pause: useCallback(() => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }, []),

    stop: useCallback(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }, []),

    seek: useCallback((time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
    }, []),

    setVolume: useCallback((volume: number) => {
      if (audioRef.current) {
        audioRef.current.volume = Math.max(0, Math.min(1, volume));
        updateState({ volume });
      }
    }, [updateState]),

    load: useCallback((src: string) => {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = src;
      audioRef.current.load();
    }, []),
  };

  return [state, controls];
}
