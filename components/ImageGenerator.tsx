import React, { useState } from 'react';
import { Button } from './Button';
import { fileToBase64, generateNewImage, refineGeneratedImage } from '../services/geminiService';
import { ImageGenAspectRatio } from '../types';
import { IMAGE_GEN_ASPECT_RATIO_OPTIONS } from '../constants';
import { Download, Wand2, AlertCircle, MessageSquarePlus, ImagePlus, X, Sparkles, Send, Plus } from 'lucide-react';

interface ImageGeneratorProps {
  onApiError?: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onApiError }) => {
  // Prompt state
  const [prompt, setPrompt] = useState('');

  // Reference images state (multiple)
  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  // Aspect ratio
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<ImageGenAspectRatio>(ImageGenAspectRatio.WIDE);

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Chat/Feedback state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [feedbackImage, setFeedbackImage] = useState<string | null>(null);

  const handleReferenceImageSelect = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const dataUri = `data:${file.type};base64,${base64}`;
      setReferenceImages(prev => [...prev, dataUri]);
    } catch (err) {
      console.error('Error processing reference image:', err);
      setError('参考画像の読み込みに失敗しました。');
    }
  };

  const handleRemoveReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setReferenceImages([]);
    setPrompt('');
    setResultImage(null);
    setError(null);
    setChatMessages([]);
    setFeedbackInput('');
    setFeedbackImage(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateNewImage(
        prompt,
        referenceImages,
        selectedAspectRatio
      );

      setResultImage(result);

      // Add initial generation to chat history
      setChatMessages([
        {
          role: 'user',
          content: prompt + (referenceImages.length > 0 ? `\n(参考画像: ${referenceImages.length}枚)` : '')
        },
        {
          role: 'assistant',
          content: '画像を生成しました。',
          image: result
        }
      ]);
    } catch (err: any) {
      console.error('Image generation error:', err);
      const errorMessage = err.message || '画像生成に失敗しました。';
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
      const result = await refineGeneratedImage(
        resultImage,
        feedbackInput,
        feedbackImage,
        selectedAspectRatio
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

  const handleDownload = () => {
    if (!resultImage) return;

    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canGenerate = prompt.trim() && !isLoading;
  const hasResult = resultImage !== null;
  const canSubmitFeedback = resultImage && feedbackInput.trim() && !isLoading;

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Prompt Input */}
          <div className="bg-surface-900 rounded-2xl p-5 border border-surface-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              プロンプトを入力
            </h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="生成したい画像の説明を入力...&#10;&#10;例:&#10;・夕焼けのビーチで遊ぶ犬&#10;・未来都市の夜景、サイバーパンク風&#10;・森の中の小さな小屋、水彩画風"
              className="w-full h-40 bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Reference Images */}
          <div className="bg-surface-900 rounded-2xl p-5 border border-surface-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              参考画像（任意）
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              スタイルや構図の参考にしたい画像を複数枚アップロードできます
            </p>

            {/* Reference Images Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {referenceImages.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-surface-700 group">
                  <img src={img} alt={`Reference ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveReferenceImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
                    {index + 1}
                  </div>
                </div>
              ))}

              {/* Add More Button */}
              <label className="aspect-square rounded-lg border-2 border-dashed border-surface-700 hover:border-surface-600 bg-surface-800 flex flex-col items-center justify-center cursor-pointer transition-colors">
                <Plus size={20} className="text-slate-500" />
                <span className="text-[10px] text-slate-500 mt-1">追加</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleReferenceImageSelect(e.target.files[0]);
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            {referenceImages.length > 0 && (
              <p className="text-xs text-slate-400">
                {referenceImages.length}枚の参考画像を選択中
              </p>
            )}
          </div>

          {/* Aspect Ratio Selection */}
          <div className="bg-surface-900 rounded-2xl p-5 border border-surface-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
              アスペクト比
            </h2>
            <select
              value={selectedAspectRatio}
              onChange={(e) => setSelectedAspectRatio(e.target.value as ImageGenAspectRatio)}
              className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
              disabled={isLoading}
            >
              {IMAGE_GEN_ASPECT_RATIO_OPTIONS.map((ratio) => (
                <option key={ratio.id} value={ratio.id}>
                  {ratio.label} - {ratio.description}
                </option>
              ))}
            </select>
          </div>

          {/* Generate Button */}
          <div className="sticky bottom-4 space-y-2">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              isLoading={isLoading}
              className="w-full"
            >
              <Sparkles size={18} />
              画像を生成
            </Button>
            {(referenceImages.length > 0 || prompt || resultImage) && (
              <Button
                variant="secondary"
                onClick={handleClearAll}
                disabled={isLoading}
                className="w-full"
              >
                すべてクリア
              </Button>
            )}
          </div>
        </div>

        {/* Right Panel - Preview & Chat */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Preview Area */}
          <div className="bg-surface-900 rounded-2xl p-5 border border-surface-800 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">生成結果</h2>
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
                    <p className="text-sm text-slate-400">画像を生成中...</p>
                  </div>
                </div>
              )}

              {resultImage ? (
                <img
                  src={resultImage}
                  alt="Generated result"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="text-slate-600" size={28} />
                  </div>
                  <p className="text-slate-500 text-sm">プロンプトを入力して画像を生成</p>
                  <p className="text-slate-600 text-xs mt-1">参考画像を追加するとスタイルを参照できます</p>
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
                    placeholder="調整したい内容を入力...&#10;例: もう少し明るく、背景を夕焼けに"
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

export default ImageGenerator;
