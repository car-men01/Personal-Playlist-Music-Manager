import React, { useState, useEffect } from "react";
import {
    Search, Plus, Bell, Home as HomeIcon, Library as LibraryIcon,
    Sparkles, Play, Edit2, Trash2, Clock, ChevronDown, X,
    Music, Zap, Activity, ListMusic, ArrowRight, ListPlus, FolderPlus
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
}

interface Playlist {
    id: number;
    name: string;
    tracks?: Track[];
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
                    onOpenAddModal
                }: {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    onOpenAddModal: () => void;
}) {
    return (
        <header className="topbar">
            <div className="search-wrap">
                <Search size={15} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Fuzzy search titles, artists, moods..."
                />
                <span className="shortcut">⌘K</span>
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
                     onEditTrack,
                     onDeleteTrack
                 }: {
    tracks: Track[];
    loading: boolean;
    onEditTrack: (track: Track) => void;
    onDeleteTrack: (id: number) => void;
}) {
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
                    <div>
                        <h2>Tracks Database</h2>
                        <p>All music assets populated from SQLite.</p>
                    </div>
                    <div className="sort-control">
                        Sort by:
                        <select>
                            <option>Recently Added</option>
                            <option>Title</option>
                            <option>BPM</option>
                        </select>
                        <ChevronDown size={14} />
                    </div>
                </div>

                <div className="table-wrap">
                    {loading ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#81768f" }}>Connecting to backend database...</div>
                    ) : tracks.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#81768f" }}>No tracks found. Click "Add New Track" to insert data.</div>
                    ) : (
                        <table>
                            <thead>
                            <tr>
                                <th className="index-cell">#</th>
                                <th>Track</th>
                                <th>Genre</th>
                                <th><Clock size={14} className="th-icon" /></th>
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
                    <span>Showing {tracks.length} tracks</span>
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

function SmartShuffleView({ tracks }: { tracks: Track[] }) {
    const flowTracks = tracks.slice(0, 6);

    return (
        <div className="content shuffle-content">
            <div className="shuffle-hero">
                <div>
                    <p className="eyebrow"><Sparkles size={12} /> AI HARMONIC ENGINE</p>
                    <h1>DJ Smart <em>Shuffle Flow</em></h1>
                    <p>Analyzes BPM, harmonic key, and dynamic energy curves across your SQLite track database to construct seamless algorithmic transitions.</p>
                </div>
                <button className="primary-button glow-button">
                    <Sparkles size={16} /> Regenerate Flow
                </button>
            </div>

            <div className="flow-panel">
                <div className="flow-header">
                    <div><i className="live-dot" /> LIVE WAVE HARMONICS GENERATOR</div>
                    <span>6 TRACK BLEND</span>
                </div>

                <div className="flow-canvas">
                    <div className="flow-grid">
                        {flowTracks.map((track, index) => (
                            <div key={track.id} className="flow-card">
                                <p className="flow-number">0{index + 1} // MATCH {98 - index * 2}%</p>
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
                                        <span><i style={{ width: `${(track.bpm || 120) / 1.8}%` }} /></span>
                                        <span><i style={{ width: `${(track.energy || 0.8) * 100}%` }} /></span>
                                    </div>
                                    <small><b>{track.bpm || 120} BPM</b><i></i><span>{track.genre || "Pop"}</span></small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flow-legend">
                    <span><i className="cyan" /> BPM TEMPO ACCELERATION</span>
                    <span><i className="pink" /> DYNAMIC ENERGY WAVE</span>
                    <p>Harmonic Match algorithm configured for minimal dynamic variance.</p>
                </div>
            </div>

            <div className="insight-row">
                <div>
                    <div className="insight-icon"><Activity size={18} /></div>
                    <p>
                        <strong>Algorithmic Harmony Score</strong>
                        <small>Optimal energy curve detected with zero harmonic key clashes across queue.</small>
                    </p>
                </div>
                <div className="score-ring">
                    <span>96<small>%</small></span>
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

    useEffect(() => {
        if (track) {
            setTitle(track.title || "");
            setArtist(track.artist || "");
            setGenre(track.genre || "");
            setDuration(track.duration || "3:30");
            setBpm(track.bpm ? String(track.bpm) : "120");
            setEnergy(track.energy != null ? String(track.energy <= 1 ? Math.round(track.energy * 100) : track.energy) : "80");
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

    const filteredTracks = tracks.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.genre && t.genre.toLowerCase().includes(searchQuery.toLowerCase()))
    );

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
                        tracks={filteredTracks}
                        loading={loading}
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

                {view === "shuffle" && <SmartShuffleView tracks={tracks} />}
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
                onTrackUpdated={(updated) => setTracks((prev) => prev.map((t) => t.id === updated.id ? updated : t))}
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