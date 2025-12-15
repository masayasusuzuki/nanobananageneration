import React, { useState } from 'react';
import { Dropzone } from './Dropzone';
import { Button } from './Button';
import { fileToBase64, styleChangeImage, refineStyleChange } from '../services/geminiService';
import { StyleChangeType, StyleChangeAspectRatio } from '../types';
import { STYLE_CHANGE_OPTIONS, STYLE_CHANGE_ASPECT_RATIO_OPTIONS } from '../constants';
import { Download, Wand2, AlertCircle, MessageSquarePlus, ImagePlus, X, Palette, Send } from 'lucide-react';

interface StyleChangerProps {
  onApiError?: () => void;
}

interface ImageDimensions {
  width: number;
  height: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

const StyleChanger: React.FC<StyleChangerProps> = ({ onApiError }) => {
  // Original image state
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<ImageDimensions | null>(null);

  // Style settings
  const [selectedStyle, setSelectedStyle] = useState<StyleChangeType>(StyleChangeType.ANIME);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<StyleChangeAspectRatio>(StyleChangeAspectRatio.ORIGINAL);
  const [userPrompt, setUserPrompt] = useState('');

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAspectRatio, setLastAspectRatio] = useState<string>('16:9');

  // Chat/Feedback state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [feedbackImage, setFeedbackImage] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const dataUri = `data:${file.type};base64,${base64}`;

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
      };
      img.src = dataUri;

      setOriginalImage(dataUri);
      setResultImage(null);
      setError(null);
      setChatMessages([]);
      setFeedbackInput('');
      setFeedbackImage(null);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('画像の読み込みに失敗しました。');
    }
  };

  const handleClear = () => {
    setOriginalImage(null);
    setOriginalDimensions(null);
    setResultImage(null);
    setError(null);
    setChatMessages([]);
    setFeedbackInput('');
    setFeedbackImage(null);
    setUserPrompt('');
  };

  const handleGenerate = async () => {
    if (!originalImage || !originalDimensions) return;

    setIsLoading(true);
    setError(null);

    try {
      // Calculate the actual aspect ratio that will be used
      let outputAspectRatio: string;
      if (selectedAspectRatio === StyleChangeAspectRatio.ORIGINAL) {
        const ratio = originalDimensions.width / originalDimensions.height;
        if (ratio > 1.5) {
          outputAspectRatio = '16:9';
        } else if (ratio < 0.7) {
          outputAspectRatio = '9:16';
        } else if (ratio > 1.2) {
          outputAspectRatio = '4:3';
        } else if (ratio < 0.85) {
          outputAspectRatio = '3:4';
        } else {
          outputAspectRatio = '1:1';
        }
      } else {
        outputAspectRatio = selectedAspectRatio;
      }
      setLastAspectRatio(outputAspectRatio);

      const result = await styleChangeImage(
        originalImage,
        selectedStyle,
        userPrompt,
        selectedAspectRatio,
        originalDimensions.width,
        originalDimensions.height
      );

      setResultImage(result);

      // Add initial generation to chat history
      const styleLabel = STYLE_CHANGE_OPTIONS.find(s => s.id === selectedStyle)?.label || selectedStyle;
      setChatMessages([
        {
          role: 'user',
          content: `${styleLabel}に変換${userPrompt ? `\n追加指示: ${userPrompt}` : ''}`
        },
        {
          role: 'assistant',
          content: 'スタイル変換が完了しました。',
          image: result
        }
      ]);
    } catch (err: any) {
      console.error('Style change error:', err);
      const errorMessage = err.message || 'スタイル変換に失敗しました。';
      if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
        setError('APIのレート制限に達しました。しばらく待ってから再試行してください。');
      } else if (errorMessage.includes('API') || errorMessage.includes('キー') || errorMessage.includes('403')) {
        setError(errorMessage);
        onApiError?.();
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!resultImage || !feedbackInput.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user feedback to chat
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: feedbackInput,
      image: feedbackImage || undefined
    };
    setChatMessages(prev => [...prev, newUserMessage]);

    try {
      const result = await refineStyleChange(
        resultImage,
        feedbackInput,
        feedbackImage,
        lastAspectRatio
      );

      setResultImage(result);

      // Add assistant response to chat
      const newAssistantMessage: ChatMessage = {
        role: 'assistant',
        content: 'フィードバックを反映しました。',
        image: result
      };
      setChatMessages(prev => [...prev, newAssistantMessage]);

      setFeedbackInput('');
      setFeedbackImage(null);
    } catch (err: any) {
      console.error('Feedback refinement error:', err);
      const errorMessage = err.message || 'フィードバックの反映に失敗しました。';
      if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
        setError('APIのレート制限に達しました。しばらく待ってから再試行してください。');
      } else if (errorMessage.includes('API') || errorMessage.includes('キー') || errorMessage.includes('403')) {
        setError(errorMessage);
        onApiError?.();
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackImageSelect = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setFeedbackImage(`data:${file.type};base64,${base64}`);
    } catch (err) {
      console.error('Error processing feedback image:', err);
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;

    // Create an image element to load the base64 data
    const img = new Image();
    img.src = resultImage;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // Create canvas and draw the image
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with white background (for transparency)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the image
    ctx.drawImage(img, 0, 0);

    // Convert to JPEG with high quality
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    const link = document.createElement('a');
    link.href = jpegDataUrl;
    link.download = `style-changed-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canGenerate = originalImage && originalDimensions && !isLoading;
  const hasResult = resultImage !== null;
  const canSubmitFeedback = resultImage && feedbackInput.trim() && !isLoading;

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Image Upload */}
          <div className="bg-surface-900 rounded-2xl p-5 border border-surface-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              画像をインポート
            </h2>
            <Dropzone
              label="変換する画像"
              subLabel="ドラッグ＆ドロップまたはクリック"
              imagePreview={originalImage}
              onFileSelect={handleFileSelect}
              onClear={handleClear}
            />
            {originalDimensions && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                {originalDimensions.width} × {originalDimensions.height} px
              </p>
            )}
          </div>

          {/* Style Selection */}
          <div className="bg-surface-900 rounded-2xl p-5 border border-surface-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              スタイルを選択
            </h2>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value as StyleChangeType)}
              className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              disabled={isLoading}
            >
              {STYLE_CHANGE_OPTIONS.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.label} - {style.description}
                </option>
              ))}
            </select>
          </div>

          {/* Aspect Ratio Selection */}
          <div className="bg-surface-900 rounded-2xl p-5 border border-surface-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
              アスペクト比
            </h2>
            <select
              value={selectedAspectRatio}
              onChange={(e) => setSelectedAspectRatio(e.target.value as StyleChangeAspectRatio)}
              className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              disabled={isLoading}
            >
              {STYLE_CHANGE_ASPECT_RATIO_OPTIONS.map((ratio) => (
                <option key={ratio.id} value={ratio.id}>
                  {ratio.label} - {ratio.description}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Prompt */}
          <div className="bg-surface-900 rounded-2xl p-5 border border-surface-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">4</span>
              追加の指示（任意）
            </h2>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="スタイル変換に関する追加の指示...&#10;&#10;例:&#10;・背景は夕焼けにして&#10;・表情を明るく&#10;・色味を暖かく"
              className="w-full h-28 bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Generate Button */}
          <div className="sticky bottom-4">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              isLoading={isLoading}
              className="w-full"
            >
              <Palette size={18} />
              スタイル変換
            </Button>
          </div>
        </div>

        {/* Right Panel - Preview & Chat */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Preview Area */}
          <div className="bg-surface-900 rounded-2xl p-5 border border-surface-800 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">プレビュー</h2>
              {hasResult && (
                <Button
                  variant="secondary"
                  onClick={handleDownload}
                  disabled={isLoading}
                >
                  <Download size={16} />
                  ダウンロード
                </Button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm text-red-400 font-medium">エラーが発生しました</p>
                  <p className="text-xs text-red-400/80 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Image Preview Area */}
            <div className="flex-1 flex items-center justify-center min-h-[350px] bg-surface-950 rounded-xl border border-surface-800 overflow-hidden relative">
              {isLoading && (
                <div className="absolute inset-0 bg-surface-950/80 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-slate-400">スタイルを変換中...</p>
                  </div>
                </div>
              )}

              {resultImage ? (
                <img
                  src={resultImage}
                  alt="Style changed result"
                  className="max-w-full max-h-full object-contain"
                />
              ) : originalImage ? (
                <div className="text-center p-8">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="max-w-full max-h-[280px] object-contain mx-auto mb-4 rounded-lg opacity-50"
                  />
                  <p className="text-slate-500 text-sm">スタイルを選択して変換を開始</p>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
                    <Palette className="text-slate-600" size={28} />
                  </div>
                  <p className="text-slate-500 text-sm">画像をインポートしてスタイル変換を開始</p>
                  <p className="text-slate-600 text-xs mt-1">アニメ風、CG風、水彩画風など8種類のスタイル</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat/Feedback Section */}
          {hasResult && (
            <div className="bg-surface-900 rounded-2xl p-5 border border-surface-800">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquarePlus size={18} className="text-blue-400" />
                <h3 className="text-sm font-medium text-white">フィードバック（チャット形式で調整）</h3>
              </div>

              {/* Chat Messages */}
              {chatMessages.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto mb-4 space-y-3 pr-2">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-surface-800 text-slate-200'
                        }`}
                      >
                        {message.image && message.role === 'user' && (
                          <img
                            src={message.image}
                            alt="Reference"
                            className="w-16 h-16 object-cover rounded mb-2"
                          />
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Feedback Input */}
              <div className="flex items-start gap-3">
                {/* Reference Image Upload */}
                {feedbackImage ? (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-surface-700 shrink-0">
                    <img src={feedbackImage} alt="Reference" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setFeedbackImage(null)}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-red-500/80 hover:bg-red-500 rounded-full text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="w-14 h-14 rounded-lg border-2 border-dashed border-surface-700 hover:border-surface-600 bg-surface-800 flex flex-col items-center justify-center cursor-pointer shrink-0 transition-colors">
                    <ImagePlus size={16} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 mt-0.5">参考</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFeedbackImageSelect(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                )}

                <div className="flex-1 flex gap-2">
                  <textarea
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && canSubmitFeedback) {
                        e.preventDefault();
                        handleFeedbackSubmit();
                      }
                    }}
                    placeholder="調整したい内容を入力...&#10;例: もう少しアニメ調を強く、色を鮮やかに"
                    className="flex-1 h-14 bg-surface-950 border border-surface-700 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleFeedbackSubmit}
                    disabled={!canSubmitFeedback}
                    isLoading={isLoading}
                    className="h-14 px-4"
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-2">
                Enterで送信 / Shift+Enterで改行 / 参考画像を添付できます
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default StyleChanger;
