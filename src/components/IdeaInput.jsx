import React, { useRef, useEffect, useCallback } from 'react';
import { 
  HiOutlineDesktopComputer, 
  HiOutlineDeviceMobile, 
  HiOutlineColorSwatch,
  HiOutlineLightningBolt, 
  HiOutlineDocumentReport,
  HiCheckCircle,
  HiSparkles
} from 'react-icons/hi';

const MAX_CHARS = 1200;
const MIN_HEIGHT = 180;
const MAX_HEIGHT = 320;

const PLATFORMS = [
  {
    id: 'web',
    title: 'Web Application',
    desc: 'React · Next.js · Node.js',
    icon: HiOutlineDesktopComputer,
  },
  {
    id: 'mobile',
    title: 'Mobile Application',
    desc: 'React Native · iOS · Android',
    icon: HiOutlineDeviceMobile,
  },
  {
    id: 'both',
    title: 'Cross Platform',
    desc: 'Unified architecture',
    icon: HiOutlineColorSwatch,
  },
];

const DETAIL_LEVELS = [
  {
    id: 'brief',
    title: 'Quick Overview',
    subtitle: 'Fast generation',
    desc: 'High-level architecture',
    icon: HiOutlineLightningBolt,
  },
  {
    id: 'full',
    title: 'Detailed Blueprint',
    subtitle: 'Complete architecture',
    desc: 'Database, API, infrastructure and security',
    icon: HiOutlineDocumentReport,
  },
];

const EXAMPLE_PROMPTS = [
  { label: 'E-commerce marketplace', text: 'An e-commerce marketplace where local artisanal makers sell handmade goods. Includes vendor stores, multi-vendor cart, Stripe split payouts, order tracking, and inventory sync.' },
  { label: 'Task management SaaS', text: 'A collaborative task management SaaS for engineering teams with real-time Kanban boards, sprint cycles, GitHub PR webhooks, Slack alerts, and role-based permissions.' },
  { label: 'Food delivery platform', text: 'A hyper-local food delivery platform with customer ordering app, courier dispatch algorithm, restaurant tablet interface, live GPS delivery tracking, and automated refund dispute resolution.' },
  { label: 'Learning management system', text: 'A cohort-based learning management system featuring video courses, interactive coding exercises, student progress analytics, assignment grading, and discussion forums.' },
  { label: 'Inventory management system', text: 'A B2B warehouse inventory management system with barcode scanning, automated low-stock reorder triggers, multi-warehouse transfers, supplier PO tracking, and ERP integration.' },
];

export default function IdeaInput({
  value,
  onChange,
  platform,
  onPlatformChange,
  detailLevel,
  onDetailChange,
  onGenerate,
  isGenerating,
  focusSignal = 0,
}) {
  const textareaRef = useRef(null);

  // Auto-grow textarea logic
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const scrollH = el.scrollHeight;
    el.style.height = `${Math.min(Math.max(scrollH, MIN_HEIGHT), MAX_HEIGHT)}px`;
    el.style.overflowY = scrollH > MAX_HEIGHT ? 'auto' : 'hidden';
  }, [value]);

  // Focus signal from chip or external trigger
  useEffect(() => {
    if (!focusSignal) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [focusSignal]);

  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isGenerating && value.trim()) {
          onGenerate();
        }
      }
    },
    [value, isGenerating, onGenerate]
  );

  const canGenerate = !isGenerating && value.trim().length > 0;

  // Keyboard navigation for radio groups
  const handlePlatformKeyDown = (e, index) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (index + 1) % PLATFORMS.length;
      onPlatformChange(PLATFORMS[nextIdx].id);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (index - 1 + PLATFORMS.length) % PLATFORMS.length;
      onPlatformChange(PLATFORMS[prevIdx].id);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onPlatformChange(PLATFORMS[index].id);
    }
  };

  const handleDetailKeyDown = (e, index) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIdx = (index + 1) % DETAIL_LEVELS.length;
      onDetailChange(DETAIL_LEVELS[nextIdx].id);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onDetailChange(DETAIL_LEVELS[index].id);
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* ---------------- STEP 1: PLATFORM ---------------- */}
      <section aria-labelledby="platform-heading">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 id="platform-heading" className="text-[15px] font-semibold text-zinc-950 tracking-tight">
              1. Platform
            </h2>
            <span className="text-xs text-zinc-400 font-normal">·</span>
            <span className="text-xs text-zinc-500">What are you building?</span>
          </div>
        </div>

        <div 
          role="radiogroup" 
          aria-label="Target Platform"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {PLATFORMS.map((p, idx) => {
            const isSelected = platform === p.id;
            const Icon = p.icon;

            return (
              <div
                key={p.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => !isGenerating && onPlatformChange(p.id)}
                onKeyDown={(e) => handlePlatformKeyDown(e, idx)}
                className={`relative flex flex-col justify-between h-[92px] sm:h-[96px] p-3.5 rounded-[11px] border cursor-pointer select-none transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 ${
                  isSelected
                    ? 'bg-zinc-50/90 border-zinc-900 shadow-xs ring-1 ring-zinc-900'
                    : 'bg-white border-zinc-200/90 hover:border-zinc-300 hover:bg-zinc-50/50'
                } ${isGenerating ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-1.5 rounded-md ${isSelected ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex items-center">
                    {isSelected ? (
                      <HiCheckCircle className="w-4 h-4 text-zinc-900" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-zinc-300" />
                    )}
                  </div>
                </div>

                <div className="mt-1">
                  <div className="text-[14px] font-semibold text-zinc-900 leading-tight">
                    {p.title}
                  </div>
                  <div className="text-[12px] text-zinc-500 font-normal mt-0.5 leading-none">
                    {p.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- STEP 2: DETAIL LEVEL ---------------- */}
      <section aria-labelledby="detail-heading">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 id="detail-heading" className="text-[15px] font-semibold text-zinc-950 tracking-tight">
              2. Detail level
            </h2>
            <span className="text-xs text-zinc-400 font-normal">·</span>
            <span className="text-xs text-zinc-500">How much technical detail do you need?</span>
          </div>
        </div>

        <div 
          role="radiogroup" 
          aria-label="Detail Level"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {DETAIL_LEVELS.map((d, idx) => {
            const isSelected = detailLevel === d.id;
            const Icon = d.icon;

            return (
              <div
                key={d.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => !isGenerating && onDetailChange(d.id)}
                onKeyDown={(e) => handleDetailKeyDown(e, idx)}
                className={`relative flex flex-col justify-between h-[84px] sm:h-[88px] p-3.5 rounded-[11px] border cursor-pointer select-none transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 ${
                  isSelected
                    ? 'bg-zinc-50/90 border-zinc-900 shadow-xs ring-1 ring-zinc-900'
                    : 'bg-white border-zinc-200/90 hover:border-zinc-300 hover:bg-zinc-50/50'
                } ${isGenerating ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-md ${isSelected ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[14px] font-semibold text-zinc-900">
                      {d.title}
                    </span>
                  </div>

                  {isSelected ? (
                    <HiCheckCircle className="w-4 h-4 text-zinc-900" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-zinc-300" />
                  )}
                </div>

                <div className="mt-1">
                  <span className="text-[12px] text-zinc-500 line-clamp-1">
                    {d.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- STEP 3: APPLICATION DESCRIPTION ---------------- */}
      <section aria-labelledby="description-heading" className="space-y-2">
        <div className="flex items-baseline justify-between mb-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <h2 id="description-heading" className="text-[15px] font-semibold text-zinc-950 tracking-tight">
              3. Describe your application
            </h2>
            <span className="text-xs text-zinc-500">
              Explain what you want to build. Include users, key features, and requirements.
            </span>
          </div>
        </div>

        {/* Textarea Container */}
        <div className="relative rounded-xl border border-zinc-200/90 bg-white shadow-xs transition-all duration-150 focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10 hover:border-zinc-300">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder={`Describe your application...\n\nExample: A marketplace where local farmers can sell products directly to consumers. Users should be able to browse products, place orders, pay online, and track delivery.`}
            className="w-full resize-none border-0 bg-transparent px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 placeholder:leading-relaxed focus:outline-none focus:ring-0 leading-relaxed disabled:opacity-60"
            style={{ height: `${MIN_HEIGHT}px`, minHeight: `${MIN_HEIGHT}px` }}
            maxLength={MAX_CHARS}
            aria-label="Application description input"
          />

          {/* Action & Character Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-3.5 py-2.5 bg-zinc-50/70 border-t border-zinc-100 rounded-b-xl">
            {/* Meta status */}
            <div className="flex items-center gap-3 text-xs text-zinc-500 order-2 sm:order-1">
              <span className={`font-mono text-[11px] ${value.length >= MAX_CHARS ? 'text-red-500 font-bold' : ''}`}>
                {value.length} / {MAX_CHARS}
              </span>
              <span className="hidden sm:inline-block text-zinc-300">|</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-400">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-white border border-zinc-200 text-zinc-600 shadow-2xs">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-white border border-zinc-200 text-zinc-600 shadow-2xs">Enter</kbd>
                <span>to generate</span>
              </span>
            </div>

            {/* Primary Generate Action */}
            <div className="order-1 sm:order-2">
              <button
                type="button"
                onClick={onGenerate}
                disabled={!canGenerate}
                aria-label="Generate Blueprint"
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 ${
                  canGenerate
                    ? 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98] shadow-xs cursor-pointer'
                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating Blueprint...</span>
                  </>
                ) : (
                  <>
                    <HiSparkles className="w-3.5 h-3.5 text-zinc-200" />
                    <span>Generate Blueprint</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Example Suggestions (Chips) */}
        <div className="pt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-zinc-400 mr-1 flex items-center gap-1">
              Examples:
            </span>
            {EXAMPLE_PROMPTS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  onChange(item.text);
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                  }
                }}
                disabled={isGenerating}
                className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium text-zinc-600 bg-zinc-100/90 hover:bg-zinc-200/90 hover:text-zinc-900 rounded-md border border-zinc-200/60 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
