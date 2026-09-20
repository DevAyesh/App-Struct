import React, { useState, useMemo } from 'react';
import { 
  HiSearch, 
  HiStar, 
  HiOutlineStar, 
  HiDotsVertical, 
  HiPencil, 
  HiDuplicate, 
  HiDownload, 
  HiTrash,
  HiOutlineDocumentText,
  HiSortAscending
} from 'react-icons/hi';

export default function SavedBlueprintsList({
  blueprints = [],
  activeId,
  onSelect,
  onRename,
  onDuplicate,
  onExport,
  onDelete,
  onToggleFavorite,
  favorites = new Set()
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all'); // all, web, mobile, both
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Filter and sort items
  const filteredBlueprints = useMemo(() => {
    return blueprints
      .filter((bp) => {
        const title = bp.title || bp.ideaInput || 'Untitled Blueprint';
        const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlatform = filterPlatform === 'all' || bp.platform === filterPlatform;
        return matchesSearch && matchesPlatform;
      })
      .sort((a, b) => {
        // Generating blueprints always float to the top
        if (a.isGenerating && !b.isGenerating) return -1;
        if (!a.isGenerating && b.isGenerating) return 1;

        const aFav = favorites.has(a._id) ? 1 : 0;
        const bFav = favorites.has(b._id) ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav; // Favorites on top

        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === 'name') {
          const aTitle = a.title || a.ideaInput || '';
          const bTitle = b.title || b.ideaInput || '';
          return aTitle.localeCompare(bTitle);
        }
        return 0;
      });
  }, [blueprints, searchQuery, filterPlatform, sortBy, favorites]);

  const handleStartRename = (bp, e) => {
    e.stopPropagation();
    setEditingId(bp._id);
    setEditTitle(bp.title || bp.ideaInput);
    setActiveMenuId(null);
  };

  const handleFinishRename = (bpId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRename(bpId, editTitle.trim());
    }
    setEditingId(null);
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full text-zinc-800 text-xs">
      {/* Search Bar */}
      <div className="p-3 pb-2 border-b border-zinc-200/80">
        <div className="relative">
          <HiSearch className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search blueprints... (/) "
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all"
          />
        </div>

        {/* Filter & Sort Row */}
        <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-zinc-500">
          <div className="flex gap-1">
            {['all', 'web', 'mobile', 'both'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterPlatform(type)}
                className={`px-1.5 py-0.5 rounded capitalize transition-colors ${
                  filterPlatform === type
                    ? 'bg-zinc-200/80 text-zinc-900 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                {type === 'both' ? 'Cross' : type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <HiSortAscending className="w-3 h-3 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-0 text-[11px] text-zinc-600 focus:ring-0 cursor-pointer p-0"
            >
              <option value="newest">Recent</option>
              <option value="name">Name</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredBlueprints.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 px-3">
            <HiOutlineDocumentText className="w-7 h-7 mx-auto mb-2 text-zinc-300 stroke-1" />
            <p className="font-medium text-xs text-zinc-500">No blueprints found</p>
            <p className="text-[11px] mt-0.5">
              {searchQuery ? 'Try clearing your search query' : 'Generate your first blueprint to see it here'}
            </p>
          </div>
        ) : (
          filteredBlueprints.map((bp) => {
            const isSelected = activeId === bp._id;
            const isFav = favorites.has(bp._id);
            const title = bp.title || bp.ideaInput || 'Untitled Blueprint';

            return (
              <div
                key={bp._id}
                onClick={() => onSelect(bp)}
                className={`group relative flex flex-col p-2 rounded-lg cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-zinc-100 border-zinc-300 shadow-xs'
                    : 'bg-white/60 border-zinc-200/70 hover:bg-zinc-50/80 hover:border-zinc-300'
                }`}
              >
                {/* Title and Actions */}
                <div className="flex items-start justify-between gap-1.5">
                  {editingId === bp._id ? (
                    <input
                      type="text"
                      value={editTitle}
                      autoFocus
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={(e) => handleFinishRename(bp._id, e)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleFinishRename(bp._id, e);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="w-full text-xs font-semibold px-1 py-0.5 border border-zinc-400 rounded bg-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="font-medium text-zinc-900 text-xs truncate leading-snug">
                        {title}
                      </span>
                      {bp.isGenerating && (
                        <span 
                          className="inline-flex items-center gap-0.5 text-zinc-600 flex-shrink-0"
                          aria-label="Generating blueprint"
                          title="Generating blueprint..."
                        >
                          <span className="w-1 h-1 rounded-full bg-zinc-600 animate-dot-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-1 rounded-full bg-zinc-600 animate-dot-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-1 rounded-full bg-zinc-600 animate-dot-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      )}
                    </div>
                  )}

                  {!bp.isGenerating && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        type="button"
                        aria-label="Toggle Favorite"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(bp._id);
                        }}
                        className="p-1 text-zinc-400 hover:text-amber-500 rounded"
                      >
                        {isFav ? (
                          <HiStar className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        ) : (
                          <HiOutlineStar className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          aria-label="Item Actions"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === bp._id ? null : bp._id);
                            setConfirmDeleteId(null);
                          }}
                          className="p-1 text-zinc-400 hover:text-zinc-700 rounded hover:bg-zinc-200/60"
                        >
                          <HiDotsVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === bp._id && (
                          <div
                            className="absolute right-0 top-6 w-36 bg-white border border-zinc-200 rounded-md shadow-lg py-1 z-30 text-[11px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => handleStartRename(bp, e)}
                              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-zinc-100 text-zinc-700"
                            >
                              <HiPencil className="w-3.5 h-3.5 text-zinc-400" /> Rename
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicate(bp);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-zinc-100 text-zinc-700"
                            >
                              <HiDuplicate className="w-3.5 h-3.5 text-zinc-400" /> Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onExport(bp);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-zinc-100 text-zinc-700"
                            >
                              <HiDownload className="w-3.5 h-3.5 text-zinc-400" /> Export
                            </button>
                            <div className="h-px bg-zinc-100 my-1" />
                            {confirmDeleteId === bp._id ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(bp._id);
                                  setActiveMenuId(null);
                                  setConfirmDeleteId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xs transition-colors"
                              >
                                <HiTrash className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">Confirm Delete?</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(bp._id);
                                }}
                                className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-red-50 text-red-600"
                              >
                                <HiTrash className="w-3.5 h-3.5 text-red-500 flex-shrink-0" /> Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata Row: Platform & Date */}
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-zinc-400">
                  <span className="capitalize font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
                    {bp.platform === 'both' ? 'Cross' : bp.platform || 'Web'}
                  </span>
                  {bp.isGenerating ? (
                    <span className="text-zinc-600 font-medium flex items-center gap-1">
                      <span>Generating</span>
                    </span>
                  ) : (
                    <span>{formatRelativeTime(bp.createdAt)}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Blueprint Count */}
      <div className="p-2.5 border-t border-zinc-200/80 text-[11px] text-zinc-500 flex justify-between items-center bg-zinc-50">
        <span>{blueprints.filter(b => !b.isGenerating).length} Saved {blueprints.filter(b => !b.isGenerating).length === 1 ? 'Blueprint' : 'Blueprints'}</span>
        <span className="text-zinc-400">Esc to close</span>
      </div>
    </div>
  );
}
