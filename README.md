# Sonora: Personal Music Playlist Manager
**Computational Thinking Masters Project**

## 1. Project Overview
The "Personal Music Playlist Manager" (code-named *Sonora*) is a full-stack web application designed to manage a local music library, organize custom playlists, and discover relationships between tracks. This project emphasizes **computational thinking** by requiring the implementation and analysis of specific algorithms and data structures for searching, sorting, and recommendation systems.

### Frontend Figma Mockup 
![alt text](<Screenshot 2026-10-16 144122.png>)

---

## Quick Start (Windows)

**Prerequisites:** [Python 3.10+](https://www.python.org/downloads/) (tick *Add to PATH* when installing) and [Node.js 18+](https://nodejs.org) (22 LTS recommended).

From the project root, in PowerShell:

```powershell
.\run.ps1
```

That's it. The script:

1. Checks that Python and Node are installed and recent enough.
2. **First run only:** creates the Python virtual environment in `backend\.venv`, installs the Python and npm dependencies, and creates and seeds `backend\music_manager.db` with sample tracks and playlists.
3. **Later runs:** reuses the environment and dependencies. They are reinstalled only if `requirements.txt` or `package-lock.json` has changed since the last install, so a normal start takes a few seconds.
4. Starts the backend on <http://127.0.0.1:8000> (interactive API docs at <http://127.0.0.1:8000/docs>), waits until it responds, then starts the frontend and opens it in your browser (usually <http://localhost:5173>).

Press **Ctrl+C** to stop both servers.

| Option | What it does |
|---|---|
| `.\run.ps1 -Reinstall` | Force a reinstall of all Python and npm dependencies |
| `.\run.ps1 -SetupOnly` | Do the setup steps but don't start the servers |
| `.\run.ps1 -NoBrowser` | Don't open the browser automatically |

**Troubleshooting**

* *"running scripts is disabled on this system"*: run `powershell -ExecutionPolicy Bypass -File .\run.ps1` instead, or allow local scripts once with `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
* *"Port 8000 is already in use"*: the backend is already running in another terminal. Stop it first. The frontend expects the API on port 8000.
* *Node is too old*: Vite needs Node 18+. If you use [nvm-windows](https://github.com/coreybutler/nvm-windows), run `nvm install 22` then `nvm use 22`.
* *Start with an empty database*: stop the app, delete `backend\music_manager.db`, and run the script again. It will be recreated and re-seeded.

<details>
<summary>Running manually (without the script)</summary>

```powershell
# Terminal 1 - backend (must be run from the backend folder)
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe core\seed.py          # optional: sample data
.\.venv\Scripts\python.exe -m uvicorn main:app --reload

# Terminal 2 - frontend
cd frontend
npm install
npm run dev
```
</details>

---

## 2. Technology Stack
To ensure rapid development, maintainability, and seamless integration, the project will utilize the following stack with a **Layered Architecture** (API, Services, Repositories):

-   **Backend:** **Python FastAPI**
    *   *Why:* Extremely fast, highly intuitive, and provides automatic interactive API documentation (Swagger UI). Excellent for implementing and exposing complex Python algorithms within a decoupled service layer.
-   **Database:** **SQLite via SQLAlchemy (ORM)**
    *   *Why:* SQLite requires zero configuration and lives in a single file, making it the easiest database to set up. SQLAlchemy integrates perfectly with FastAPI and abstracts complex SQL logic cleanly, particularly for many-to-many relationships.
-   **Frontend:** **HTML/JS + Tailwind CSS**
    *   *Why:* Tailwind CSS allows for rapid, utility-first styling directly in HTML, making it easy to replicate the sleek, dark-mode aesthetic of the provided UI mockup without writing complex custom CSS.

---

## 3. Core Requirements (Iterations 1 & 2)

### Iteration 1: CRUD Operations (Data Management & Relational Modeling)
The foundational data layer modeling tracks and custom playlists using a **Many-to-Many database relationship** via an association table.
-   **Tracks:** 
    *   **Create:** Add a new track with metadata (`title`, `artist`, `duration`, `genre`, `energy_score`, `tempo_bpm`).
    *   **Read:** Display a list of all songs or view detailed metadata for a specific song.
    *   **Update:** Edit tags (e.g., fix a misspelled artist name, adjust energy score).
    *   **Delete:** Drop a song entirely from the primary library (cascading removal from all playlists).
-   **Playlists:**
    *   **Create/Delete:** Generate new custom playlists or delete existing ones.
    *   **Manage:** Add or remove existing tracks from specific playlists without deleting the underlying track data.

### Iteration 2: Searching, Sorting, and Filtering (Algorithmic Focus)
This iteration introduces computational complexity analysis.
-   **Searching:**
    *   *Exact Search:* $O(1)$ or $O(\log n)$ retrieval using database indexing by artist or title.
    *   *Fuzzy/Prefix Search:* Implement an auto-complete feature as the user types. *Computational requirement:* Implement a **Trie (Prefix Tree)** data structure or optimized substring matching, comparing its efficiency to a brute-force linear search.
-   **Sorting & Filtering:**
    *   Filter tracks by genre, BPM range, or energy level.
    *   Sort songs by duration, release year, or tempo.
    *   *Computational requirement:* Implement both **QuickSort** and **MergeSort**. Perform a runtime comparison benchmark by sorting a generated dataset of 10,000+ tracks to demonstrate Big $O(n \log n)$ performance characteristics in the real world.

---

## 4. Iteration 3: Advanced Feature (Recommendations & Graphs)
As a master's level project, the final iteration requires a complex feature utilizing advanced data structures, machine learning concepts, or graph theory. 

**Below are several suggestions; you only need to pick ONE to implement:**

### Option A: "DJ Smart Shuffle" (Greedy Graph Traversal)
Create a playlist that transitions smoothly between tracks.
-   **Concept:** Treat each song as a node in a graph. The edges are the "distance" between songs based on BPM and Energy.
-   **Algorithm:** Use a Nearest-Neighbor or Greedy algorithm to find the next song that has the closest BPM and Energy score to the current song, preventing jarring transitions.

### Option B: Simple Recommendation Engine (Euclidean Distance)
"Find 5 songs most similar to my favorite track."
-   **Concept:** Map songs into a multi-dimensional vector space using audio features (e.g., $x=$ tempo, $y=$ energy, $z=$ danceability).
-   **Algorithm:** Calculate the **Euclidean distance** $d = \sqrt{(x_2-x_1)^2 + (y_2-y_1)^2 + (z_2-z_1)^2}$ between the target track and all other tracks. Return the $k$ tracks with the smallest distance.

### Option C: K-Means Clustering for "Mood" Playlists
Automatically group the user's library into distinct "moods".
-   **Concept:** Group unlabelled tracks based on their tempo and energy.
-   **Algorithm:** Implement a basic **K-Means Clustering** algorithm from scratch. Plot the library into $K$ clusters (e.g., $K=4$ for Chill, Upbeat, Aggressive, Melancholy) and generate distinct playlists from these clusters.

### Option D: "Six Degrees of Separation" Artist Graph
-   **Concept:** Model the database to track featured artists or overlapping genres.
-   **Algorithm:** Implement **Breadth-First Search (BFS)** or **Dijkstra's Algorithm** to find the shortest path between two vastly different artists in the user's library (e.g., finding a path from a Classical composer to a Heavy Metal band through shared genres or compilation albums).

---

## 5. Development Roadmap

1.  **Setup:** Initialize FastAPI project. Create `models.py` (SQLAlchemy schemas) and `schemas.py` (Pydantic models).
2.  **Database:** Configure `sqlite:///./musicapp.db`. Write a script to seed the database with 100+ dummy songs (using a library like `Faker`).
3.  **API Endpoints:** Build out the `/tracks` POST, GET, PUT, DELETE endpoints.
4.  **Frontend Integration:** Serve a static `index.html` styled with Tailwind via FastAPI. Use vanilla JavaScript `fetch()` calls to populate the UI table from the backend API.
5.  **Algorithmic Implementation:** Build out the Search/Sort logic and the chosen Advanced Feature (Iteration 3) in a dedicated `services.py` module to keep the API routes clean.
6.  **Documentation:** Write a brief report analyzing the time and space complexity of the algorithms used.

---

## 6. Implementation Status

The frontend ended up as **React + TypeScript (Vite) with Tailwind**, not plain HTML/JS. It is served separately from the API, which is why the app runs two servers. For Iteration 3 we chose **Option A, DJ Smart Shuffle**.

### Iteration 1: CRUD ✅
* **Tracks:** create, list, view, edit and delete through `/tracks/`. A track has a title, artist, duration, genre, BPM, energy and **release year**.
* **Playlists:** create, rename and delete playlists, and add or remove tracks, through `/playlists/`.
* **Start-up migrations:** `apply_migrations()` in `core/database.py` updates databases created by older versions of the app. It adds new columns and indexes, and is safe to run on every start.

### Iteration 2: Searching ✅
Use the search box in the top bar (focus it with **Ctrl/⌘+K**).

* **Autocomplete as you type** (`GET /search/autocomplete?q=`). This uses a **Trie (prefix tree)** that indexes every title and artist, plus each word inside them, so `sk` finds *Velvet Skies*. The Trie is built from the database the first time someone searches. After that it is updated whenever a track is created, edited or deleted. Every request also runs a **brute-force linear scan** on the same data, and the dropdown shows both timings.
* **Exact search** on Enter (`GET /search/exact?q=&field=any|title|artist`). This uses case-insensitive **B-tree indexes** on `title` and `artist`, so a lookup is O(log n) instead of a full table scan. SQLite's query plan confirms the index is used: `SEARCH tracks USING INDEX ix_tracks_title_nocase`.

| Structure | Lookup cost |
|---|---|
| Trie | O(p + m): prefix length + size of the matching subtree, independent of library size |
| Linear scan | O(N · T · p): every token of every track |
| B-tree index | O(log n) |

### Iteration 2: Sorting & Filtering ✅
Use the **Sort by** dropdown, the ↑/↓ toggle and the filter bar on **My Library**.

* **Filters:** genre, BPM range, energy range (as a percentage). They are applied in SQL.
* **Sort fields:** recently added, title, duration, release year, BPM or energy. Tracks missing the value always go last.
* **Algorithm choice:** sorting runs in Python with the **MergeSort / QuickSort** chosen in the UI. The footer shows which algorithm ran and how long it took (sent by the API in the `X-Sort-Algorithm` and `X-Sort-Time-Ms` headers).
* **MergeSort** (bottom-up): O(n log n) in every case, stable, O(n) extra space.
* **QuickSort** (in place): random pivot and 3-way partitioning, so runs of equal keys such as many tracks at 120 BPM stay fast. O(n log n) expected, O(log n) stack. Not stable.

### Iteration 3: DJ Smart Shuffle ✅
Open **DJ Smart Shuffle** in the sidebar.

* **The graph:** every track is a node at (BPM, energy), both scaled to 0–1 so they weigh equally. An edge's weight is the Euclidean distance between two tracks.
* **The algorithm:** a **greedy nearest-neighbour traversal**. Start from a track, then always move to the closest track not yet played. It runs in O(n²) time and O(n) space. Every step is the smoothest one available, but the total path is not guaranteed to be the shortest (that is the NP-hard travelling-salesman problem).
* **Controls:** shuffle the whole library or one playlist, start from a chosen track or a random one, and **Regenerate** for a new random start.
* **Scoring:** each card shows its match % with the previous track (1 − distance/√2) and the BPM and energy change. The **Harmony Score** is the average match across all transitions. It is shown next to the exact expected score of a *random* shuffle of the same tracks for comparison.
* **Endpoint:** `GET /shuffle/smart?playlist_id=&start_track_id=`.

### Benchmarks
Each script generates synthetic data and checks its results against a reference before timing. Run them from the `backend` folder:

```powershell
cd backend
.\.venv\Scripts\python.exe -m benchmarks.search_benchmark    # Trie vs linear, index vs full scan
.\.venv\Scripts\python.exe -m benchmarks.sort_benchmark      # MergeSort vs QuickSort vs Timsort
.\.venv\Scripts\python.exe -m benchmarks.shuffle_benchmark   # greedy vs random shuffle
```

Each script also accepts custom sizes, e.g. `-m benchmarks.sort_benchmark 10000 200000`. Sample results from one development machine (absolute times will vary):

**Prefix search, 50,000 tracks.** The linear scan costs the same whatever you type. The Trie gets faster with every character, because fewer tracks match:

| Prefix length | Avg matches | Trie | Linear | Speed-up |
|---|---|---|---|---|
| 1 | 10,691 | 6.3 ms | 23.0 ms | 3.6× |
| 3 | 1,559 | 0.84 ms | 24.3 ms | 29× |
| 4 | 405 | 0.17 ms | 24.9 ms | 146× |

**Exact search, 50,000 tracks:** about 0.005 ms with the index against 3.6 ms for a full scan (about 670×). The indexed time stays flat as the library grows.

**Sorting.** Runtime divided by n·log₂n stays roughly constant over a 100× increase in n, which is the practical evidence of O(n log n):

| Tracks | MergeSort | QuickSort | ns per n·log₂n (Merge / Quick) |
|---|---|---|---|
| 1,000 | 2.3 ms | 2.2 ms | 227 / 223 |
| 10,000 | 31 ms | 25 ms | 236 / 189 |
| 100,000 | 460 ms | 451 ms | 277 / 271 |

On already-sorted and reverse-sorted input QuickSort is unaffected, thanks to the random pivot. When all keys are equal it is about 6× faster than MergeSort, thanks to the 3-way partition. Python's built-in Timsort is roughly 6× faster than both because it is implemented in C.

**DJ Smart Shuffle.** Runtime divided by n² stays roughly constant (O(n²)). Greedy transitions are much smoother than a random order:

| Tracks | Time | ns per n² | Greedy avg match | Random avg match |
|---|---|---|---|---|
| 100 | 1.2 ms | 118 | 93.5% | 63.6% |
| 1,000 | 148 ms | 148 | 98.0% | 64.1% |
| 4,000 | 1.86 s | 116 | 99.0% | 62.9% |

### Where the code lives

| Path | Contents |
|---|---|
| `run.ps1` | One-command setup and launch script |
| `backend/main.py` | FastAPI app, CORS, start-up migrations |
| `backend/api/router.py` | All HTTP endpoints |
| `backend/services/search_algorithms.py` | Trie, tokeniser, linear prefix search |
| `backend/services/sorting_algorithms.py` | MergeSort, QuickSort, track sort keys |
| `backend/services/shuffle_algorithms.py` | Feature scaling, distance, greedy nearest-neighbour flow |
| `backend/services/*_service.py` | Business logic connecting the algorithms to the database |
| `backend/repositories/` | SQLAlchemy queries, including filters and indexed exact search |
| `backend/benchmarks/` | Benchmark scripts for all three algorithm areas |
| `backend/core/seed.py` | Sample data; `core/clear_db.py` deletes all tracks |
| `frontend/src/Dashboard.tsx` | The entire React UI |

### Known limitations
* Playlists don't store track order: the link table has no position column. Because of that, a Smart Shuffle flow can't yet be saved as an ordered playlist.
* Energy is stored on two scales in older data (0–1 and 0–100). The app treats both as percentages everywhere.
* `GET /tracks/` returns at most 100 tracks by default (`?limit=` to change).
* The frontend calls the API at the fixed address `http://127.0.0.1:8000`.
