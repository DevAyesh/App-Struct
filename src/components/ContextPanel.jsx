import React from 'react';
import { 
  HiCheckCircle, 
  HiOutlineServer, 
  HiOutlineDatabase, 
  HiOutlineCode, 
  HiOutlineShieldCheck, 
  HiOutlineCloud,
  HiInformationCircle
} from 'react-icons/hi';

export default function ContextPanel({ platform, detailLevel, isGenerating }) {
  const platformNames = {
    web: 'Web Application',
    mobile: 'Mobile Application',
    both: 'Cross Platform'
  };

  const detailNames = {
    brief: 'Quick Overview',
    full: 'Detailed Blueprint'
  };

  const deliverables = [
    { label: 'System Architecture', icon: HiOutlineServer, fullOnly: false },
    { label: 'Database Schema & Models', icon: HiOutlineDatabase, fullOnly: false },
    { label: 'API Architecture & Endpoints', icon: HiOutlineCode, fullOnly: false },
    { label: 'Infrastructure & Deployment', icon: HiOutlineCloud, fullOnly: true },
    { label: 'Security & Auth Considerations', icon: HiOutlineShieldCheck, fullOnly: true },
  ];

  return (
    <aside aria-label="Configuration Context" className="flex flex-col h-full bg-zinc-50/50 p-4 border-l border-zinc-200 text-zinc-800 text-sm">
      {/* Header */}
      <div className="pb-3 border-b border-zinc-200/80">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Context</span>
        <h2 className="text-xs font-semibold text-zinc-700 mt-0.5">Configuration Summary</h2>
      </div>

      {/* Selected Parameters */}
      <div className="py-4 space-y-3 border-b border-zinc-200/80">
        <div>
          <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wide">Platform</span>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-medium text-zinc-900 text-sm">
              {platformNames[platform] || 'Web Application'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-200/70 text-zinc-700">
              {platform === 'both' ? 'Unified' : platform === 'mobile' ? 'Native' : 'Browser'}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wide">Detail Depth</span>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-medium text-zinc-900 text-sm">
              {detailNames[detailLevel] || 'Detailed Blueprint'}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
              detailLevel === 'full' 
                ? 'bg-zinc-900 text-white' 
                : 'bg-zinc-200/70 text-zinc-700'
            }`}>
              {detailLevel === 'full' ? 'Comprehensive' : 'Rapid'}
            </span>
          </div>
        </div>
      </div>

      {/* Estimated Output */}
      <div className="py-4 flex-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2.5">
          Estimated Output
        </span>
        <ul className="space-y-2">
          {deliverables.map((item) => {
            const isIncluded = detailLevel === 'full' || !item.fullOnly;
            const Icon = item.icon;
            return (
              <li 
                key={item.label}
                className={`flex items-center justify-between text-xs py-1 px-1.5 rounded transition-colors ${
                  isIncluded ? 'text-zinc-700 hover:bg-zinc-100/80' : 'text-zinc-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isIncluded ? 'text-zinc-600' : 'text-zinc-300'}`} />
                  <span>{item.label}</span>
                </div>
                {isIncluded ? (
                  <HiCheckCircle className="w-3.5 h-3.5 text-zinc-800" />
                ) : (
                  <span className="text-[10px] text-zinc-400 uppercase tracking-tight">Excluded</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer Info Box */}
      <div className="pt-3 border-t border-zinc-200/80">
        <div className="p-2.5 rounded-lg bg-zinc-100/80 border border-zinc-200/60 text-xs text-zinc-500 flex gap-2">
          <HiInformationCircle className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            {isGenerating
              ? 'Synthesizing technical architecture based on prompt requirements...'
              : 'AppStruct outputs markdown blueprints compatible with GitHub, Notion, and Cursor.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
