import React, { useState } from 'react';
import { UploadedFile, ImageStyle, GenerationState, PortraitAspectRatio } from '../types';
import { STYLE_OPTIONS } from '../constants';
import { generateCreativeImage, fileToBase64, refineImage } from '../services/geminiService';
import { Dropzone } from './Dropzone';
import { Button } from './Button';
import { Sparkles, Download, AlertCircle, MessageSquarePlus, Wand2, ImagePlus, X } from 'lucide-react';

const ASPECT_RATIO_OPTIONS = [
  { id: PortraitAspectRatio.WIDE, label: '16:9 (横長)', description: 'YouTubeサムネ、映画風' },
  { id: PortraitAspectRatio.STANDARD, label: '4:3 (標準)', description: '一般的な横長写真' },
  { id: PortraitAspectRatio.SQUARE, label: '1:1 (正方形)', description: 'Instagram、SNSアイコン' },
  { id: PortraitAspectRatio.PORTRAIT, label: '3:4 (縦長)', description: 'ポートレート、プロフィール写真' },
  { id: PortraitAspectRatio.VERTICAL, label: '9:16 (縦長)', description: 'スマホ壁紙、TikTok、ストーリーズ' },
];

interface PortraitGeneratorProps {
  onApiError?: () => void;
}

const PortraitGenerator: React.FC<PortraitGeneratorProps> = ({ onApiError }) => {
  // State for Inputs
  const [personImage, setPersonImage] = useState<UploadedFile | null>(null);
  const [bgImage, setBgImage] = useState<UploadedFile | null>(null);
  const [style, setStyle] = useState<ImageStyle>(ImageStyle.CINEMATIC);
  const [aspectRatio, setAspectRatio] = useState<PortraitAspectRatio>(PortraitAspectRatio.WIDE);
  const [userPrompt, setUserPrompt] = useState<string>('');

  // Refinement State
  const [feedbackPrompt, setFeedbackPrompt] = useState<string>('');
  const [feedbackImage, setFeedbackImage] = useState<UploadedFile | null>(null);

  // State for Process
  const [genState, setGenState] = useState<GenerationState>({
    isLoading: false,
    resultImage: null,
    error: null,
  });

  // Handlers for File Uploads
  const handlePersonSelect = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setPersonImage({
        file,
        previewUrl: URL.createObjectURL(file),
        base64
      });
    } catch (e) {
      console.error("Failed to read person file", e);
    }
  };

  const handleBgSelect = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setBgImage({
        file,
        previewUrl: URL.createObjectURL(file),
        base64
      });
    } catch (e) {
      console.error("Failed to read background file", e);
    }
  };

  // Generation Handler
  const handleGenerate = async () => {
    if (!personImage && !bgImage) {
      setGenState(prev => ({ ...prev, error: "「元画像（人物）」または「背景のイメージ」の少なくともどちらか一方をアップロードしてください。" }));
      return;
    }

    setGenState({ isLoading: true, resultImage: null, error: null });

    try {
      const resultBase64 = await generateCreativeImage(
        personImage?.base64 || null,
        bgImage?.base64 || null,
        style,
        userPrompt,
        aspectRatio
      );

      setGenState({
        isLoading: false,
        resultImage: resultBase64,
        error: null
      });

    } catch (error: any) {
      handleError(error);
    }
  };

  // Handler for feedback image
  const handleFeedbackImageSelect = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setFeedbackImage({
        file,
        previewUrl: URL.createObjectURL(file),
        base64
      });
    } catch (e) {
      console.error("Failed to read feedback image", e);
    }
  };

  // Refinement Handler
  const handleRefine = async () => {
    if (!genState.resultImage || (!feedbackPrompt.trim() && !feedbackImage)) {
      return;
    }

    const previousImage = genState.resultImage;
    setGenState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const resultBase64 = await refineImage(
        previousImage,
        feedbackPrompt,
        feedbackImage?.base64 || null,
        aspectRatio
      );

      setGenState({
        isLoading: false,
        resultImage: resultBase64,
        error: null
      });
      setFeedbackPrompt('');
      setFeedbackImage(null);

    } catch (error: any) {
      handleError(error);
      setGenState(prev => ({ ...prev, resultImage: previousImage }));
    }
  };

  const handleError = (error: any) => {
    const errorMessage = error.message || "予期せぬエラーが発生しました。";
    if (errorMessage.includes("429") || errorMessage.includes("rate limit") || errorMessage.includes("quota")) {
      setGenState(prev => ({
        ...prev,
        isLoading: false,
        error: "APIのレート制限に達しました。しばらく待ってから再試行してください。（無料プランは1分あたりの制限があります）"
      }));
    } else if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("403") || errorMessage.includes("Permission denied") || errorMessage.includes("API key not valid")) {
      onApiError?.();
      setGenState(prev => ({
        ...prev,
        isLoading: false,
        error: "APIキーの権限エラーです。APIキーを再選択してください。"
      }));
    } else {
      setGenState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  };

  const handleDownload = () => {
    if (genState.resultImage) {
      const link = document.createElement('a');
      link.href = genState.resultImage;
      link.download = `gemini-generated-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[calc(100vh-8rem)]">

        {/* LEFT PANEL: CONTROLS */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">

          {/* 1. Image Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <Dropzone
              label="① 元画像 (人物)"
              subLabel="顔・特徴を忠実に再現"
              imagePreview={personImage?.previewUrl || null}
              onFileSelect={handlePersonSelect}
              onClear={() => setPersonImage(null)}
            />
            <Dropzone
              label="② 背景のイメージ"
              subLabel="環境・雰囲気の参照"
              imagePreview={bgImage?.previewUrl || null}
              onFileSelect={handleBgSelect}
              onClear={() => setBgImage(null)}
            />
          </div>

          {/* 2. Style Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">③ スタイルを選択</label>
            <div className="grid grid-cols-1 gap-2">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setStyle(opt.id)}
                  className={`
                    w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 flex flex-col
                    ${style === opt.id
                      ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      : 'bg-surface-800 border-surface-700 hover:border-surface-600 hover:bg-surface-700'}
                  `}
                >
                  <span className={`font-medium ${style === opt.id ? 'text-blue-400' : 'text-slate-200'}`}>
                    {opt.label}
                  </span>
                  <span className="text-xs text-slate-500">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2.5 Aspect Ratio Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">④ 出力サイズ</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as PortraitAspectRatio)}
              className="w-full bg-surface-900 border border-surface-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.25em 1.25em',
              }}
            >
              {ASPECT_RATIO_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} - {opt.description}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Text Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">追加の指示 (任意)</label>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="例: 未来的な宇宙服を着ている、背景は夕焼けの砂漠、映画のような照明..."
              className="w-full bg-surface-900 border border-surface-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-24"
            />
          </div>

          {/* Generate Action */}
          <div className="pt-2 mt-auto sticky bottom-0 bg-surface-950 pb-4">
            <Button
              onClick={handleGenerate}
              isLoading={genState.isLoading}
              disabled={(!personImage && !bgImage)}
              className="w-full"
            >
              <Sparkles className="w-5 h-5" />
              画像を生成する
            </Button>
          </div>
        </div>

        {/* RIGHT PANEL: PREVIEW & REFINEMENT */}
        <div className="lg:col-span-8 bg-surface-900 rounded-3xl border border-surface-800 p-1 flex flex-col relative overflow-hidden min-h-[500px]">

          {/* Canvas/Display Area */}
          <div className="flex-1 rounded-2xl bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-surface-950 flex items-center justify-center relative overflow-hidden group">

            {!genState.resultImage && !genState.isLoading && !genState.error && (
              <div className="text-center p-8 max-w-md">
                <div className="w-20 h-20 bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-slate-200 mb-2">準備完了</h3>
                <p className="text-slate-500 leading-relaxed">
                  左側のパネルから「人物」と「背景」の画像をアップロードし、お好みのスタイルを選択してください。<br/>Gemini 3 Proが自然に統合された一枚を生成します。
                </p>
              </div>
            )}

            {genState.isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10 transition-all duration-300">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <p className="text-blue-400 font-medium animate-pulse">Geminiが画像を生成中...</p>
              </div>
            )}

            {genState.error && (
              <div className="max-w-md p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-400 mb-2">生成に失敗しました</h3>
                <p className="text-red-300 text-sm">{genState.error}</p>
              </div>
            )}

            {genState.resultImage && (
              <img
                src={genState.resultImage}
                alt="Generated Result"
                className="w-full h-full object-contain animate-in fade-in zoom-in duration-500"
              />
            )}
          </div>

          {/* Result Toolbar - Download/Reset */}
          {genState.resultImage && !genState.isLoading && (
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              <button
                onClick={handleDownload}
                className="p-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg backdrop-blur-md shadow-lg shadow-blue-900/50 transition-colors"
                title="ダウンロード"
              >
                <Download size={20} />
              </button>
            </div>
          )}

          {/* Refinement Panel (Bottom of Result) */}
          {genState.resultImage && (
            <div className="bg-surface-900 border-t border-surface-800 p-4 animate-in slide-in-from-bottom-5 duration-300">
              <label className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
                <MessageSquarePlus size={14} />
                生成結果へのフィードバック・修正
              </label>
              <div className="flex gap-2 items-start">
                {/* Image upload button and preview */}
                <div className="flex-shrink-0">
                  {feedbackImage ? (
                    <div className="relative w-12 h-12">
                      <img
                        src={feedbackImage.previewUrl}
                        alt="Reference"
                        className="w-12 h-12 rounded-lg object-cover border border-surface-600"
                      />
                      <button
                        onClick={() => setFeedbackImage(null)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                        title="画像を削除"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-12 h-12 bg-surface-950 border border-surface-700 hover:border-surface-500 rounded-lg flex items-center justify-center cursor-pointer transition-colors" title="参照画像を添付">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFeedbackImageSelect(file);
                        }}
                      />
                      <ImagePlus size={20} className="text-slate-500" />
                    </label>
                  )}
                </div>
                <input
                  type="text"
                  value={feedbackPrompt}
                  onChange={(e) => setFeedbackPrompt(e.target.value)}
                  placeholder="例: 背景をもっと暗くして、髪の色を明るく... (Enterで送信)"
                  className="flex-1 bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleRefine();
                    }
                  }}
                />
                <Button
                  onClick={handleRefine}
                  isLoading={genState.isLoading}
                  disabled={!feedbackPrompt.trim() && !feedbackImage}
                  className="whitespace-nowrap px-6"
                  variant="secondary"
                >
                  <Wand2 className="w-4 h-4" />
                  修正して再生成
                </Button>
              </div>
              {feedbackImage && (
                <p className="text-xs text-slate-500 mt-2">
                  参照画像が添付されています。この画像を参考に修正が行われます。
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default PortraitGenerator;
