import React, { useState } from 'react';
import { Dropzone } from './Dropzone';
import { Button } from './Button';
import { fileToBase64, editImage } from '../services/geminiService';
import { Download, Wand2, AlertCircle, RotateCcw, MessageSquarePlus, ImagePlus, X } from 'lucide-react';

interface ImageEditorProps {
  onApiError?: () => void;
}

interface ImageDimensions {
  width: number;
  height: number;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ onApiError }) => {
  // Original image state
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<ImageDimensions | null>(null);

  // Edit prompt
  const [editPrompt, setEditPrompt] = useState('');

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History for multiple edits
  const [editHistory, setEditHistory] = useState<string[]>([]);

  // Refinement state
  const [showRefinement, setShowRefinement] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

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
      setEditHistory([]);
      setError(null);
      setShowRefinement(false);
      setRefinementPrompt('');
      setReferenceImage(null);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('画像の読み込みに失敗しました。');
    }
  };

  const handleClear = () => {
    setOriginalImage(null);
    setOriginalDimensions(null);
    setResultImage(null);
    setEditHistory([]);
    setEditPrompt('');
    setError(null);
    setShowRefinement(false);
    setRefinementPrompt('');
    setReferenceImage(null);
  };

  const handleEdit = async () => {
    if (!originalImage || !editPrompt.trim() || !originalDimensions) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use result image if available (for iterative edits), otherwise use original
      const sourceImage = resultImage || originalImage;

      const result = await editImage(
        sourceImage,
        editPrompt,
        originalDimensions.width,
        originalDimensions.height
      );

      // Save current state to history before updating
      if (resultImage) {
        setEditHistory(prev => [...prev, resultImage]);
      }

      setResultImage(result);
      setEditPrompt(''); // Clear prompt after successful edit
      setShowRefinement(true); // Show refinement option after first edit
    } catch (err: any) {
      console.error('Edit error:', err);
      const errorMessage = err.message || '画像の編集に失敗しました。';
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

  const handleUndo = () => {
    if (editHistory.length > 0) {
      const previousState = editHistory[editHistory.length - 1];
      setResultImage(previousState);
      setEditHistory(prev => prev.slice(0, -1));
    } else if (resultImage) {
      // If no history, revert to original
      setResultImage(null);
    }
  };

  const handleDownload = () => {
    const imageToDownload = resultImage || originalImage;
    if (!imageToDownload) return;

    const link = document.createElement('a');
    link.href = imageToDownload;
    link.download = `edited-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReferenceSelect = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setReferenceImage(`data:${file.type};base64,${base64}`);
    } catch (err) {
      console.error('Error processing reference file:', err);
    }
  };

  const handleRefine = async () => {
    if (!resultImage || !refinementPrompt.trim() || !originalDimensions) return;

    setIsLoading(true);
    setError(null);

    try {
      // Save current state to history
      setEditHistory(prev => [...prev, resultImage]);

      const result = await editImage(
        resultImage,
        refinementPrompt,
        originalDimensions.width,
        originalDimensions.height,
        referenceImage
      );

      setResultImage(result);
      setRefinementPrompt('');
      setReferenceImage(null);
    } catch (err: any) {
      console.error('Refinement error:', err);
      const errorMessage = err.message || '画像の調整に失敗しました。';
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

  const canEdit = originalImage && editPrompt.trim() && originalDimensions && !isLoading;
  const hasResult = resultImage !== null;
  const canUndo = editHistory.length > 0 || resultImage !== null;
  const canRefine = resultImage && refinementPrompt.trim() && !isLoading;

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
              label="編集する画像"
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

          {/* Edit Prompt */}
          <div className="bg-surface-900 rounded-2xl p-5 border border-surface-800">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              編集内容を指示
            </h2>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="どんな編集をしたいか指示してください...&#10;&#10;例:&#10;・背景を青い空に変更&#10;・明るさを上げてコントラストを強調&#10;・人物の服の色を赤に変更&#10;・不要な物体を削除&#10;・写真をアニメ調に変換"
              className="w-full h-40 bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              disabled={!originalImage || isLoading}
            />
            <div className="mt-4 space-y-2">
              <Button
                onClick={handleEdit}
                disabled={!canEdit}
                isLoading={isLoading}
                className="w-full"
              >
                <Wand2 size={18} />
                編集を実行
              </Button>
              {canUndo && (
                <Button
                  variant="secondary"
                  onClick={handleUndo}
                  disabled={isLoading}
                  className="w-full"
                >
                  <RotateCcw size={18} />
                  元に戻す
                </Button>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-surface-900/50 rounded-xl p-4 border border-surface-800">
            <h3 className="text-sm font-medium text-slate-300 mb-2">編集のヒント</h3>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>• 具体的に指示するほど精度が上がります</li>
              <li>• 複数の編集を一度に指示できます</li>
              <li>• 結果が気に入らない場合は「元に戻す」で戻せます</li>
              <li>• 編集後の画像をさらに編集できます</li>
            </ul>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:col-span-8">
          <div className="bg-surface-900 rounded-2xl p-5 border border-surface-800 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">プレビュー</h2>
              {(hasResult || originalImage) && (
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
            <div className="flex-1 flex items-center justify-center min-h-[400px] bg-surface-950 rounded-xl border border-surface-800 overflow-hidden relative">
              {isLoading && (
                <div className="absolute inset-0 bg-surface-950/80 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-slate-400">画像を編集中...</p>
                  </div>
                </div>
              )}

              {resultImage ? (
                <img
                  src={resultImage}
                  alt="Edited result"
                  className="max-w-full max-h-full object-contain"
                />
              ) : originalImage ? (
                <img
                  src={originalImage}
                  alt="Original"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
                    <Wand2 className="text-slate-600" size={28} />
                  </div>
                  <p className="text-slate-500 text-sm">画像をインポートして編集を開始</p>
                  <p className="text-slate-600 text-xs mt-1">出力サイズは元画像のアスペクト比に合わせます</p>
                </div>
              )}
            </div>

            {/* Edit History Indicator */}
            {editHistory.length > 0 && (
              <div className="mt-3 text-xs text-slate-500 text-center">
                編集回数: {editHistory.length + 1}
              </div>
            )}

            {/* Refinement Section */}
            {showRefinement && resultImage && (
              <div className="mt-4 pt-4 border-t border-surface-800">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquarePlus size={18} className="text-blue-400" />
                  <h3 className="text-sm font-medium text-white">さらに調整</h3>
                </div>

                <div className="space-y-3">
                  {/* Reference Image Upload */}
                  <div className="flex items-start gap-3">
                    {referenceImage ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-surface-700 shrink-0">
                        <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setReferenceImage(null)}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-red-500/80 hover:bg-red-500 rounded-full text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="w-16 h-16 rounded-lg border-2 border-dashed border-surface-700 hover:border-surface-600 bg-surface-800 flex flex-col items-center justify-center cursor-pointer shrink-0 transition-colors">
                        <ImagePlus size={16} className="text-slate-500" />
                        <span className="text-[10px] text-slate-500 mt-0.5">参考</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleReferenceSelect(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    )}

                    <div className="flex-1">
                      <textarea
                        value={refinementPrompt}
                        onChange={(e) => setRefinementPrompt(e.target.value)}
                        placeholder="追加の調整内容を入力...&#10;例: もう少し明るく、色味を暖かくして"
                        className="w-full h-16 bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleRefine}
                      disabled={!canRefine}
                      isLoading={isLoading}
                      className="flex-1"
                    >
                      <Wand2 size={16} />
                      調整を適用
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleUndo}
                      disabled={!canUndo || isLoading}
                    >
                      <RotateCcw size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ImageEditor;
