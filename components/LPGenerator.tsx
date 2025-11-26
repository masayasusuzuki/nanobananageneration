import React, { useState } from 'react';
import { UploadedFile, LPSection, LPTone, LPGenerationState } from '../types';
import { LP_SECTION_OPTIONS, LP_TONE_OPTIONS } from '../constants';
import { generateLPSection, refineLPSection, fileToBase64 } from '../services/geminiService';
import { Dropzone } from './Dropzone';
import { Button } from './Button';
import { Sparkles, Download, AlertCircle, MessageSquarePlus, Wand2, ImagePlus, X, Layout, ChevronDown, Layers } from 'lucide-react';

const LPGenerator: React.FC = () => {
  // Section & Tone
  const [section, setSection] = useState<LPSection>(LPSection.HERO);
  const [tone, setTone] = useState<LPTone>(LPTone.PROFESSIONAL);

  // Existing Blocks for consistency (2 slots)
  const [existingBlocks, setExistingBlocks] = useState<(UploadedFile | null)[]>([null, null]);

  // Material Images (3 slots)
  const [materialImages, setMaterialImages] = useState<(UploadedFile | null)[]>([null, null, null]);

  // Tone Reference Image
  const [toneImage, setToneImage] = useState<UploadedFile | null>(null);

  // Content Text
  const [contentText, setContentText] = useState<string>('');

  // Additional Prompt
  const [additionalPrompt, setAdditionalPrompt] = useState<string>('');

  // Refinement State
  const [feedbackPrompt, setFeedbackPrompt] = useState<string>('');
  const [feedbackImage, setFeedbackImage] = useState<UploadedFile | null>(null);

  // Generation State
  const [genState, setGenState] = useState<LPGenerationState>({
    isLoading: false,
    resultImage: null,
    error: null,
  });

  // Handlers for existing blocks
  const handleExistingBlockSelect = async (file: File, index: number) => {
    try {
      const base64 = await fileToBase64(file);
      const newBlocks = [...existingBlocks];
      newBlocks[index] = {
        file,
        previewUrl: URL.createObjectURL(file),
        base64
      };
      setExistingBlocks(newBlocks);
    } catch (e) {
      console.error("Failed to read existing block file", e);
    }
  };

  const handleExistingBlockClear = (index: number) => {
    const newBlocks = [...existingBlocks];
    newBlocks[index] = null;
    setExistingBlocks(newBlocks);
  };

  // Handlers for material images
  const handleMaterialSelect = async (file: File, index: number) => {
    try {
      const base64 = await fileToBase64(file);
      const newMaterials = [...materialImages];
      newMaterials[index] = {
        file,
        previewUrl: URL.createObjectURL(file),
        base64
      };
      setMaterialImages(newMaterials);
    } catch (e) {
      console.error("Failed to read material file", e);
    }
  };

  const handleMaterialClear = (index: number) => {
    const newMaterials = [...materialImages];
    newMaterials[index] = null;
    setMaterialImages(newMaterials);
  };

  const handleToneImageSelect = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setToneImage({
        file,
        previewUrl: URL.createObjectURL(file),
        base64
      });
    } catch (e) {
      console.error("Failed to read tone image", e);
    }
  };

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

  const handleGenerate = async () => {
    setGenState({ isLoading: true, resultImage: null, error: null });

    try {
      const materialBase64s = materialImages.map(m => m?.base64 || null);
      const existingBlockBase64s = existingBlocks.map(b => b?.base64 || null);
      const resultBase64 = await generateLPSection(
        section,
        tone,
        materialBase64s,
        toneImage?.base64 || null,
        contentText,
        additionalPrompt,
        existingBlockBase64s
      );

      setGenState({
        isLoading: false,
        resultImage: resultBase64,
        error: null
      });

    } catch (error: any) {
      setGenState({
        isLoading: false,
        resultImage: null,
        error: error.message || "予期せぬエラーが発生しました。"
      });
    }
  };

  const handleRefine = async () => {
    if (!genState.resultImage || (!feedbackPrompt.trim() && !feedbackImage)) {
      return;
    }

    const previousImage = genState.resultImage;
    setGenState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const resultBase64 = await refineLPSection(
        previousImage,
        feedbackPrompt,
        feedbackImage?.base64 || null
      );

      setGenState({
        isLoading: false,
        resultImage: resultBase64,
        error: null
      });
      setFeedbackPrompt('');
      setFeedbackImage(null);

    } catch (error: any) {
      setGenState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || "予期せぬエラーが発生しました。",
        resultImage: previousImage
      }));
    }
  };

  const handleDownload = () => {
    if (genState.resultImage) {
      const link = document.createElement('a');
      link.href = genState.resultImage;
      link.download = `lp-${section}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[calc(100vh-8rem)]">

        {/* LEFT PANEL: CONTROLS */}
        <div className="lg:col-span-4 flex flex-col gap-5 h-full overflow-y-auto pr-2 custom-scrollbar">

          {/* 1. Section Selection (Dropdown) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">① LPセクション</label>
            <div className="relative">
              <select
                value={section}
                onChange={(e) => setSection(e.target.value as LPSection)}
                className="w-full bg-surface-900 border border-surface-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
              >
                {LP_SECTION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* 2. Tone Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">② トンマナ（デザインテイスト）</label>
            <div className="grid grid-cols-2 gap-2">
              {LP_TONE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTone(opt.id)}
                  className={`
                    text-left px-3 py-2 rounded-lg border transition-all duration-200
                    ${tone === opt.id
                      ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                      : 'bg-surface-800 border-surface-700 hover:border-surface-600 hover:bg-surface-700'}
                  `}
                >
                  <span className={`text-sm font-medium ${tone === opt.id ? 'text-blue-400' : 'text-slate-200'}`}>
                    {opt.label}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Existing Blocks for Consistency */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Layers size={14} className="text-blue-400" />
              ③ 既存ブロック（トンマナ統一用）
            </label>
            <p className="text-xs text-slate-500 -mt-1">同じLPの他セクションをインポートしてデザインを統一</p>
            <div className="grid grid-cols-2 gap-2">
              {existingBlocks.map((img, index) => (
                <Dropzone
                  key={index}
                  label={`既存 ${index + 1}`}
                  subLabel=""
                  imagePreview={img?.previewUrl || null}
                  onFileSelect={(file) => handleExistingBlockSelect(file, index)}
                  onClear={() => handleExistingBlockClear(index)}
                  compact
                />
              ))}
            </div>
          </div>

          {/* 4. Tone Reference Image */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">④ トンマナ参照画像（任意）</label>
            <Dropzone
              label="参照デザイン"
              subLabel="色味・雰囲気の参考"
              imagePreview={toneImage?.previewUrl || null}
              onFileSelect={handleToneImageSelect}
              onClear={() => setToneImage(null)}
              compact
            />
          </div>

          {/* 5. Material Images */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">⑤ 素材画像（最大3枚）</label>
            <div className="grid grid-cols-3 gap-2">
              {materialImages.map((img, index) => (
                <Dropzone
                  key={index}
                  label={`素材 ${index + 1}`}
                  subLabel=""
                  imagePreview={img?.previewUrl || null}
                  onFileSelect={(file) => handleMaterialSelect(file, index)}
                  onClear={() => handleMaterialClear(index)}
                  compact
                />
              ))}
            </div>
          </div>

          {/* 6. Content Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">⑥ LPに入れるテキスト情報</label>
            <textarea
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="ヘッドライン、サブコピー、説明文、CTAボタンのテキストなど..."
              className="w-full bg-surface-900 border border-surface-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-28"
            />
          </div>

          {/* 7. Additional Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">⑦ 追加の指示（任意）</label>
            <textarea
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              placeholder="例: グラデーション背景、アイコンを3つ配置、左にテキスト右に画像..."
              className="w-full bg-surface-900 border border-surface-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-20"
            />
          </div>

          {/* Generate Action */}
          <div className="pt-2 mt-auto sticky bottom-0 bg-surface-950 pb-4">
            <Button
              onClick={handleGenerate}
              isLoading={genState.isLoading}
              className="w-full"
            >
              <Layout className="w-5 h-5" />
              LPセクションを生成
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
                  <Layout className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-slate-200 mb-2">LP制作モード</h3>
                <p className="text-slate-500 leading-relaxed">
                  左側のパネルから「セクション種類」「トンマナ」を選択し、素材画像やテキスト情報を入力してください。<br/>Gemini 3 ProがLPセクションのデザインを生成します。
                </p>
              </div>
            )}

            {genState.isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10 transition-all duration-300">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <p className="text-blue-400 font-medium animate-pulse">LPセクションを生成中...</p>
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
                alt="Generated LP Section"
                className="w-full h-full object-contain animate-in fade-in zoom-in duration-500"
              />
            )}
          </div>

          {/* Result Toolbar - Download */}
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

          {/* Refinement Panel */}
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
                  placeholder="例: ボタンを大きく、背景色をもっと明るく... (Enterで送信)"
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

export default LPGenerator;
