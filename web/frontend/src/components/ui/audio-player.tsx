import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Download, Play, Pause, Square, Share2, Volume2 } from "lucide-react";
import { useAudio } from "@/hooks/use-audio";
import { useEffect } from "react";

interface AudioPlayerProps {
  audioUrl?: string;
  title?: string;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

export function AudioPlayer({
  audioUrl,
  title,
  onDownload,
  onShare,
  className = ""
}: AudioPlayerProps) {
  const [audioState, audioControls] = useAudio();

  useEffect(() => {
    if (audioUrl) {
      audioControls.load(audioUrl);
    }
  }, [audioUrl, audioControls]);

  const handleSeek = (values: number[]) => {
    const time = (values[0] / 100) * audioState.duration;
    audioControls.seek(time);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = audioState.duration > 0 
    ? (audioState.currentTime / audioState.duration) * 100 
    : 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Volume2 className="text-blue-500 w-5 h-5" />
        <h2 className="text-lg font-semibold text-slate-900">音頻播放</h2>
      </div>
      
      <div className="space-y-4">
        {/* Waveform Visualization Placeholder */}
        <div className="bg-slate-50 rounded-lg p-4 border-2 border-dashed border-slate-300 waveform-placeholder">
          <div className="flex items-center justify-center h-24 text-slate-500">
            <div className="text-center">
              <Volume2 className="w-8 h-8 mx-auto mb-2" />
              {audioUrl ? (
                <p className="text-sm">
                  {audioState.isLoading ? "載入中..." : 
                   audioState.error ? "載入失敗" : 
                   title || "音頻已載入"}
                </p>
              ) : (
                <p className="text-sm">生成語音後將在此顯示波形</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Audio Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              size="lg"
              onClick={audioState.isPlaying ? audioControls.pause : audioControls.play}
              disabled={!audioUrl || audioState.isLoading}
              className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              {audioState.isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={audioControls.stop}
              disabled={!audioUrl}
              className="w-10 h-10 rounded-full"
            >
              <Square className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <span>{formatTime(audioState.currentTime)}</span>
              <span>/</span>
              <span>{formatTime(audioState.duration)}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={onDownload}
              disabled={!audioUrl}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              下載
            </Button>
            <Button
              variant="outline"
              onClick={onShare}
              disabled={!audioUrl}
            >
              <Share2 className="w-4 h-4 mr-2" />
              分享
            </Button>
          </div>
        </div>
        
        {/* Progress Slider */}
        <div className="flex items-center space-x-3">
          <span className="text-sm text-slate-500 w-12">
            {formatTime(audioState.currentTime)}
          </span>
          <Slider
            value={[progressPercent]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="flex-1"
            disabled={!audioUrl || audioState.duration === 0}
          />
          <span className="text-sm text-slate-500 w-12">
            {formatTime(audioState.duration)}
          </span>
        </div>

        {audioState.error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {audioState.error}
          </div>
        )}
      </div>
    </div>
  );
}
