import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface DropzoneProps {
  label: string;
  subLabel?: string;
  imagePreview: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  compact?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  label,
  subLabel,
  imagePreview,
  onFileSelect,
  onClear,
  compact = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcess(e.target.files[0]);
    }
  };

  const validateAndProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルをアップロードしてください。');
      return;
    }
    onFileSelect(file);
  };

  if (compact) {
    return (
      <div className="w-full">
        {imagePreview ? (
          <div className="relative group w-full aspect-square rounded-xl overflow-hidden border border-slate-700 bg-surface-800">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={onClear}
                className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              w-full aspect-square rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center p-2
              ${isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700 hover:border-slate-600 bg-surface-800 hover:bg-surface-800/80'}
            `}
          >
            <ImageIcon size={18} className="text-slate-500 mb-1" />
            <p className="text-xs text-slate-400">{label}</p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleChange}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>

      {imagePreview ? (
        <div className="relative group w-full aspect-square rounded-2xl overflow-hidden border border-slate-700 bg-surface-800">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={onClear}
              className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
             <p className="text-xs text-center text-white font-medium">{subLabel || '読み込み完了'}</p>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            w-full aspect-square rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center p-4
            ${isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700 hover:border-slate-600 bg-surface-800 hover:bg-surface-800/80'}
          `}
        >
          <div className="p-4 rounded-full bg-surface-900 text-slate-400 mb-3">
            <ImageIcon size={24} />
          </div>
          <p className="text-sm font-medium text-slate-300 mb-1">クリックして選択</p>
          <p className="text-xs text-slate-500">またはドラッグ＆ドロップ</p>
          {subLabel && <p className="text-xs text-blue-400 mt-2">{subLabel}</p>}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleChange}
          />
        </div>
      )}
    </div>
  );
};