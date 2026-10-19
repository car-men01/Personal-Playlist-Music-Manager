import React, { useState, useEffect, useRef } from "react";
import {
    Search, Plus, Bell, Home as HomeIcon, Library as LibraryIcon,
    Sparkles, Play, Edit2, Trash2, Clock, ChevronDown, X,
    Music, Zap, Activity, ListMusic, ArrowRight, ListPlus, FolderPlus,
    ArrowUp, ArrowDown, SlidersHorizontal, RotateCcw
} from "lucide-react";

// --- TYPES ---
interface Track {
    id: number;
    title: string;
    artist: string;
    duration?: string;
    genre?: string;
    bpm?: number;
    energy?: number;
    release_year?: number | null;
}

interface Playlist {
    id: number;
    name: string;
    tracks?: Track[];
}

type SearchField = "any" | "title" | "artist";

interface AutocompleteResult {
    query: string;
    suggestions: Track[];
    total_matches: number;
    indexed_tracks: number;
    trie_ms: number;
    linear_ms: number;
}

interface ExactSearch {
    query: string;
    field: SearchField;
}

type SortField = "recent" | "title" | "duration" | "release_year" | "bpm" | "energy";
type SortAlgorithm = "merge" | "quick";

// Numeric filters are kept as the raw input strings; empty means "no bound"
interface BrowseOptions {
    sortBy: SortField;
    order: "asc" | "desc";
    algorithm: SortAlgorithm;
    genre: string;
    minBpm: string;
    maxBpm: string;
    minEnergy: string;
    maxEnergy: string;
}

interface SortInfo {
    algorithm: string;
    ms: number;
}

const DEFAULT_BROWSE: BrowseOptions = {
    sortBy: "recent", order: "desc", algorithm: "merge",
    genre: "", minBpm: "", maxBpm: "", minEnergy: "", maxEnergy: "",
};

const SORT_OPTIONS: { value: SortField; label: string }[] = [
    { value: "recent", label: "Recently Added" },
    { value: "title", label: "Title" },
    { value: "duration", label: "Duration" },
    { value: "release_year", label: "Release Year" },
    { value: "bpm", label: "BPM" },
    { value: "energy", label: "Energy" },
];

function buildBrowseParams(b: BrowseOptions) {
    const params = new URLSearchParams({ sort_by: b.sortBy, order: b.order, algorithm: b.algorithm });
    if (b.genre) params.set("genre", b.genre);
    const bounds: [string, string][] = [
        ["min_bpm", b.minBpm], ["max_bpm", b.maxBpm], ["min_energy", b.minEnergy], ["max_energy", b.maxEnergy],
    ];
    for (const [name, value] of bounds) {
        if (value.trim()) params.set(name, value.trim());
    }
    return params;
}

// --- COMPONENTS ---

function SonoraLogo() {
    return (
        <svg className="sonora-logo" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="sonoraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00E5FF" />
                    <stop offset="50%" stopColor="#88F8FF" />
                    <stop offset="100%" stopColor="#FF77A9" />
                </linearGradient>
            </defs>
            <rect x="3" y="12" width="3.5" height="8" rx="1.75" fill="url(#sonoraGradient)" />
            <rect x="9.5" y="6" width="3.5" height="20" rx="1.75" fill="url(#sonoraGradient)" />
            <rect x="16" y="2" width="3.5" height="28" rx="1.75" fill="url(#sonoraGradient)" />
            <rect x="22.5" y="8" width="3.5" height="16" rx="1.75" fill="url(#sonoraGradient)" />
            <rect x="29" y="13" width="3.5" height="6" rx="1.75" fill="url(#sonoraGradient)" />
        </svg>
    );
}

function Sidebar({
                     view,
                     setView,
                     playlists,
                     selectedPlaylistId,
                     onSelectPlaylist,
                     onOpenCreatePlaylistModal
                 }: {
    view: string;
    setView: (v: string) => void;
    playlists: Playlist[];
    selectedPlaylistId: number | null;
    onSelectPlaylist: (pl: Playlist) => void;
    onOpenCreatePlaylistModal: () => void;
}) {
    return (
        <aside className="sidebar">
            {/* Brand */}
            <div className="brand">
                <SonoraLogo />
                <span className="brand-name">SONORA</span>
            </div>

            {/* Nav List */}
            <div className="nav-list">
                <button
                    onClick={() => setView("home")}
                    className={`nav-item ${view === "home" ? "active" : ""}`}
                >
                    <HomeIcon size={18} />
                    <span>Home</span>
                </button>

                <button
                    onClick={() => setView("library")}
                    className={`nav-item ${view === "library" ? "active" : ""}`}
                >
                    <LibraryIcon size={18} />
                    <span>My Library</span>
                </button>

                <button
                    onClick={() => setView("shuffle")}
                    className={`nav-item ${view === "shuffle" ? "active" : ""}`}
                >
                    <Sparkles size={18} />
                    <span>DJ Smart Shuffle</span>
                    <span className="new-pill">NEW</span>
                </button>
            </div>

            {/* Playlist Heading */}
            <div className="playlist-heading">
                <span>YOUR PLAYLISTS</span>
                <button onClick={onOpenCreatePlaylistModal} title="Create Playlist">
                    <Plus size={14} />
                </button>
            </div>

            {/* Playlist List */}
            <div className="playlist-list">
                {playlists.length > 0 ? (
                    playlists.map((pl) => (
                        <button
                            key={pl.id}
                            onClick={() => onSelectPlaylist(pl)}
                            className={`playlist-item ${view === "playlist" && selectedPlaylistId === pl.id ? "active" : ""}`}
                        >
                            <div className="pl-icon">{pl.name.charAt(0).toUpperCase()}</div>
                            <span>
                <strong>{pl.name}</strong>
                <small>{pl.tracks?.length || 0} tracks</small>
              </span>
                        </button>
                    ))
                ) : (
                    <small style={{ padding: "0 10px", color: "#6f6682" }}>No playlists created yet.</small>
                )}
            </div>

            {/* Sidebar Bottom */}
            <div className="sidebar-bottom">
                <div className="storage-label">
                    <span>LIBRARY CAPACITY</span>
                    <span>68%</span>
                </div>
                <div className="storage-track">
                    <span />
                </div>
                <button className="profile">
                    <div className="avatar">AL</div>
                    <span>
            <strong>Alex Mercer</strong>
            <small>Pro Account</small>
          </span>
                </button>
            </div>
        </aside>
    );
}

function Topbar({
                    searchQuery,
                    setSearchQuery,
                    autocomplete,
                    onExactSearch,
                    onOpenAddModal
                }: {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    autocomplete: AutocompleteResult | null;
    onExactSearch: (query: string, field?: SearchField) => void;
    onOpenAddModal: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const suggestions = autocomplete?.suggestions ?? [];

    // ⌘K / Ctrl+K focuses the search box
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => setHighlighted(-1), [autocomplete]);

    const pickSuggestion = (track: Track) => {
        setSearchQuery(track.title);
        setOpen(false);
        onExactSearch(track.title, "title");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, -1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (highlighted >= 0 && suggestions[highlighted]) {
                pickSuggestion(suggestions[highlighted]);
            } else if (searchQuery.trim()) {
                setOpen(false);
                onExactSearch(searchQuery.trim());
            }
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <header className="topbar">
            <div className="search-wrap">
                <Search size={15} />
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search titles or artists — Enter for exact match"
                />
                <span className="shortcut">⌘K</span>

                {open && searchQuery.trim() && autocomplete && (
                    <div className="search-suggestions">
                        {suggestions.length === 0 ? (
                            <div className="suggestion-empty">No titles or artists start with "{autocomplete.query.trim()}"</div>
                        ) : (
                            suggestions.map((track, i) => (
                                <button
                                    key={track.id}
                                    className={`suggestion ${i === highlighted ? "active" : ""}`}
                                    onMouseDown={(e) => { e.preventDefault(); pickSuggestion(track); }}
                                    onMouseEnter={() => setHighlighted(i)}
                                >
                                    <Music size={13} />
                                    <span>
                                        <strong>{track.title}</strong>
                                        <small>{track.artist}</small>
                                    </span>
                                </button>
                            ))
                        )}
                        <div className="suggestion-stats">
                            <span>{autocomplete.total_matches} matches · {autocomplete.indexed_tracks} tracks indexed</span>
                            <span>Trie <b>{autocomplete.trie_ms.toFixed(3)} ms</b> · Linear <b>{autocomplete.linear_ms.toFixed(3)} ms</b></span>
                        </div>
                    </div>
                )}
            </div>

            <button className="icon-button notification">
                <Bell size={18} />
                <i />
            </button>

            <button className="primary-button" onClick={onOpenAddModal}>
                <Plus size={16} /> Add New Track
            </button>
        </header>
    );
}

function HomeView({
                      tracks,
                      playlists,
                      onOpenAddModal,
                      onOpenCreatePlaylistModal,
                      setView,
                      onSelectPlaylist
                  }: {
    tracks: Track[];
    playlists: Playlist[];
    onOpenAddModal: () => void;
    onOpenCreatePlaylistModal: () => void;
    setView: (v: string) => void;
    onSelectPlaylist: (pl: Playlist) => void;
}) {
    const totalTracks = tracks.length;
    const totalPlaylists = playlists.length;

    const avgBpm = totalTracks
        ? Math.round(tracks.reduce((sum, t) => sum + (t.bpm || 120), 0) / totalTracks)
        : 0;

    const avgEnergy = totalTracks
        ? Math.round(
            tracks.reduce((sum, t) => {
                const val = t.energy != null ? (t.energy <= 1 ? t.energy * 100 : t.energy) : 50;
                return sum + val;
            }, 0) / totalTracks
        )
        : 0;

    return (
        <div className="content">
            <div className="welcome">
                <div>
                    <p className="eyebrow"><Sparkles size={12} /> Sound Control Center</p>
                    <h1>Good evening, Alex.</h1>
                    <p>Your soundtrack, beautifully organized. <span>{totalTracks} tracks</span> across your database.</p>
                </div>

                <div className="stat-card">
                    <span><Zap size={18} /></span>
                    <div>
                        <small>AUDIO PROFILE</small>
                        <strong>{avgEnergy}% Avg Energy</strong>
                        <em>{avgBpm} BPM Average Pace</em>
                    </div>
                </div>
            </div>

            <div className="library-panel">
                <div className="panel-header">
                    <div>
                        <h2>Dashboard Overview</h2>
                        <p>Quick shortcuts to your library and custom collections.</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button className="primary-button" onClick={() => setView("library")}>
                            View All Tracks <ArrowRight size={14} />
                        </button>
                        <button className="primary-button" style={{ background: "rgba(255,119,169,0.15)", color: "#ff77a9", border: "1px solid rgba(255,119,169,0.3)" }} onClick={onOpenCreatePlaylistModal}>
                            <FolderPlus size={14} /> New Playlist
                        </button>
                    </div>
                </div>

                <div style={{ padding: "20px" }}>
                    <h3 style={{ fontSize: "12px", color: "#81768f", marginBottom: "12px" }}>YOUR ACTIVE PLAYLISTS ({totalPlaylists})</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                        {playlists.map((pl) => (
                            <button
                                key={pl.id}
                                onClick={() => onSelectPlaylist(pl)}
                                className="playlist-item"
                                style={{ background: "rgba(255,255,255,0.03)", padding: "12px", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                                <div className="pl-icon">{pl.name.charAt(0).toUpperCase()}</div>
                                <span>
                  <strong>{pl.name}</strong>
                  <small>{pl.tracks?.length || 0} tracks inside</small>
                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Library({
                     tracks,
                     loading,
                     searchQuery,
                     onClearSearch,
                     browse,
                     onBrowseChange,
                     genres,
                     sortInfo,
                     onEditTrack,
                     onDeleteTrack
                 }: {
    tracks: Track[];
    loading: boolean;
    searchQuery?: string;
    onClearSearch: () => void;
    browse: BrowseOptions;
    onBrowseChange: (changes: Partial<BrowseOptions>) => void;
    genres: string[];
    sortInfo: SortInfo | null;
    onEditTrack: (track: Track) => void;
    onDeleteTrack: (id: number) => void;
}) {
    const filtersActive = Boolean(browse.genre || browse.minBpm || browse.maxBpm || browse.minEnergy || browse.maxEnergy);
    const sortLabel = SORT_OPTIONS.find((o) => o.value === browse.sortBy)?.label;

    return (
        <div className="content">
            <div className="welcome">
                <div>
                    <p className="eyebrow">Your Private Collection</p>
                    <h1>My Track Library</h1>
                    <p>Curate and shape your personal sound. <span>{tracks.length} tracks</span> loaded.</p>
                </div>
            </div>

            <div className="library-panel">
                <div className="panel-header">
                    {searchQuery ? (
                        <div className="search-banner">
                            <div>
                                <h2>Exact matches for "{searchQuery}"</h2>
                                <p>Case-insensitive lookup on the indexed title and artist columns.</p>
                            </div>
                            <button className="secondary-button" onClick={onClearSearch}>
                                <X size={12} /> Clear search
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h2>Tracks Database</h2>
                            <p>All music assets populated from SQLite.</p>
                        </div>
                    )}
                    <div className="sort-control">
                        Sort by:
                        <select
                            value={browse.sortBy}
                            onChange={(e) => {
                                const sortBy = e.target.value as SortField;
                                onBrowseChange({ sortBy, order: sortBy === "recent" ? "desc" : "asc" });
                            }}
                        >
                            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown size={14} />
                        <button
                            className="order-toggle"
                            onClick={() => onBrowseChange({ order: browse.order === "asc" ? "desc" : "asc" })}
                            title={browse.order === "asc" ? "Ascending" : "Descending"}
                        >
                            {browse.order === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                        </button>
                    </div>
                </div>

                <div className="filter-bar">
                    <span className="filter-label"><SlidersHorizontal size={12} /> FILTER</span>
                    <label>
                        Genre
                        <select value={browse.genre} onChange={(e) => onBrowseChange({ genre: e.target.value })}>
                            <option value="">All genres</option>
                            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </label>
                    <label>
                        BPM
                        <input type="number" min={0} placeholder="min" value={browse.minBpm} onChange={(e) => onBrowseChange({ minBpm: e.target.value })} />
                        –
                        <input type="number" min={0} placeholder="max" value={browse.maxBpm} onChange={(e) => onBrowseChange({ maxBpm: e.target.value })} />
                    </label>
                    <label>
                        Energy %
                        <input type="number" min={0} max={100} placeholder="min" value={browse.minEnergy} onChange={(e) => onBrowseChange({ minEnergy: e.target.value })} />
                        –
                        <input type="number" min={0} max={100} placeholder="max" value={browse.maxEnergy} onChange={(e) => onBrowseChange({ maxEnergy: e.target.value })} />
                    </label>
                    {filtersActive && (
                        <button
                            className="filter-reset"
                            onClick={() => onBrowseChange({ genre: "", minBpm: "", maxBpm: "", minEnergy: "", maxEnergy: "" })}
                        >
                            <RotateCcw size={11} /> Reset
                        </button>
                    )}
                    <div className="algorithm-toggle" title="Sorting algorithm used by the backend">
                        {(["merge", "quick"] as SortAlgorithm[]).map((alg) => (
                            <button
                                key={alg}
                                className={browse.algorithm === alg ? "active" : ""}
                                onClick={() => onBrowseChange({ algorithm: alg })}
                            >
                                {alg === "merge" ? "MergeSort" : "QuickSort"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="table-wrap">
                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#81768f" }}>Connecting to backend database...</div>
                    ) : tracks.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#81768f" }}>
                            {searchQuery
                                ? `No track title or artist is exactly "${searchQuery}"${filtersActive ? " within these filters" : ""}.`
                                : filtersActive
                                    ? "No tracks match these filters."
                                    : `No tracks found. Click "Add New Track" to insert data.`}
                        </div>
                    ) : (
                        <table>
                            <thead>
                            <tr>
                                <th className="index-cell">#</th>
                                <th>Track</th>
                                <th>Genre</th>
                                <th><Clock size={14} className="th-icon" /></th>
                                <th>Year</th>
                                <th>BPM</th>
                                <th>Energy</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {tracks.map((track, i) => {
                                const energyPct = track.energy != null
                                    ? track.energy <= 1 ? track.energy * 100 : track.energy
                                    : 50;

                                return (
                                    <tr key={track.id}>
                                        <td className="index-cell">{String(i + 1).padStart(2, '0')}</td>
                                        <td>
                                            <div className="track-cell">
                                                <div className="cover-wrap">
                                                    <Play size={16} />
                                                    <button title="Play"><Play size={14} /></button>
                                                </div>
                                                <span>
                            <strong>{track.title}</strong>
                            <small>{track.artist}</small>
                          </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="genre-pill">{track.genre || "Unassigned"}</span>
                                        </td>
                                        <td className="muted">{track.duration || "3:30"}</td>
                                        <td className="muted">{track.release_year ?? "—"}</td>
                                        <td className="bpm">{track.bpm || 120}</td>
                                        <td>
                                            <div className="energy-cell">
                                                <div className="energy-track">
                                                    <span style={{ width: `${Math.min(100, Math.max(0, energyPct))}%` }} />
                                                </div>
                                                <small>{Math.round(energyPct)}%</small>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="actions">
                                                <button onClick={() => onEditTrack(track)} title="Edit"><Edit2 size={15} /></button>
                                                <button onClick={() => onDeleteTrack(track.id)} title="Delete"><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="table-footer">
                    <span>
                        Showing {tracks.length} tracks
                        {sortInfo && <> · Sorted by {sortLabel} with <b className="sort-stat">{sortInfo.algorithm}</b> in <b className="sort-stat">{sortInfo.ms.toFixed(3)} ms</b></>}
                    </span>
                    <button><Activity size={12} /> Sync SQLite Database</button>
                </div>
            </div>
        </div>
    );
}

function PlaylistView({
                          playlist,
                          onOpenAddTracksModal,
                          onRenamePlaylist,
                          onDeletePlaylist,
                          onRemoveTrackFromPlaylist
                      }: {
    playlist: Playlist;
    onOpenAddTracksModal: () => void;
    onRenamePlaylist: (playlist: Playlist) => void;
    onDeletePlaylist: (id: number) => void;
    onRemoveTrackFromPlaylist: (playlistId: number, trackId: number) => void;
}) {
    const tracks = playlist.tracks || [];

    return (
        <div className="content">
            <div className="welcome">
                <div>
                    <p className="eyebrow" style={{ color: "#ff77a9" }}>PLAYLIST COLLECTION</p>
                    <h1>{playlist.name}</h1>
                    <p>Curated sound list • <span>{tracks.length} tracks</span></p>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="primary-button" onClick={onOpenAddTracksModal}>
                        <ListPlus size={16} /> Add Tracks
                    </button>
                    <button className="secondary-button" onClick={() => onRenamePlaylist(playlist)}>
                        <Edit2 size={14} /> Rename
                    </button>
                    <button className="delete-button" onClick={() => onDeletePlaylist(playlist.id)}>
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            </div>

            <div className="library-panel">
                <div className="table-wrap">
                    {tracks.length === 0 ? (
                        <div style={{ padding: "50px", textAlign: "center", color: "#81768f" }}>
                            Playlist is empty. Click <strong>Add Tracks</strong> to include songs from your database.
                        </div>
                    ) : (
                        <table>
                            <thead>
                            <tr>
                                <th className="index-cell">#</th>
                                <th>Track</th>
                                <th>Genre</th>
                                <th>Duration</th>
                                <th>BPM</th>
                                <th>Energy</th>
                                <th style={{ textAlign: "right" }}>Remove</th>
                            </tr>
                            </thead>
                            <tbody>
                            {tracks.map((track, i) => (
                                <tr key={track.id}>
                                    <td className="index-cell">{String(i + 1).padStart(2, '0')}</td>
                                    <td>
                                        <div className="track-cell">
                                            <div className="cover-wrap"><Play size={16} /></div>
                                            <span>
                          <strong>{track.title}</strong>
                          <small>{track.artist}</small>
                        </span>
                                        </div>
                                    </td>
                                    <td><span className="genre-pill">{track.genre || "Unassigned"}</span></td>
                                    <td className="muted">{track.duration || "3:30"}</td>
                                    <td className="bpm">{track.bpm || 120}</td>
                                    <td><small>{(track.energy || 0.5) * 100}%</small></td>
                                    <td style={{ textAlign: "right" }}>
                                        <button onClick={() => onRemoveTrackFromPlaylist(playlist.id, track.id)} style={{ border: 0, background: "none", color: "#ff77a9", cursor: "pointer" }}>
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

interface FlowStep {
    track: Track;
    match: number | null;
    bpm_change: number | null;
    energy_change: number | null;
}

interface SmartShuffleResult {
    steps: FlowStep[];
    harmony_score: number;
    random_baseline: number;
    skipped_tracks: number;
    elapsed_ms: number;
}

const energyPercent = (energy?: number) => energy == null ? 50 : energy <= 1 ? energy * 100 : energy;
const signed = (n: number) => n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "±0";

function SmartShuffleView({ tracks, playlists }: { tracks: Track[]; playlists: Playlist[] }) {
    const [source, setSource] = useState("library");   // "library" or a playlist id
    const [startId, setStartId] = useState("");        // "" = random start
    const [regenerateCount, setRegenerateCount] = useState(0);
    const [flow, setFlow] = useState<SmartShuffleResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const lastStartRef = useRef<number | null>(null);

    const sourceTracks = source === "library"
        ? tracks
        : playlists.find((p) => String(p.id) === source)?.tracks ?? [];

    useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams();
        if (source !== "library") params.set("playlist_id", source);
        if (startId) params.set("start_track_id", startId);
        else if (lastStartRef.current !== null) params.set("previous_start_id", String(lastStartRef.current));

        (async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://127.0.0.1:8000/shuffle/smart?${params}`, { signal: controller.signal });
                const data = await res.json();
                if (res.ok) {
                    setFlow(data);
                    setError(null);
                    lastStartRef.current = data.steps[0]?.track.id ?? null;
                } else {
                    setError(data.detail ?? "Could not generate a flow.");
                }
            } catch (err) {
                if ((err as Error).name !== "AbortError") setError("Could not reach the backend.");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        })();

        return () => controller.abort();
    }, [source, startId, regenerateCount, tracks]);

    const steps = flow?.steps ?? [];
    const transitions = Math.max(0, steps.length - 1);

    return (
        <div className="content shuffle-content">
            <div className="shuffle-hero">
                <div>
                    <p className="eyebrow"><Sparkles size={12} /> GREEDY GRAPH TRAVERSAL</p>
                    <h1>DJ Smart <em>Shuffle Flow</em></h1>
                    <p>Treats every track as a point in BPM and energy space, then chains each song to its nearest unplayed neighbour — so every transition is the smoothest one available.</p>
                </div>
                <div className="shuffle-controls">
                    <label>
                        <span>SOURCE</span>
                        <select value={source} onChange={(e) => { setSource(e.target.value); setStartId(""); }}>
                            <option value="library">Entire library</option>
                            {playlists.map((p) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                        </select>
                    </label>
                    <label>
                        <span>START FROM</span>
                        <select value={startId} onChange={(e) => setStartId(e.target.value)}>
                            <option value="">Surprise me</option>
                            {sourceTracks.map((t) => <option key={t.id} value={String(t.id)}>{t.title}</option>)}
                        </select>
                    </label>
                    <button
                        className="primary-button glow-button"
                        onClick={() => { setStartId(""); setRegenerateCount((c) => c + 1); }}
                        disabled={loading}
                    >
                        <Sparkles size={16} /> Regenerate Flow
                    </button>
                </div>
            </div>

            <div className="flow-panel">
                <div className="flow-header">
                    <div><i className="live-dot" /> NEAREST-NEIGHBOUR FLOW</div>
                    <span>{loading && !flow ? "GENERATING…" : `${steps.length} TRACK BLEND`}</span>
                </div>

                <div className="flow-canvas">
                    {error ? (
                        <div className="flow-empty">{error}</div>
                    ) : flow && steps.length < 2 ? (
                        <div className="flow-empty">
                            Add at least two tracks with a BPM and energy value to build a flow.
                            {flow.skipped_tracks > 0 && ` ${flow.skipped_tracks} track(s) were skipped for missing values.`}
                        </div>
                    ) : (
                        <div className={`flow-grid ${loading ? "is-loading" : ""}`}>
                            {steps.map((step, index) => {
                                const { track } = step;
                                const quality = step.match == null ? "" : step.match >= 85 ? "smooth" : step.match < 60 ? "jump" : "";
                                return (
                                    <div key={track.id} className="flow-card">
                                        <p className="flow-number">
                                            {String(index + 1).padStart(2, "0")} // {step.match == null ? "START" : `MATCH ${Math.round(step.match)}%`}
                                        </p>
                                        <div className="flow-cover">
                                            <div style={{ width: "100%", height: "100%", background: "#1c0d33", borderRadius: "10px", display: "grid", placeItems: "center" }}>
                                                <Music size={28} color="#00e5ff" />
                                            </div>
                                            <button><Play size={14} /></button>
                                        </div>
                                        <div className="flow-info">
                                            <strong>{track.title}</strong>
                                            <span>{track.artist}</span>
                                            <div className="mini-viz">
                                                <span><i style={{ width: `${Math.min(100, (track.bpm ?? 0) / 1.8)}%` }} /></span>
                                                <span><i style={{ width: `${Math.min(100, energyPercent(track.energy))}%` }} /></span>
                                            </div>
                                            <small><b>{track.bpm} BPM</b><i></i><span>{Math.round(energyPercent(track.energy))}% energy</span></small>
                                            {step.bpm_change != null && step.energy_change != null && (
                                                <em className={`flow-delta ${quality}`}>
                                                    {signed(step.bpm_change)} BPM · {signed(Math.round(step.energy_change))}% energy
                                                </em>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flow-legend">
                    <span><i className="cyan" /> BPM TEMPO</span>
                    <span><i className="pink" /> ENERGY</span>
                    <p>
                        Distance = √(ΔBPM² + Δenergy²) on normalised values
                        {flow && steps.length > 1 && ` · computed in ${flow.elapsed_ms.toFixed(3)} ms`}
                    </p>
                </div>
            </div>

            <div className="insight-row">
                <div>
                    <div className="insight-icon"><Activity size={18} /></div>
                    <p>
                        <strong>Algorithmic Harmony Score</strong>
                        <small>
                            {flow && transitions > 0
                                ? `Average match across ${transitions} transition${transitions === 1 ? "" : "s"}. A random shuffle of the same tracks would average ${Math.round(flow.random_baseline)}%.`
                                : "Generate a flow to score its transitions."}
                            {flow && flow.skipped_tracks > 0 && ` ${flow.skipped_tracks} track(s) without BPM or energy were left out.`}
                        </small>
                    </p>
                </div>
                <div className="score-ring">
                    <span>{flow && transitions > 0 ? Math.round(flow.harmony_score) : "–"}<small>%</small></span>
                    <em>MATCH RATING</em>
                </div>
            </div>
        </div>
    );
}

// --- MODALS ---

function AddTrackModal({ isOpen, onClose, onTrackCreated }: { isOpen: boolean; onClose: () => void; onTrackCreated: (t: Track) => void }) {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [genre, setGenre] = useState("");
    const [duration, setDuration] = useState("3:30");
    const [bpm, setBpm] = useState("120");
    const [energy, setEnergy] = useState("80");
    const [year, setYear] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("http://127.0.0.1:8000/tracks/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title, artist, genre, duration,
                    bpm: parseInt(bpm, 10) || 120,
                    energy: (parseFloat(energy) || 80) > 1 ? parseFloat(energy) / 100 : parseFloat(energy),
                    release_year: parseInt(year, 10) || null,
                }),
            });
            if (res.ok) {
                const created = await res.json();
                onTrackCreated(created);
                onClose();
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-card">
                <div className="modal-top">
                    <h2>Add New Track</h2>
                    <button onClick={onClose} style={{ border: 0, background: "none", color: "#81768f", cursor: "pointer" }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="form-grid">
                    <label className="wide">
                        <span>TRACK TITLE *</span>
                        <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Velvet Skies" />
                    </label>
                    <label className="wide">
                        <span>ARTIST NAME *</span>
                        <input required type="text" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Nova Lane" />
                    </label>
                    <label>
                        <span>GENRE</span>
                        <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Dream Pop" />
                    </label>
                    <label>
                        <span>DURATION</span>
                        <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="3:48" />
                    </label>
                    <label>
                        <span>BPM</span>
                        <input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="120" />
                    </label>
                    <label>
                        <span>ENERGY (1-100)</span>
                        <input type="number" value={energy} onChange={(e) => setEnergy(e.target.value)} placeholder="80" />
                    </label>
                    <label>
                        <span>RELEASE YEAR</span>
                        <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" />
                    </label>

                    <div className="modal-actions wide">
                        <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary-button">Save Track</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditTrackModal({ isOpen, track, onClose, onTrackUpdated }: { isOpen: boolean; track: Track | null; onClose: () => void; onTrackUpdated: (t: Track) => void }) {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [genre, setGenre] = useState("");
    const [duration, setDuration] = useState("3:30");
    const [bpm, setBpm] = useState("120");
    const [energy, setEnergy] = useState("80");
    const [year, setYear] = useState("");

    useEffect(() => {
        if (track) {
            setTitle(track.title || "");
            setArtist(track.artist || "");
            setGenre(track.genre || "");
            setDuration(track.duration || "3:30");
            setBpm(track.bpm ? String(track.bpm) : "120");
            setEnergy(track.energy != null ? String(track.energy <= 1 ? Math.round(track.energy * 100) : track.energy) : "80");
            setYear(track.release_year != null ? String(track.release_year) : "");
        }
    }, [track]);

    if (!isOpen || !track) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://127.0.0.1:8000/tracks/${track.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title, artist, genre, duration,
                    bpm: parseInt(bpm, 10) || 120,
                    energy: (parseFloat(energy) || 80) > 1 ? parseFloat(energy) / 100 : parseFloat(energy),
                    release_year: parseInt(year, 10) || null,
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                onTrackUpdated(updated);
                onClose();
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-card">
                <div className="modal-top">
                    <h2>Edit Track Details</h2>
                    <button onClick={onClose} style={{ border: 0, background: "none", color: "#81768f", cursor: "pointer" }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="form-grid">
                    <label className="wide">
                        <span>TRACK TITLE</span>
                        <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </label>
                    <label className="wide">
                        <span>ARTIST</span>
                        <input required type="text" value={artist} onChange={(e) => setArtist(e.target.value)} />
                    </label>
                    <label>
                        <span>GENRE</span>
                        <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} />
                    </label>
                    <label>
                        <span>DURATION</span>
                        <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} />
                    </label>
                    <label>
                        <span>BPM</span>
                        <input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)} />
                    </label>
                    <label>
                        <span>ENERGY (1-100)</span>
                        <input type="number" value={energy} onChange={(e) => setEnergy(e.target.value)} />
                    </label>
                    <label>
                        <span>RELEASE YEAR</span>
                        <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" />
                    </label>

                    <div className="modal-actions wide">
                        <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary-button">Update Track</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CreatePlaylistModal({ isOpen, onClose, onPlaylistCreated }: { isOpen: boolean; onClose: () => void; onPlaylistCreated: (p: Playlist) => void }) {
    const [name, setName] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("http://127.0.0.1:8000/playlists/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                const created = await res.json();
                onPlaylistCreated(created);
                setName("");
                onClose();
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: "400px" }}>
                <div className="modal-top">
                    <h2>Create Playlist</h2>
                    <button onClick={onClose} style={{ border: 0, background: "none", color: "#81768f", cursor: "pointer" }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="form-grid">
                    <label className="wide">
                        <span>PLAYLIST NAME</span>
                        <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Synthwave Selection" />
                    </label>

                    <div className="modal-actions wide">
                        <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary-button">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AddTracksToPlaylistModal({ isOpen, playlist, allTracks, onClose, onTrackAdded }: { isOpen: boolean; playlist: Playlist | null; allTracks: Track[]; onClose: () => void; onTrackAdded: (pId: number, t: Track) => void }) {
    if (!isOpen || !playlist) return null;

    const currentIds = new Set((playlist.tracks || []).map((t) => t.id));
    const available = allTracks.filter((t) => !currentIds.has(t.id));

    const handleAdd = async (track: Track) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/playlists/${playlist.id}/tracks/${track.id}`, { method: "POST" });
            if (res.ok) {
                onTrackAdded(playlist.id, track);
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-card">
                <div className="modal-top">
                    <h2>Add Tracks to "{playlist.name}"</h2>
                    <button onClick={onClose} style={{ border: 0, background: "none", color: "#81768f", cursor: "pointer" }}><X size={20} /></button>
                </div>

                <div style={{ display: "grid", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                    {available.length > 0 ? (
                        available.map((track) => (
                            <div key={track.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                                <div>
                                    <strong style={{ display: "block", fontSize: "11px", color: "#fff" }}>{track.title}</strong>
                                    <small style={{ color: "#81768f", fontSize: "9px" }}>{track.artist}</small>
                                </div>
                                <button className="primary-button" style={{ height: "30px", fontSize: "9px" }} onClick={() => handleAdd(track)}>
                                    <Plus size={12} /> Add
                                </button>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: "#81768f", textAlign: "center", padding: "20px" }}>All database tracks are in this playlist.</p>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="primary-button" onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
}

// --- MAIN DASHBOARD APP ---

export default function Dashboard() {
    const [view, setView] = useState("home");
    const [tracks, setTracks] = useState<Track[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [autocomplete, setAutocomplete] = useState<AutocompleteResult | null>(null);
    const [exactSearch, setExactSearch] = useState<ExactSearch | null>(null);
    const [browse, setBrowse] = useState<BrowseOptions>(DEFAULT_BROWSE);
    const [libraryTracks, setLibraryTracks] = useState<Track[] | null>(null);
    const [sortInfo, setSortInfo] = useState<SortInfo | null>(null);

    const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);
    const [editingTrack, setEditingTrack] = useState<Track | null>(null);
    const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false);
    const [isAddTracksToPlaylistModalOpen, setIsAddTracksToPlaylistModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [tracksRes, playlistsRes] = await Promise.all([
                    fetch("http://127.0.0.1:8000/tracks/"),
                    fetch("http://127.0.0.1:8000/playlists/")
                ]);

                if (tracksRes.ok) setTracks(await tracksRes.json());
                if (playlistsRes.ok) setPlaylists(await playlistsRes.json());
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Trie-backed autocomplete, debounced so we don't hit the API on every keystroke
    useEffect(() => {
        const q = searchQuery.trim();
        if (!q) {
            setAutocomplete(null);
            setExactSearch(null);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`http://127.0.0.1:8000/search/autocomplete?q=${encodeURIComponent(q)}`, { signal: controller.signal });
                if (res.ok) setAutocomplete(await res.json());
            } catch (err) {
                if ((err as Error).name !== "AbortError") console.error(err);
            }
        }, 120);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchQuery]);

    // Library table: filtered in SQL and sorted by the chosen algorithm on the backend.
    // Re-runs when the controls change, an exact search starts or ends, or the track list is edited.
    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            const params = buildBrowseParams(browse);
            let url = `http://127.0.0.1:8000/tracks/?${params}`;
            if (exactSearch) {
                params.set("q", exactSearch.query);
                params.set("field", exactSearch.field);
                url = `http://127.0.0.1:8000/search/exact?${params}`;
            }

            try {
                const res = await fetch(url, { signal: controller.signal });
                if (res.ok) {
                    setLibraryTracks(await res.json());
                    const algorithm = res.headers.get("X-Sort-Algorithm");
                    const ms = parseFloat(res.headers.get("X-Sort-Time-Ms") ?? "");
                    setSortInfo(algorithm && !isNaN(ms) ? { algorithm, ms } : null);
                }
            } catch (err) {
                if ((err as Error).name !== "AbortError") console.error(err);
            }
        }, 200);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [browse, exactSearch, tracks]);

    const handleExactSearch = (query: string, field: SearchField = "any") => {
        setExactSearch({ query, field });
        setView("library");
    };

    const handleBrowseChange = (changes: Partial<BrowseOptions>) => {
        setBrowse((prev) => ({ ...prev, ...changes }));
    };

    const handleClearSearch = () => {
        setExactSearch(null);
        setSearchQuery("");
    };

    const handleSelectPlaylist = async (pl: Playlist) => {
        setSelectedPlaylistId(pl.id);
        setView("playlist");

        try {
            const res = await fetch(`http://127.0.0.1:8000/playlists/${pl.id}`);
            if (res.ok) {
                const fresh = await res.json();
                setPlaylists((prev) => prev.map((p) => p.id === pl.id ? fresh : p));
            }
        } catch (err) { console.error(err); }
    };

    const handlePlaylistCreated = (newPl: Playlist) => {
        setPlaylists((prev) => [...prev, { ...newPl, tracks: [] }]);
        handleSelectPlaylist(newPl);
    };

    const handleRenamePlaylist = async (playlist: Playlist) => {
        const newName = prompt("New playlist name:", playlist.name);
        if (!newName) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/playlists/${playlist.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName }),
            });

            if (res.ok) {
                const updated = await res.json();
                setPlaylists((prev) => prev.map((p) => p.id === playlist.id ? { ...p, name: updated.name } : p));
            }
        } catch (err) { console.error(err); }
    };

    const handleDeletePlaylist = async (id: number) => {
        if (!confirm("Delete playlist?")) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/playlists/${id}`, { method: "DELETE" });
            if (res.ok) {
                setPlaylists((prev) => prev.filter((p) => p.id !== id));
                if (selectedPlaylistId === id) {
                    setSelectedPlaylistId(null);
                    setView("home");
                }
            }
        } catch (err) { console.error(err); }
    };

    const handleTrackAddedToPlaylist = (pId: number, track: Track) => {
        setPlaylists((prev) => prev.map((p) => {
            if (p.id === pId) {
                return { ...p, tracks: [...(p.tracks || []), track] };
            }
            return p;
        }));
    };

    const handleRemoveTrackFromPlaylist = async (pId: number, trackId: number) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/playlists/${pId}/tracks/${trackId}`, { method: "DELETE" });
            if (res.ok) {
                setPlaylists((prev) => prev.map((p) => {
                    if (p.id === pId) {
                        return { ...p, tracks: (p.tracks || []).filter((t) => t.id !== trackId) };
                    }
                    return p;
                }));
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteTrack = async (id: number) => {
        if (!confirm("Delete track from library?")) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/tracks/${id}`, { method: "DELETE" });
            if (res.ok) {
                setTracks((prev) => prev.filter((t) => t.id !== id));
                setPlaylists((prev) => prev.map((p) => ({
                    ...p,
                    tracks: (p.tracks || []).filter((t) => t.id !== id)
                })));
            }
        } catch (err) { console.error(err); }
    };

    const handleTrackUpdated = (updated: Track) => {
        setTracks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    };

    const genres = Array.from(new Set(tracks.map((t) => t.genre).filter((g): g is string => Boolean(g)))).sort();

    const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId) || null;

    return (
        <div className="app-shell">
            <div className="ambient ambient-one" />
            <div className="ambient ambient-two" />

            <Sidebar
                view={view}
                setView={setView}
                playlists={playlists}
                selectedPlaylistId={selectedPlaylistId}
                onSelectPlaylist={handleSelectPlaylist}
                onOpenCreatePlaylistModal={() => setIsCreatePlaylistModalOpen(true)}
            />

            <div className="main-column">
                <Topbar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    autocomplete={autocomplete}
                    onExactSearch={handleExactSearch}
                    onOpenAddModal={() => setIsAddTrackModalOpen(true)}
                />

                {view === "home" && (
                    <HomeView
                        tracks={tracks}
                        playlists={playlists}
                        onOpenAddModal={() => setIsAddTrackModalOpen(true)}
                        onOpenCreatePlaylistModal={() => setIsCreatePlaylistModalOpen(true)}
                        setView={setView}
                        onSelectPlaylist={handleSelectPlaylist}
                    />
                )}

                {view === "library" && (
                    <Library
                        tracks={libraryTracks ?? []}
                        loading={loading || libraryTracks === null}
                        searchQuery={exactSearch?.query}
                        onClearSearch={handleClearSearch}
                        browse={browse}
                        onBrowseChange={handleBrowseChange}
                        genres={genres}
                        sortInfo={sortInfo}
                        onEditTrack={(t) => setEditingTrack(t)}
                        onDeleteTrack={handleDeleteTrack}
                    />
                )}

                {view === "playlist" && activePlaylist && (
                    <PlaylistView
                        playlist={activePlaylist}
                        onOpenAddTracksModal={() => setIsAddTracksToPlaylistModalOpen(true)}
                        onRenamePlaylist={handleRenamePlaylist}
                        onDeletePlaylist={handleDeletePlaylist}
                        onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
                    />
                )}

                {view === "shuffle" && <SmartShuffleView tracks={tracks} playlists={playlists} />}
            </div>

            <AddTrackModal
                isOpen={isAddTrackModalOpen}
                onClose={() => setIsAddTrackModalOpen(false)}
                onTrackCreated={(t) => setTracks((prev) => [...prev, t])}
            />

            <EditTrackModal
                isOpen={editingTrack !== null}
                track={editingTrack}
                onClose={() => setEditingTrack(null)}
                onTrackUpdated={handleTrackUpdated}
            />

            <CreatePlaylistModal
                isOpen={isCreatePlaylistModalOpen}
                onClose={() => setIsCreatePlaylistModalOpen(false)}
                onPlaylistCreated={handlePlaylistCreated}
            />

            <AddTracksToPlaylistModal
                isOpen={isAddTracksToPlaylistModalOpen}
                playlist={activePlaylist}
                allTracks={tracks}
                onClose={() => setIsAddTracksToPlaylistModalOpen(false)}
                onTrackAdded={handleTrackAddedToPlaylist}
            />
        </div>
    );
}