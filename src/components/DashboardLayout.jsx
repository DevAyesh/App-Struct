import React, { useState } from 'react';
import { 
  HiMenuAlt2, 
  HiX, 
  HiOutlineAdjustments, 
  HiChevronDown,
  HiChevronUp,
  HiSparkles
} from 'react-icons/hi';

export default function DashboardLayout({
  sidebar,
  rightSidebar,
  headerContent,
  toolbar,
  children,
  onNewBlueprint,
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileContextOpen, setIsMobileContextOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-100/60 font-sans text-zinc-900 antialiased overflow-hidden selection:bg-zinc-200">
      
      {/* ================= COMPACT APPLICATION HEADER ================= */}
      <header className="h-12 bg-white border-b border-zinc-200/80 px-3 sm:px-5 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Mobile menu trigger */}
          <button
            type="button"
            aria-label="Open sidebar navigation"
            onClick={() => setIsMobileNavOpen(true)}
            className="md:hidden p-1.5 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <HiMenuAlt2 className="w-5 h-5" />
          </button>

          {/* AppStruct Logo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-900 text-white shadow-2xs">
              <HiSparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-[14px] font-bold tracking-tight text-zinc-900">
              AppStruct
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 pl-2 border-l border-zinc-200 ml-2">
            <span className="text-zinc-600 font-medium">Architecture Generator</span>
          </div>
        </div>

        {/* Header Right Actions (Account, Mobile Context Toggle) */}
        <div className="flex items-center gap-2">
          {/* Mobile Context Panel Toggle */}
          <button
            type="button"
            aria-label="Toggle Context Summary"
            onClick={() => setIsMobileContextOpen(!isMobileContextOpen)}
            className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
          >
            <HiOutlineAdjustments className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px]">Context</span>
            {isMobileContextOpen ? <HiChevronUp className="w-3 h-3" /> : <HiChevronDown className="w-3 h-3" />}
          </button>

          {/* Account / User section from parent */}
          {headerContent}
        </div>
      </header>

      {/* ================= MOBILE COLLAPSIBLE CONTEXT SUMMARY ================= */}
      {isMobileContextOpen && (
        <div className="lg:hidden border-b border-zinc-200 bg-white p-3 z-20 shadow-xs max-h-60 overflow-y-auto">
          {rightSidebar}
        </div>
      )}

      {/* ================= BODY 3-COLUMN WORKSPACE ================= */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Backdrop for Left Sidebar */}
        {isMobileNavOpen && (
          <div 
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs z-40 md:hidden animate-fade-in"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}

        {/* LEFT SIDEBAR (Desktop permanent 240px, Mobile drawer) */}
        <aside
          aria-label="Sidebar Navigation"
          className={`fixed md:static inset-y-0 left-0 z-50 md:z-10 w-[260px] md:w-[240px] flex-shrink-0 flex flex-col bg-white md:bg-zinc-50/50 border-r border-zinc-200/90 transition-transform duration-200 ease-out md:translate-x-0 ${
            isMobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          {/* Mobile drawer header */}
          <div className="md:hidden flex items-center justify-between p-3 border-b border-zinc-200">
            <span className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Navigation</span>
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setIsMobileNavOpen(false)}
              className="p-1 text-zinc-400 hover:text-zinc-700 rounded-md"
            >
              <HiX className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {sidebar}
          </div>
        </aside>

        {/* CENTER MAIN COLUMN (Locked toolbar + Scrollable content) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          
          {/* Pinned Toolbar / Sub-header (when active) */}
          {toolbar && (
            <div className="h-12 border-b border-zinc-200/90 bg-white px-4 sm:px-8 flex items-center justify-between z-20 flex-shrink-0 shadow-2xs">
              <div className="w-full max-w-[760px] mx-auto flex items-center justify-between gap-2.5">
                {toolbar}
              </div>
            </div>
          )}

          {/* Scrollable Document / Workspace Content */}
          <main 
            role="main" 
            className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-6 sm:px-8 sm:py-8"
          >
            <div className="w-full max-w-[760px] flex flex-col pb-16">
              {children}
            </div>
          </main>
        </div>

        {/* RIGHT CONTEXT PANEL (Desktop permanent 260px) */}
        <aside 
          aria-label="Context & Metadata" 
          className="hidden lg:flex flex-col w-[260px] flex-shrink-0 bg-zinc-50/50 border-l border-zinc-200/90 overflow-hidden"
        >
          {rightSidebar}
        </aside>

      </div>
    </div>
  );
}
