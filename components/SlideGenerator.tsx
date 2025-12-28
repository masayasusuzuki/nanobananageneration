import React, { useState } from 'react';
import { Button } from './Button';
import { generateSlideTemplates, generateSlidePage, regenerateSlidePage } from '../services/geminiService';
import { SlidePageType, SlideWorkflowPhase, SlideGenerationMode, SlideAspectRatio, SlideTemplate, SlidePage } from '../types';
import { SLIDE_PAGE_TYPE_OPTIONS, SLIDE_ASPECT_RATIO_OPTIONS, SLIDE_GENERATION_MODE_OPTIONS, SLIDE_LIMITS } from '../constants';
import { Download, Presentation, AlertCircle, Plus, Trash2, RefreshCw, ChevronLeft, ChevronRight, Check, Loader2, X, Edit3 } from 'lucide-react';

interface SlideGeneratorProps {
  onApiError?: () => void;
}

const SlideGenerator: React.FC<SlideGeneratorProps> = ({ onApiError }) => {
  // Workflow phase
  const [currentPhase, setCurrentPhase] = useState<SlideWorkflowPhase>(SlideWorkflowPhase.TEMPLATE_GENERATION);

  // Template phase state
  const [themePrompt, setThemePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<SlideAspectRatio>(SlideAspectRatio.WIDE);
  const [templates, setTemplates] = useState<SlideTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isGeneratingTemplates, setIsGeneratingTemplates] = useState(false);

  // Page setup state
  const [pages, setPages] = useState<SlidePage[]>([]);
  const [generationMode, setGenerationMode] = useState<SlideGenerationMode>(SlideGenerationMode.ALL_AT_ONCE);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number | null>(null);

  // Editing state
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editFeedback, setEditFeedback] = useState('');

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Get selected template
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Create initial pages
  const createInitialPages = (count: number = 3) => {
    const newPages: SlidePage[] = [];
    for (let i = 0; i < count; i++) {
      newPages.push({
        id: `page-${Date.now()}-${i}`,
        pageNumber: i + 1,
        pageType: i === 0 ? SlidePageType.TITLE : SlidePageType.CONTENT,
        prompt: '',
        generatedImage: null,
        isGenerating: false,
        error: null,
      });
    }
    setPages(newPages);
  };

  // Handle template generation
  const handleGenerateTemplates = async () => {
    if (!themePrompt.trim()) return;

    setIsGeneratingTemplates(true);
    setError(null);
    setTemplates([]);

    try {
      const result = await generateSlideTemplates(themePrompt, aspectRatio, SLIDE_LIMITS.TEMPLATE_COUNT);
      setTemplates(result);
      setCurrentPhase(SlideWorkflowPhase.TEMPLATE_SELECTION);
    } catch (err: any) {
      console.error('Template generation error:', err);
      setError(err.message || 'テンプレートの生成に失敗しました。');
      if (err.message?.includes('API') || err.message?.includes('キー')) {
        onApiError?.();
      }
    } finally {
      setIsGeneratingTemplates(false);
    }
  };

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  // Proceed to page setup
  const handleProceedToPageSetup = () => {
    if (!selectedTemplateId) return;
    createInitialPages(3);
    setCurrentPhase(SlideWorkflowPhase.PAGE_SETUP);
  };

  // Add page
  const handleAddPage = () => {
    if (pages.length >= SLIDE_LIMITS.MAX_TOTAL_PAGES) return;

    const newPage: SlidePage = {
      id: `page-${Date.now()}`,
      pageNumber: pages.length + 1,
      pageType: SlidePageType.CONTENT,
      prompt: '',
      generatedImage: null,
      isGenerating: false,
      error: null,
    };
    setPages([...pages, newPage]);
  };

  // Add batch pages
  const handleAddBatchPages = () => {
    const remaining = SLIDE_LIMITS.MAX_TOTAL_PAGES - pages.length;
    const toAdd = Math.min(SLIDE_LIMITS.PAGES_PER_BATCH, remaining);

    const newPages: SlidePage[] = [];
    for (let i = 0; i < toAdd; i++) {
      newPages.push({
        id: `page-${Date.now()}-${i}`,
        pageNumber: pages.length + i + 1,
        pageType: SlidePageType.CONTENT,
        prompt: '',
        generatedImage: null,
        isGenerating: false,
        error: null,
      });
    }
    setPages([...pages, ...newPages]);
  };

  // Remove page
  const handleRemovePage = (pageId: string) => {
    if (pages.length <= 1) return;
    const newPages = pages.filter(p => p.id !== pageId).map((p, idx) => ({
      ...p,
      pageNumber: idx + 1,
    }));
    setPages(newPages);
  };

  // Update page (using functional update to avoid stale closure)
  const handleUpdatePage = (pageId: string, updates: Partial<SlidePage>) => {
    setPages(prevPages => prevPages.map(p => p.id === pageId ? { ...p, ...updates } : p));
  };

  // Generate all slides
  const handleGenerateAll = async () => {
    if (!selectedTemplate) return;

    const pagesToGenerate = pages.filter(p => p.prompt.trim());
    if (pagesToGenerate.length === 0) {
      setError('少なくとも1ページにプロンプトを入力してください。');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCurrentPhase(SlideWorkflowPhase.GENERATION);

    const existingSlides: string[] = [];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (!page.prompt.trim()) continue;

      setCurrentGeneratingIndex(i);
      handleUpdatePage(page.id, { isGenerating: true, error: null });

      try {
        const templateImage = page.pageType === SlidePageType.TITLE
          ? selectedTemplate.titleImageBase64
          : selectedTemplate.contentImageBase64;
        const result = await generateSlidePage(
          page.prompt,
          page.pageType,
          templateImage,
          aspectRatio,
          existingSlides,
          page.pageNumber
        );

        handleUpdatePage(page.id, { generatedImage: result, isGenerating: false });
        existingSlides.push(result);
      } catch (err: any) {
        console.error(`Slide ${i + 1} generation error:`, err);
        handleUpdatePage(page.id, { error: err.message, isGenerating: false });
      }
    }

    setIsGenerating(false);
    setCurrentGeneratingIndex(null);
    setCurrentPhase(SlideWorkflowPhase.EDITING);
  };

  // Generate one by one
  const handleGenerateOneByOne = async () => {
    if (!selectedTemplate) return;

    const nextPage = pages.find(p => !p.generatedImage && p.prompt.trim());
    if (!nextPage) {
      setCurrentPhase(SlideWorkflowPhase.EDITING);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCurrentPhase(SlideWorkflowPhase.GENERATION);

    const pageIndex = pages.findIndex(p => p.id === nextPage.id);
    setCurrentGeneratingIndex(pageIndex);
    handleUpdatePage(nextPage.id, { isGenerating: true, error: null });

    const existingSlides = pages
      .filter(p => p.generatedImage)
      .map(p => p.generatedImage!);

    try {
      const templateImage = nextPage.pageType === SlidePageType.TITLE
        ? selectedTemplate.titleImageBase64
        : selectedTemplate.contentImageBase64;
      const result = await generateSlidePage(
        nextPage.prompt,
        nextPage.pageType,
        templateImage,
        aspectRatio,
        existingSlides,
        nextPage.pageNumber
      );

      handleUpdatePage(nextPage.id, { generatedImage: result, isGenerating: false });
    } catch (err: any) {
      console.error('Slide generation error:', err);
      handleUpdatePage(nextPage.id, { error: err.message, isGenerating: false });
    }

    setIsGenerating(false);
    setCurrentGeneratingIndex(null);

    // Check if more pages to generate
    const remainingPages = pages.filter(p => !p.generatedImage && p.prompt.trim() && p.id !== nextPage.id);
    if (remainingPages.length === 0) {
      setCurrentPhase(SlideWorkflowPhase.EDITING);
    }
  };

  // Regenerate a page
  const handleRegeneratePage = async (pageId: string) => {
    if (!selectedTemplate) return;

    const page = pages.find(p => p.id === pageId);
    if (!page || !page.generatedImage) return;

    handleUpdatePage(pageId, { isGenerating: true, error: null });

    try {
      const templateImage = page.pageType === SlidePageType.TITLE
        ? selectedTemplate.titleImageBase64
        : selectedTemplate.contentImageBase64;
      const result = await regenerateSlidePage(
        page.generatedImage,
        page.prompt,
        page.pageType,
        templateImage,
        aspectRatio,
        editFeedback || '同じ内容で再生成'
      );

      handleUpdatePage(pageId, { generatedImage: result, isGenerating: false });
      setEditingPageId(null);
      setEditFeedback('');
    } catch (err: any) {
      console.error('Regeneration error:', err);
      handleUpdatePage(pageId, { error: err.message, isGenerating: false });
    }
  };

  // Download single slide
  const handleDownloadSlide = (page: SlidePage) => {
    if (!page.generatedImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const jpegUrl = canvas.toDataURL('image/jpeg', 0.92);
      const link = document.createElement('a');
      link.download = `slide-${page.pageNumber}.jpg`;
      link.href = jpegUrl;
      link.click();
    };

    img.src = page.generatedImage;
  };

  // Download all slides
  const handleDownloadAll = () => {
    const generatedPages = pages.filter(p => p.generatedImage);
    generatedPages.forEach((page, index) => {
      setTimeout(() => handleDownloadSlide(page), index * 500);
    });
  };

  // Reset to start
  const handleReset = () => {
    setCurrentPhase(SlideWorkflowPhase.TEMPLATE_GENERATION);
    setThemePrompt('');
    setTemplates([]);
    setSelectedTemplateId(null);
    setPages([]);
    setError(null);
    setEditingPageId(null);
    setEditFeedback('');
  };

  // Render template generation phase
  const renderTemplateGeneration = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Presentation size={24} />
          スライドテーマを入力
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              テーマ・コンセプト
            </label>
            <textarea
              value={themePrompt}
              onChange={(e) => setThemePrompt(e.target.value)}
              placeholder="例: テクノロジー企業の製品紹介、モダンでクリーンなデザイン"
              className="w-full h-24 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              アスペクト比
            </label>
            <div className="flex gap-2">
              {SLIDE_ASPECT_RATIO_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => setAspectRatio(option.id)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    aspectRatio === option.id
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-surface-800 border-surface-700 text-slate-400 hover:border-surface-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <Button
            onClick={handleGenerateTemplates}
            disabled={!themePrompt.trim() || isGeneratingTemplates}
            variant="primary"
            className="w-full"
          >
            {isGeneratingTemplates ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                テンプレート生成中...
              </>
            ) : (
              <>
                <Presentation size={16} />
                テンプレートを生成
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // Render template selection phase
  const renderTemplateSelection = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          テンプレートを選択
        </h2>

        <div className="space-y-6 mb-6">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleSelectTemplate(template.id)}
              className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                selectedTemplateId === template.id
                  ? 'border-blue-500 ring-2 ring-blue-500/30'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              {selectedTemplateId === template.id && (
                <div className="absolute top-3 right-3 z-10 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Check size={16} className="text-white" />
                </div>
              )}
              <div className="p-4 bg-slate-800">
                <p className="text-sm font-medium text-slate-200 mb-3">{template.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">タイトルページ</p>
                    <img
                      src={template.titleImageBase64}
                      alt={`${template.description} - タイトル`}
                      className="w-full aspect-video object-cover rounded-lg border border-slate-600"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">コンテンツページ</p>
                    <img
                      src={template.contentImageBase64}
                      alt={`${template.description} - コンテンツ`}
                      className="w-full aspect-video object-cover rounded-lg border border-slate-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => {
              setTemplates([]);
              handleGenerateTemplates();
            }}
            variant="secondary"
            disabled={isGeneratingTemplates}
          >
            <RefreshCw size={16} />
            再生成
          </Button>
          <Button
            onClick={handleProceedToPageSetup}
            disabled={!selectedTemplateId}
            variant="primary"
            className="flex-1"
          >
            このテンプレートで続ける
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );

  // Render page setup phase
  const renderPageSetup = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            スライドページを設定
          </h2>
          <span className="text-sm text-slate-400">
            {pages.length} / {SLIDE_LIMITS.MAX_INITIAL_PAGES} ページ
          </span>
        </div>

        {/* Selected template preview */}
        {selectedTemplate && (
          <div className="mb-4 p-3 bg-slate-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-300">選択中のテンプレート</p>
              <button
                onClick={() => setCurrentPhase(SlideWorkflowPhase.TEMPLATE_SELECTION)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                変更する
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <img
                src={selectedTemplate.titleImageBase64}
                alt="Title template"
                className="w-full h-16 object-cover rounded border border-slate-600"
              />
              <img
                src={selectedTemplate.contentImageBase64}
                alt="Content template"
                className="w-full h-16 object-cover rounded border border-slate-600"
              />
            </div>
          </div>
        )}

        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className="p-4 bg-surface-800 rounded-lg border border-surface-700"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-medium text-slate-400 w-16">
                  Page {page.pageNumber}
                </span>
                <select
                  value={page.pageType}
                  onChange={(e) => handleUpdatePage(page.id, { pageType: e.target.value as SlidePageType })}
                  className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100"
                >
                  {SLIDE_PAGE_TYPE_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {pages.length > 1 && (
                  <button
                    onClick={() => handleRemovePage(page.id)}
                    className="ml-auto p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <textarea
                value={page.prompt}
                onChange={(e) => handleUpdatePage(page.id, { prompt: e.target.value })}
                placeholder={page.pageType === SlidePageType.TITLE
                  ? "タイトルとサブタイトルを入力..."
                  : "スライドに表示する内容を入力..."}
                className="w-full h-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        {pages.length < SLIDE_LIMITS.MAX_INITIAL_PAGES && (
          <button
            onClick={handleAddPage}
            className="w-full py-2 border-2 border-dashed border-surface-700 rounded-lg text-slate-400 hover:border-surface-600 hover:text-slate-300 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            ページを追加
          </button>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              生成モード
            </label>
            <div className="flex gap-2">
              {SLIDE_GENERATION_MODE_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => setGenerationMode(option.id)}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm transition-all ${
                    generationMode === option.id
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-surface-800 border-surface-700 text-slate-400 hover:border-surface-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={generationMode === SlideGenerationMode.ALL_AT_ONCE ? handleGenerateAll : handleGenerateOneByOne}
            disabled={isGenerating || pages.every(p => !p.prompt.trim())}
            variant="primary"
            className="w-full"
          >
            <Presentation size={16} />
            スライドを生成
          </Button>
        </div>
      </div>
    </div>
  );

  // Render generation progress
  const renderGeneration = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Loader2 className="animate-spin" size={24} />
          スライド生成中...
        </h2>

        <div className="space-y-3">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className={`p-4 rounded-lg border ${
                page.isGenerating
                  ? 'bg-blue-900/20 border-blue-700'
                  : page.generatedImage
                  ? 'bg-green-900/20 border-green-700'
                  : page.error
                  ? 'bg-red-900/20 border-red-700'
                  : 'bg-surface-800 border-surface-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-300">
                  Page {page.pageNumber}
                </span>
                {page.isGenerating && (
                  <Loader2 className="animate-spin text-blue-400" size={16} />
                )}
                {page.generatedImage && (
                  <Check className="text-green-400" size={16} />
                )}
                {page.error && (
                  <AlertCircle className="text-red-400" size={16} />
                )}
              </div>
            </div>
          ))}
        </div>

        {generationMode === SlideGenerationMode.ONE_BY_ONE && !isGenerating && (
          <div className="mt-4 flex gap-3">
            <Button onClick={handleGenerateOneByOne} variant="primary" className="flex-1">
              次のスライドを生成
            </Button>
            <Button onClick={() => setCurrentPhase(SlideWorkflowPhase.EDITING)} variant="secondary">
              編集画面へ
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // Render editing phase
  const renderEditing = () => {
    const generatedPages = pages.filter(p => p.generatedImage);
    const editingPage = editingPageId ? pages.find(p => p.id === editingPageId) : null;

    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            生成されたスライド ({generatedPages.length}枚)
          </h2>
          <div className="flex gap-2">
            <Button onClick={handleDownloadAll} variant="secondary" disabled={generatedPages.length === 0}>
              <Download size={16} />
              全てダウンロード
            </Button>
            <Button onClick={handleReset} variant="secondary">
              新規作成
            </Button>
          </div>
        </div>

        {/* Slide grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                editingPageId === page.id
                  ? 'border-blue-500 ring-2 ring-blue-500/30'
                  : 'border-surface-700 hover:border-surface-600'
              }`}
            >
              {page.generatedImage ? (
                <>
                  <img
                    src={page.generatedImage}
                    alt={`Slide ${page.pageNumber}`}
                    className="w-full aspect-video object-cover cursor-pointer"
                    onClick={() => setEditingPageId(page.id)}
                  />
                  {page.isGenerating && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={24} />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full aspect-video bg-surface-800 flex items-center justify-center">
                  {page.isGenerating ? (
                    <Loader2 className="animate-spin text-slate-500" size={24} />
                  ) : page.error ? (
                    <AlertCircle className="text-red-400" size={24} />
                  ) : (
                    <span className="text-slate-500 text-sm">未生成</span>
                  )}
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white font-medium">
                    Page {page.pageNumber}
                  </span>
                  {page.generatedImage && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingPageId(page.id)}
                        className="p-1 text-white/80 hover:text-white"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDownloadSlide(page)}
                        className="p-1 text-white/80 hover:text-white"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add more pages */}
        {pages.length < SLIDE_LIMITS.MAX_TOTAL_PAGES && (
          <button
            onClick={handleAddBatchPages}
            className="w-full py-3 border-2 border-dashed border-surface-700 rounded-lg text-slate-400 hover:border-surface-600 hover:text-slate-300 transition-all flex items-center justify-center gap-2 mb-6"
          >
            <Plus size={16} />
            {SLIDE_LIMITS.PAGES_PER_BATCH}ページ追加
          </button>
        )}

        {/* Editing panel */}
        {editingPage && (
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Page {editingPage.pageNumber} を編集
              </h3>
              <button
                onClick={() => {
                  setEditingPageId(null);
                  setEditFeedback('');
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Preview */}
              <div>
                {editingPage.generatedImage && (
                  <img
                    src={editingPage.generatedImage}
                    alt={`Slide ${editingPage.pageNumber}`}
                    className="w-full rounded-lg"
                  />
                )}
              </div>

              {/* Edit controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    ページタイプ
                  </label>
                  <select
                    value={editingPage.pageType}
                    onChange={(e) => handleUpdatePage(editingPage.id, { pageType: e.target.value as SlidePageType })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100"
                  >
                    {SLIDE_PAGE_TYPE_OPTIONS.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    コンテンツ
                  </label>
                  <textarea
                    value={editingPage.prompt}
                    onChange={(e) => handleUpdatePage(editingPage.id, { prompt: e.target.value })}
                    className="w-full h-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    修正指示（オプション）
                  </label>
                  <textarea
                    value={editFeedback}
                    onChange={(e) => setEditFeedback(e.target.value)}
                    placeholder="例: 文字を大きく、色をもっと明るく..."
                    className="w-full h-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <Button
                  onClick={() => handleRegeneratePage(editingPage.id)}
                  disabled={editingPage.isGenerating}
                  variant="primary"
                  className="w-full"
                >
                  {editingPage.isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      再生成中...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      再生成
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="flex-1 p-6">
      {currentPhase === SlideWorkflowPhase.TEMPLATE_GENERATION && renderTemplateGeneration()}
      {currentPhase === SlideWorkflowPhase.TEMPLATE_SELECTION && renderTemplateSelection()}
      {currentPhase === SlideWorkflowPhase.PAGE_SETUP && renderPageSetup()}
      {currentPhase === SlideWorkflowPhase.GENERATION && renderGeneration()}
      {currentPhase === SlideWorkflowPhase.EDITING && renderEditing()}
    </main>
  );
};

export default SlideGenerator;
