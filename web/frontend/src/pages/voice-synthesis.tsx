import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AudioPlayer } from "@/components/ui/audio-player";
import { ParameterSlider } from "@/components/ui/parameter-slider";
import { apiRequest } from "@/lib/queryClient";
import { TTSRequest, AudioFile } from "@shared/schema";
import { 
  Brain, 
  Edit3, 
  Info,
  Sliders, 
  Play, 
  History, 
  Trash2, 
  FileText,
  Settings,
  HelpCircle,
  Mic,
  Download,
  FileAudio,
  X
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function VoiceSynthesis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [text, setText] = useState("我是通義實驗室語音團隊全新推出的生成式語音大模型，提供舒適自然的語音合成能力。");
  const [modelPreset, setModelPreset] = useState<TTSRequest["modelPreset"]>("cosyvoice-0.5b-base");
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [volume, setVolume] = useState(100);
  const [energy, setEnergy] = useState(1.0);
  const [emotion, setEmotion] = useState<TTSRequest["emotion"]>("neutral");
  const [speakerEmbedding, setSpeakerEmbedding] = useState(50);
  const [noiseScale, setNoiseScale] = useState(0.6);
  const [lengthScale, setLengthScale] = useState(1.0);
  const [outputFormat, setOutputFormat] = useState<"wav" | "mp3">("wav");
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | undefined>();
  const [currentAudioFile, setCurrentAudioFile] = useState<AudioFile | undefined>();
  
  // Gradio-like controls - simplified to match original
  const [inferenceMode, setInferenceMode] = useState<'3s極速複刻' | '跨語種複刻'>('3s極速複刻');
  const [promptText, setPromptText] = useState("");
  const [promptAudioFile, setPromptAudioFile] = useState<File | null>(null);
  const [seed, setSeed] = useState(54509709);

  // Character count
  const characterCount = text.length;
  const maxCharacters = 500;

  // Fetch audio history
  const { data: audioHistory = [], isLoading: historyLoading } = useQuery<AudioFile[]>({
    queryKey: ["/api/audio"],
    staleTime: 30000,
  });

  // TTS synthesis mutation
  const synthesizeMutation = useMutation({
    mutationFn: async (request: TTSRequest) => {
      return apiRequest("/api/tts/synthesize", {
        method: "POST",
        body: request,
      });
    },
    onSuccess: (data) => {
      if (data.success && data.audioFile) {
        const audioUrl = `/api/audio/${data.audioFile.id}/stream`;
        setCurrentAudioUrl(audioUrl);
        setCurrentAudioFile(data.audioFile);
        
        // Invalidate and refetch audio history
        queryClient.invalidateQueries({ queryKey: ["/api/audio"] });
        
        toast({
          title: "語音生成成功",
          description: `處理時間: ${(data.processingTime / 1000).toFixed(1)}秒`,
        });
      } else {
        throw new Error(data.error || "語音生成失敗");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "語音生成失敗",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear history mutation
  const clearHistoryMutation = useMutation({
    mutationFn: () => apiRequest("/api/audio", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio"] });
      toast({
        title: "記錄已清除",
        description: "所有音頻記錄已成功刪除",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "清除失敗",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSynthesize = () => {
    if (!text.trim()) {
      toast({
        title: "請輸入文字",
        description: "請在文字輸入區域輸入要合成的內容",
        variant: "destructive",
      });
      return;
    }

    if (inferenceMode === '3s極速複刻' && !promptText.trim()) {
      toast({
        title: "請輸入Prompt文本",
        description: "3s極速複刻模式需要輸入與音頻內容一致的Prompt文本",
        variant: "destructive",
      });
      return;
    }

    if (!promptAudioFile) {
      toast({
        title: "請上傳音頻文件",
        description: "請先上傳Prompt音頻文件",
        variant: "destructive",
      });
      return;
    }

    const request: TTSRequest = {
      text: text.trim(),
      modelPreset: "cosyvoice-0.5b-base", // 固定使用基礎模型
      speed: 1.0, // 簡化參數
      pitch: 0,
      volume: 100,
      energy: 1.0,
      emotion: "neutral",
      speakerEmbedding: 50,
      noiseScale: 0.6,
      lengthScale: 1.0,
      outputFormat,
      seed,
      // Gradio parameters
      inferenceMode,
      promptText: inferenceMode === '3s極速複刻' ? promptText : undefined,
    };

    // Handle audio file upload (simplified for now)
    if (promptAudioFile) {
      console.log('Audio file to upload:', promptAudioFile.name);
    }

    synthesizeMutation.mutate(request);
  };

  const handleDownload = () => {
    if (currentAudioFile) {
      const downloadUrl = `/api/audio/${currentAudioFile.id}/download`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = currentAudioFile.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    if (currentAudioFile) {
      const shareUrl = `${window.location.origin}/api/audio/${currentAudioFile.id}/stream`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({
          title: "分享連結已複製",
          description: "音頻分享連結已複製到剪貼板",
        });
      });
    }
  };

  const handlePlayHistory = (audioFile: AudioFile) => {
    const audioUrl = `/api/audio/${audioFile.id}/stream`;
    setCurrentAudioUrl(audioUrl);
    setCurrentAudioFile(audioFile);
  };

  const handleDownloadHistory = (audioFile: AudioFile) => {
    const downloadUrl = `/api/audio/${audioFile.id}/download`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = audioFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearText = () => setText("");
  const loadSample = () => setText("這是一個測試文本，展示 CosyVoice 的語音合成功能。");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Mic className="text-white w-4 h-4" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">CosyVoice</h1>
              <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">智能語音合成</span>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Info className="w-5 h-5 text-blue-500" />
                      <span>CosyVoice 使用說明</span>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-700 text-base">預訓練音色</h4>
                      <ol className="list-decimal list-inside text-slate-600 space-y-2">
                        <li>選擇預設模型套餐</li>
                        <li>選擇預訓練音色</li>
                        <li>輸入要合成的文本</li>
                        <li>調整參數（可選）</li>
                        <li>點擊生成音頻按鈕</li>
                      </ol>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-700 text-base">3s極速複刻</h4>
                      <ol className="list-decimal list-inside text-slate-600 space-y-2">
                        <li>上傳音頻文件（≤30秒，≥16kHz）</li>
                        <li>輸入音頻對應的文本內容</li>
                        <li>輸入要合成的目標文本</li>
                        <li>點擊生成音頻按鈕</li>
                      </ol>
                      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        📝 Prompt文本需與音頻內容完全一致
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-700 text-base">跨語種複刻</h4>
                      <ol className="list-decimal list-inside text-slate-600 space-y-2">
                        <li>上傳音頻文件（≤30秒，≥16kHz）</li>
                        <li>輸入要合成的文本</li>
                        <li>點擊生成音頻按鈕</li>
                      </ol>
                      <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        🌍 確保合成文本和音頻為不同語言
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-700 text-base">自然語言控制</h4>
                      <ol className="list-decimal list-inside text-slate-600 space-y-2">
                        <li>選擇預設模型套餐</li>
                        <li>選擇預訓練音色</li>
                        <li>輸入控制指令（如"用溫柔的語調說話"）</li>
                        <li>輸入要合成的文本</li>
                        <li>點擊生成音頻按鈕</li>
                      </ol>
                      <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        🎭 描述想要的語音風格或情感
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* 選擇推理模式 */}
          <Card>
            <CardHeader>
              <CardTitle>選擇推理模式</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="pretrained"
                    name="inference-mode"
                    checked={false}
                    disabled
                    className="opacity-50"
                  />
                  <Label htmlFor="pretrained" className="text-slate-400">預訓練音色</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="clone3s"
                    name="inference-mode"
                    checked={inferenceMode === '3s極速複刻'}
                    onChange={() => setInferenceMode('3s極速複刻')}
                  />
                  <Label htmlFor="clone3s">3s極速複刻</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="crosslang"
                    name="inference-mode"
                    checked={inferenceMode === '跨語種複刻'}
                    onChange={() => setInferenceMode('跨語種複刻')}
                  />
                  <Label htmlFor="crosslang">跨語種複刻</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="instruct"
                    name="inference-mode"
                    checked={false}
                    disabled
                    className="opacity-50"
                  />
                  <Label htmlFor="instruct" className="text-slate-400">自然語言控制</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 主要內容區 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左側：Prompt 音頻和文本 */}
            <div className="space-y-6">
              {/* 上傳 Prompt 音頻 */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {inferenceMode === '3s極速複刻' ? '1.選擇prompt音頻文件，或者錄音' : '提示音頻或錄音'}
                  </CardTitle>
                  <div className="text-sm text-slate-600">
                    prompt音頻：注意prompt音頻不超過30s，並且盡量保證和你指定的prompt音頻文字一樣。目標音頻長度保持在prompt長度附近更能得到語音效果
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setPromptAudioFile(e.target.files?.[0] || null)}
                  />
                  {promptAudioFile && (
                    <div className="text-sm text-green-600">
                      已選擇: {promptAudioFile.name}
                    </div>
                  )}
                  
                  {/* 錄音區域（暫時顯示為佔位） */}
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Mic className="w-6 h-6 text-slate-400" />
                      <span className="text-slate-500">點擊錄音</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prompt 文本（僅 3s 極速複刻） */}
              {inferenceMode === '3s極速複刻' && (
                <Card>
                  <CardHeader>
                    <CardTitle>輸入prompt文本</CardTitle>
                    <div className="text-sm text-slate-600">
                      需謹慎填寫真實音頻文字。是否和原始音頻真實高度相符可能會影響生成效果。
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder="請輸入與音頻內容一致的文本..."
                      className="min-h-20"
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 右側：合成文本和控制 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 合成文本 */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {inferenceMode === '3s極速複刻' ? '2.輸入prompt文本' : '輸入合成文本'}
                  </CardTitle>
                  <div className="text-sm text-slate-600">
                    {inferenceMode === '3s極速複刻' 
                      ? '需謹慎填寫真實音頻文字。是否和原始音頻真實高度相符可能會影響生成效果。'
                      : '請輸入你想要合成的文本內容。'
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="請輸入需要合成的文本..."
                    className="min-h-32"
                    maxLength={maxCharacters}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={clearText}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        清空
                      </Button>
                      <Button variant="ghost" size="sm" onClick={loadSample}>
                        <FileText className="w-4 h-4 mr-1" />
                        範例
                      </Button>
                    </div>
                    <span className={`text-sm ${characterCount > 450 ? 'text-red-500' : 'text-slate-500'}`}>
                      {characterCount} / {maxCharacters}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 控制面板 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 輸出格式和生成 */}
                <Card>
                  <CardHeader>
                    <CardTitle>生成控制</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>輸出格式</Label>
                      <Select value={outputFormat} onValueChange={(value: "wav" | "mp3") => setOutputFormat(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wav">WAV</SelectItem>
                          <SelectItem value="mp3">MP3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleSynthesize}
                      disabled={synthesizeMutation.isPending || !text.trim() || (inferenceMode === '3s極速複刻' && !promptText.trim())}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                      size="lg"
                    >
                      {synthesizeMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          生成音頻
                        </>
                      ) : (
                        "生成音頻"
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* 隨機種子 */}
                <Card>
                  <CardHeader>
                    <CardTitle>隨機種子</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={seed}
                        onChange={(e) => setSeed(Number(e.target.value))}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSeed(Math.floor(Math.random() * 100000000))}
                      >
                        🎲
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Generation Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={handleSynthesize}
                    disabled={synthesizeMutation.isPending || !text.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3"
                  >
                    {synthesizeMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        生成中...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        生成語音
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex items-center space-x-3">
                  <Label className="text-sm font-medium text-slate-700">輸出格式:</Label>
                  <Select value={outputFormat} onValueChange={(value: "wav" | "mp3") => setOutputFormat(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wav">WAV (高品質)</SelectItem>
                      <SelectItem value="mp3">MP3 (壓縮)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {synthesizeMutation.isPending && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                    <span>生成進度</span>
                    <span>處理中...</span>
                  </div>
                  <Progress value={undefined} className="animate-pulse" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audio Player */}
          <AudioPlayer
            audioUrl={currentAudioUrl}
            title={currentAudioFile?.title}
            onDownload={handleDownload}
            onShare={handleShare}
          />

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <History className="text-blue-500 w-5 h-5" />
                  <span>最近生成</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => clearHistoryMutation.mutate()}
                  disabled={clearHistoryMutation.isPending || audioHistory.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  清除記錄
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : audioHistory.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  <FileAudio className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>尚無語音記錄</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {audioHistory.map((audioFile: AudioFile) => (
                    <div key={audioFile.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileAudio className="text-blue-600 w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{audioFile.title}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(audioFile.createdAt).toLocaleString('zh-TW')} • {audioFile.modelPreset}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handlePlayHistory(audioFile)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadHistory(audioFile)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
