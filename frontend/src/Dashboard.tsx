"use client";

import { useState } from "react";
import {
    Search, Plus, Bell, Home, Library as LibraryIcon,
    Sparkles, MoreHorizontal, Play, Pause, Edit2, Trash2, Clock, ChevronDown
} from "lucide-react";

// --- MOCK DATA ---
const tracks = [
    { title: "Velvet Skies", artist: "Nova Lane", duration: "3:48", genre: "Dream Pop", bpm: 112, energy: 78, cover: "https://images.unsplash.com/photo-1636690513351-0af1763f6237?auto=format&fit=crop&w=100&q=80" },
    { title: "Neon Tides", artist: "Kaia Bloom", duration: "4:12", genre: "Alt R&B", bpm: 118, energy: 84, cover: "https://images.unsplash.com/photo-1557264322-b44d383a2906?auto=format&fit=crop&w=100&q=80" },
    { title: "Afterglow", artist: "Lumen", duration: "3:36", genre: "Electronic", bpm: 124, energy: 92, cover: "https://images.unsplash.com/photo-1549317336-206569e8475c?auto=format&fit=crop&w=100&q=80" },
];

const playlists = [
    { title: "Midnight Reverie", count: "24 tracks", cover: "https://images.unsplash.com/photo-1609705024873-7add858e3036?auto=format&fit=crop&w=100&q=80" },
    { title: "Rose Quartz Radio", count: "18 tracks", cover: "https://images.unsplash.com/photo-1603792370945-44f76a08671a?auto=format&fit=crop&w=100&q=80" },
];

// --- COMPONENTS ---

function Sidebar({ view, setView }: { view: string; setView: (v: string) => void }) {
    return (
        <aside className="w-[250px] shrink-0 h-screen p-6 border-r border-white/10 bg-[#150925]/60 backdrop-blur-xl flex flex-col sticky top-0">
            {/* Brand */}
            <div className="flex items-center gap-3 font-bold tracking-[0.2em] text-sm mb-8 px-2 text-white">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00e5ff] to-[#88f8ff] shadow-[0_0_20px_rgba(0,229,255,0.2)] flex items-center justify-center text-[#130921]">
                    <LibraryIcon size={18} />
                </div>
                SONORA
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 mb-8">
                {[
                    { id: "home", label: "Home", icon: Home },
                    { id: "library", label: "My Library", icon: LibraryIcon },
                    { id: "shuffle", label: "DJ Smart Shuffle", icon: Sparkles, badge: "NEW" },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative ${
                            view === item.id
                                ? "text-[#00e5ff] bg-gradient-to-r from-[#00e5ff]/10 to-transparent"
                                : "text-[#9e94b4] hover:text-white hover:bg-white/5"
                        }`}
                    >
                        {view === item.id && <div className="absolute left-0 w-[2px] h-5 bg-[#00e5ff] shadow-[0_0_10px_#00e5ff] rounded-full" />}
                        <item.icon size={18} />
                        <span>{item.label}</span>
                        {item.badge && <span className="ml-auto text-[9px] font-bold tracking-wider text-[#ff9bc0] bg-[#ff77a9]/10 px-1.5 py-0.5 rounded">{item.badge}</span>}
                    </button>
                ))}
            </nav>

            {/* Playlists */}
            <div className="flex items-center justify-between text-[#6f6682] text-[10px] font-bold tracking-widest mb-3 px-2">
                YOUR PLAYLISTS
                <Plus size={14} className="cursor-pointer hover:text-white" />
            </div>
            <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
                {playlists.map((pl) => (
                    <button key={pl.title} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-left transition-colors">
                        <img src={pl.cover} alt="" className="w-9 h-9 rounded-md object-cover" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium text-[#d8d2e4] truncate">{pl.title}</span>
                            <span className="text-[10px] text-[#6f6682]">{pl.count}</span>
                        </div>
                    </button>
                ))}
            </div>
        </aside>
    );
}

function Topbar() {
    return (
        <header className="h-[76px] px-8 flex items-center gap-4 border-b border-white/5 bg-[#150a25]/40 backdrop-blur-md sticky top-0 z-20">
            <div className="flex-1 max-w-[560px] h-10 rounded-xl border border-white/10 bg-white/5 flex items-center px-4 text-[#81768f] focus-within:border-[#00e5ff]/50 focus-within:ring-2 focus-within:ring-[#00e5ff]/10 transition-all">
                <Search size={16} />
                <input
                    type="text"
                    placeholder="Fuzzy search titles, artists, moods..."
                    className="bg-transparent border-none outline-none flex-1 text-xs text-[#eee9f7] ml-3 placeholder:text-[#71677e]"
                />
                <span className="text-[10px] border border-white/10 px-1.5 py-0.5 rounded text-[#81768f]">⌘K</span>
            </div>

            <button className="ml-auto w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[#a99fb8] hover:text-white transition relative">
                <Bell size={18} />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#ff77a9] rounded-full shadow-[0_0_8px_#ff77a9]"></span>
            </button>

            <button className="h-10 px-4 rounded-xl bg-gradient-to-br from-[#00e5ff] to-[#78f3ff] text-[#09191e] text-xs font-bold flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,229,255,0.2)] transition-all">
                <Plus size={16} /> Add New Track
            </button>
        </header>
    );
}

function Library() {
    return (
        <main className="p-8 max-w-[1200px] mx-auto">
            <div className="mb-8">
                <p className="text-[#00e5ff] text-[10px] font-bold tracking-[0.2em] mb-2 uppercase">Your Private Collection</p>
                <h1 className="text-4xl font-light text-white mb-2">Good evening, Alex.</h1>
                <p className="text-[#9389a5] text-sm">Your soundtrack, beautifully organized. <span className="text-[#ff8db6]">126 tracks</span> across your library.</p>
            </div>

            {/* Glassmorphism Table Container */}
            <div className="border border-white/10 rounded-2xl bg-gradient-to-br from-[#331a46]/60 to-[#180d2a]/60 shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="p-5 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-medium text-white mb-1">My Library</h2>
                        <p className="text-xs text-[#796f89]">Curate and shape your personal sound.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#766c86] bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10 transition">
                        Sort by: Recently Added <ChevronDown size={14} />
                    </div>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="text-[10px] text-[#D0C2EC] tracking-wider uppercase border-b border-white/5">
                        <th className="py-4 px-6 font-semibold w-12 text-center">#</th>
                        <th className="py-4 px-4 font-semibold">Track</th>
                        <th className="py-4 px-4 font-semibold">Genre</th>
                        <th className="py-4 px-4 font-semibold"><Clock size={14} /></th>
                        <th className="py-4 px-4 font-semibold">BPM</th>
                        <th className="py-4 px-4 font-semibold">Energy</th>
                        <th className="py-4 px-4"></th>
                    </tr>
                    </thead>
                    <tbody className="text-xs text-[#c4bccf]">
                    {tracks.map((track, i) => (
                        <tr key={track.title} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                            <td className="py-3 px-4 flex items-center gap-3">
                                <div className="w-10 h-10 relative rounded-md overflow-hidden shrink-0">
                                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                        <Play size={16} className="text-white fill-white" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-white text-sm">{track.title}</span>
                                    <span className="text-[#D0C2EC] text-xs">{track.artist}</span>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                  <span className="text-[10px] text-[#D0C2EC] bg-[#b969b4]/20 border border-[#ff77a9]/30 px-2.5 py-1 rounded-full whitespace-nowrap">
                    {track.genre}
                  </span>
                            </td>
                            <td className="py-3 px-4 text-[#D0C2EC]">{track.duration}</td>
                            <td className="py-3 px-4 text-white font-medium">{track.bpm}</td>
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-[#00e5ff] to-[#ff77a9]" style={{ width: `${track.energy}%` }}></div>
                                    </div>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1.5 text-[#91869f] hover:text-[#00e5ff] transition"><Edit2 size={16} /></button>
                                    <button className="p-1.5 text-[#91869f] hover:text-[#ff77a9] transition"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
}

export default function App() {
    const [view, setView] = useState("library");

    return (
        <div className="min-h-screen flex relative overflow-hidden bg-[#0F051D] text-[#f6f2ff] font-sans selection:bg-[#00e5ff]/30">
            {/* Background Ambient Glows */}
            <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-[#00e5ff] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-[#ff77a9] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.15] pointer-events-none"></div>

            <Sidebar view={view} setView={setView} />

            <div className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10">
                <Topbar />
                {view === "library" && <Library />}
                {view === "shuffle" && <div className="p-8 text-center text-[#9e94b4] mt-20">DJ Smart Shuffle View Coming Soon...</div>}
            </div>
        </div>
    );
}