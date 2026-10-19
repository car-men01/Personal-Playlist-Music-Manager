# Sonora: Implementation Walkthrough & Team Plan

This document has two parts:

1. **[Walkthrough](#part-1--walkthrough-of-the-new-functionality)**: what was added for searching, sorting and filtering, and DJ Smart Shuffle, and how it works step by step.
2. **[Team plan](#part-2--splitting-the-project-between-3-people)**: how the whole app could be divided between three people so that each person owns work in every iteration.

For how to run the app, see the [Quick Start in the README](README.md#quick-start-windows).

---

## Part 1 — Walkthrough of the new functionality

### How a request flows through the backend

Every feature follows the same layering, so it helps to know it first:

```
React UI (frontend/src/Dashboard.tsx)
   │  fetch("http://127.0.0.1:8000/...")
   ▼
api/router.py          → HTTP endpoint: reads and validates query parameters
   ▼
services/*_service.py  → business logic: combines DB data with an algorithm
   ▼
services/*_algorithms.py → the pure algorithm (no FastAPI, no database), reusable by benchmarks
   ▼
repositories/*.py      → SQLAlchemy queries against SQLite
```

The algorithms are kept in their own modules on purpose. They take plain Python lists, so the benchmark scripts in `backend/benchmarks/` can run the exact same code on 10,000+ generated tracks without a database.

---

### Feature 1: Exact search (database indexing)

**Goal:** find tracks whose title or artist *exactly* matches the query, in O(log n).

**Step 1: Create case-insensitive indexes.** `apply_migrations()` in [backend/core/database.py](backend/core/database.py) runs at start-up:

```sql
CREATE INDEX IF NOT EXISTS ix_tracks_title_nocase  ON tracks (title  COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS ix_tracks_artist_nocase ON tracks (artist COLLATE NOCASE);
```

A SQLite index is a **B-tree**, so a lookup takes O(log n) instead of scanning every row. `COLLATE NOCASE` means "Velvet Skies" and "velvet skies" compare as equal. `IF NOT EXISTS` makes this safe to run on every start, including against an existing database.

**Step 2: Query using the same collation.** `TrackRepository.find_exact()` in [backend/repositories/track_repository.py](backend/repositories/track_repository.py) builds:

```python
Track.title.collate("NOCASE") == query      # → WHERE title = ? COLLATE NOCASE
```

The collation must match the index's, or SQLite ignores the index. For `field=any`, title and artist are combined with `OR`, and SQLite uses **both** indexes (its query plan shows `MULTI-INDEX OR`).

**Step 3: Expose it.** `GET /search/exact?q=Lumen&field=any|title|artist`.

**Step 4: The UI.** Type in the top-bar search box (Ctrl/⌘+K focuses it) and press **Enter**. The library switches to "Exact matches for …", with a *Clear search* button; emptying the box also returns to the full list. The results go through the same filters and sorting as the library.

**How to verify:** `benchmarks/search_benchmark.py` prints SQLite's query plan, `SEARCH tracks USING COVERING INDEX ix_tracks_title_nocase`, and compares it with a forced full scan (`NOT INDEXED`). At 50,000 tracks the index is about 770× faster.

---

### Feature 2: Autocomplete (simple substring search)

**Goal:** suggest tracks while the user types.

**Step 1: The query.** `TrackRepository.find_containing()` in [backend/repositories/track_repository.py](backend/repositories/track_repository.py) runs:

```sql
SELECT * FROM tracks
WHERE title LIKE '%text%' OR artist LIKE '%text%'      -- SQLite's LIKE ignores case
ORDER BY CASE WHEN title LIKE 'text%' THEN 0 ELSE 1 END, title
LIMIT 8;
```

* The text can match **anywhere** in a title or artist: `glow` finds *Afterglow*.
* Titles that **start** with the text are listed first, because those are usually what the user is typing.
* `%`, `_` and `\` in the input are **escaped**, so typing `100%` looks for a literal `%` instead of matching everything.

**Step 2: Complexity.** A pattern with a leading `%` can't use the B-tree index, because the match can start at any position in the string. So SQLite scans the table: **O(n · L)** for n tracks with titles of length L. That's fine for a personal library. The exact search above is the O(log n) alternative.

**Step 3: Expose it.** `GET /search/autocomplete?q=glow&limit=8` returns a plain `List[TrackResponse]`. Blank input returns an empty list.

**Step 4: The UI.** The `Topbar` component:
* waits 150 ms after the last keystroke before calling the API (debounce), and cancels the previous request with `AbortController`
* shows a dropdown of matching tracks, navigable with ↑/↓, Enter and Esc
* when you pick a suggestion, runs an exact search on that title and opens the results in the library
* if no suggestion is highlighted, Enter runs an exact search on what was typed

---

### Feature 3: Filtering

**Goal:** filter by genre, BPM range and energy range.

**Step 1: Query parameters.** `TrackFilters` in [backend/schemas/browse.py](backend/schemas/browse.py) declares `genre`, `min_bpm`, `max_bpm`, `min_energy` and `max_energy`, with validation (e.g. energy must be 0–100, otherwise HTTP 422). FastAPI injects it into endpoints with `Depends()`.

**Step 2: Apply the filters in SQL.** `TrackRepository.apply_filters()` adds one `WHERE` clause per filter that was given. Filtering happens in the database, so only matching rows are loaded.

**Step 3: Handle the data quirk.** Energy is stored on two scales in existing data (`0.84` and `92.0`). The filter compares on a percentage scale using a SQL `CASE`:

```python
case((Track.energy <= 1, Track.energy * 100), else_=Track.energy)
```

**Step 4: Reuse the filters.** The same filters work for both `GET /tracks/` and `GET /search/exact`, so exact search results can be filtered too.

**Step 5: The UI.** The filter bar under the *My Library* header has a genre dropdown (built from the genres in your library), BPM min–max, Energy % min–max, and *Reset*.

---

### Feature 4: Sorting (MergeSort & QuickSort)

**Goal:** sort by duration, release year, tempo and more, with both algorithms implemented and benchmarked.

**Step 1: Add release year.** Tracks had no year, so a `release_year` column was added to the model and schemas. `apply_migrations()` adds the column to existing databases with `ALTER TABLE`, because `create_all()` only creates missing *tables*. It was also added to the Add and Edit forms and as a *Year* column in the table.

**Step 2: Sort keys.** `TRACK_SORT_KEYS` in [backend/services/sorting_algorithms.py](backend/services/sorting_algorithms.py) maps each sort option to a comparable value:
* `duration`: `"3:48"` is parsed to 228 seconds, because sorting the string would put `"10:00"` before `"9:00"`
* `energy`: normalised to a percentage
* `recent`: the track id

Tracks with no value for the chosen field are removed before sorting and appended at the end, so they always go last whichever direction you sort.

**Step 3: MergeSort (bottom-up).** First merge pairs of single elements, then runs of 2, 4, 8 and so on, alternating between two buffers.
* Always O(n log n): there are log₂ n passes, and each pass touches all n elements.
* **Stable:** on a tie, the merge takes the *left* element first, so equal tracks keep their order.
* O(n) extra space for the second buffer.

**Step 4: QuickSort (in place).**
* **Random pivot:** gives O(n log n) *expected* time, even on already-sorted input (which is the worst case for a "first element" pivot).
* **3-way (Dijkstra) partition:** splits the range into `< pivot | = pivot | > pivot`. Music data has many equal keys (lots of tracks at 120 BPM). A 2-way partition handles those badly, while 3-way finishes the equal block in one pass.
* **O(log n) stack:** always continue into the smaller partition and save the larger one for later.
* Not stable.

Both algorithms compute each key **once** at the start (decorate–sort–undecorate), so the cost of the key function doesn't distort the comparison.

**Step 5: Wire it up.** `TrackSort` takes `sort_by`, `order` (asc/desc) and `algorithm` (merge/quick). `TrackService.get_tracks()` **filters in SQL → sorts in Python → paginates**. Paginating last matters, because otherwise you would only sort one page. The algorithm used and its time are returned in the `X-Sort-Algorithm` and `X-Sort-Time-Ms` headers, so the response body keeps the same shape. They are listed in CORS `expose_headers` so the browser lets JavaScript read them.

**Step 6: The UI.** The previously non-functional *Sort by* dropdown now works, with a new ↑/↓ direction button and a **MergeSort | QuickSort** toggle. The footer shows e.g. *"Sorted by BPM with MergeSort in 0.013 ms"*. Any change to the controls makes the page fetch the list again after 200 ms.

**What the benchmark shows:** runtime ÷ (n·log₂ n) stays around 190–280 ns from 1,000 to 100,000 tracks, which is practical evidence of O(n log n). With all keys equal, QuickSort takes 32 ms against MergeSort's 212 ms, which is the 3-way partition at work.

---

### Feature 5: DJ Smart Shuffle (greedy graph traversal)

**Goal:** order tracks so each transition is as smooth as possible in BPM and energy.

**Step 1: Turn tracks into points.** `feature_points()` in [backend/services/shuffle_algorithms.py](backend/services/shuffle_algorithms.py) maps each track to a point in the unit square:
* x = BPM, min-max scaled across the selected tracks
* y = energy ÷ 100

Without scaling, a 30-BPM difference would outweigh any energy difference. Scaling makes both count equally.

**Step 2: The graph.** Every track is a node and every pair of tracks is joined by an edge (a complete graph). The edge weight is the Euclidean distance √(Δx² + Δy²).

**Step 3: Greedy nearest neighbour.** `greedy_flow()`:
```
current = start
while unvisited tracks remain:
    current = the unvisited track closest to current
    append it to the flow
```
* O(n²) time: n steps, each scanning the remaining tracks. O(n) space.
* **Greedy:** each step is locally optimal, but the total path isn't guaranteed to be the shortest. Finding the shortest is the travelling-salesman problem, which is NP-hard. Late in the flow the greedy choice can be forced into a big jump, because the nearby tracks are already used.

**Step 4: Score the flow.**
* **Match %** of a transition = `(1 − distance / √2) × 100`, where √2 is the largest possible distance in the unit square.
* **Harmony Score** = the average match over all transitions.
* **Random baseline** = the expected score of a *random* shuffle. It is calculated exactly as the average distance over all pairs, since any pair is equally likely to be adjacent in a random order.

**Step 5: The service.** `ShuffleService.smart_shuffle()` in [backend/services/shuffle_service.py](backend/services/shuffle_service.py) takes the whole library or one playlist, leaves out tracks with no BPM or energy (and reports how many), and picks the start track. A random start never repeats the previous one, so *Regenerate* always visibly changes the flow. Endpoint: `GET /shuffle/smart?playlist_id=&start_track_id=&previous_start_id=`.

**Step 6: The UI.** The existing DJ Smart Shuffle page was showing the first 6 tracks with made-up scores. Now:
* **Source** and **Start from** dropdowns, and a **Regenerate Flow** button
* each card shows its real `MATCH %` and the change from the previous track, e.g. `+4 BPM · +4% energy` (cyan if smooth, pink if a jump)
* the score panel shows the Harmony Score next to the random-shuffle baseline
* the card energy bar is fixed (it overflowed for energies stored as 0–100), and the page copy no longer mentions "harmonic key" analysis, since nothing analyses musical key

**What the benchmark shows:** greedy averages 93–99% match, against about 63% for random. Runtime ÷ n² stays at about 120 ns, confirming O(n²).

---

### Supporting changes

| Change | Why |
|---|---|
| `run.ps1` | One command for setup and running. It creates the venv and installs dependencies on the first run, reinstalls them only when `requirements.txt` or `package-lock.json` changes (tracked with a stored hash), seeds a missing database, and starts both servers. Ctrl+C stops both. |
| `.gitignore` | Stops tracking `node_modules` (~8,000 files), `__pycache__`, the SQLite database and IDE folders. They were removed from the index with `git rm --cached`; the files on disk were not deleted. |
| `apply_migrations()` | Brings older databases up to date at start-up (new column + indexes), and is safe to run repeatedly. |
| `seed.py` | Also runs migrations, and gives the sample tracks release years. |
| Benchmarks | `search_benchmark.py`, `sort_benchmark.py`, `shuffle_benchmark.py`. Each checks correctness before timing. |

---

## Part 2 — Splitting the project between 3 people

### Principle

Each person owns a **vertical slice** in every iteration: database/API → algorithm → UI → tests → their section of the report. The alternative is splitting by layer ("the frontend person", "the backend person"). Vertical slices are better here for two reasons:

* **Everyone implements and analyses an algorithm.** This is a computational-thinking project, so each person needs their own complexity analysis to present.
* **Fewer blocked handoffs.** No one waits for "the frontend person" before showing a feature working.

The roles below are named by their main theme across iterations:

| | **Person A: Tracks & Ordering** | **Person B: Playlists & Data** | **Person C: Discovery & Experience** |
|---|---|---|---|
| **Iteration 1: CRUD** | Track model + Track CRUD API + seeding | Playlist model, many-to-many link, Playlist CRUD API, CSV export | App shell, library table, track & playlist modals |
| **Iteration 2: Search/Sort/Filter** | MergeSort + QuickSort, sort controls, sort benchmark | SQL filters, energy normalisation, filter bar | B-tree exact search, autocomplete, search box, search benchmark |
| **Iteration 3: Smart Shuffle** | Greedy nearest-neighbour algorithm + benchmark | Shuffle API, ordered playlists, "save flow as playlist" | Smart Shuffle page, scoring display |
| **Cross-cutting** | `run.ps1`, README | Migrations, data quality | Shared UI components, report assembly |

---

### Iteration 1: CRUD

**Person A: Tracks**
* `models/track.py`, `schemas/track.py` (Pydantic create, update and response models)
* `repositories/track_repository.py`, `services/track_service.py`, `/tracks/` endpoints (GET list, GET one, POST, PUT, DELETE), with 404 handling
* `core/seed.py` (sample tracks) and `core/clear_db.py`
* *Done when:* every track endpoint can be exercised from `/docs`, and the seed script fills an empty database

**Person B: Playlists**
* `models/playlist.py`, including the `playlist_track` many-to-many link table with cascading deletes
* Playlist repository, service and endpoints: CRUD, plus `POST`/`DELETE /playlists/{id}/tracks/{track_id}`
* **CSV export** of the catalogue (`GET /tracks/export.csv`). The README asks for it and it **is not implemented yet**. Declare this route *before* `/tracks/{track_id}` in the router, or FastAPI will try to read `export.csv` as a track id and return 422.
* *Done when:* deleting a track removes it from every playlist, and the CSV opens correctly in Excel

**Person C: Frontend foundation**
* Vite + React + Tailwind setup, sidebar, top bar, Home view, Library table, Playlist view
* Add/Edit Track modals, Create Playlist modal, Add Tracks to Playlist modal
* *Done when:* every CRUD action can be done from the UI without opening `/docs`

**Integration point:** A and B agree on the `TrackResponse` and `PlaylistResponse` shapes on **day 1**. C builds against those shapes using mock data until the API is ready.

---

### Iteration 2: Searching, sorting and filtering

**Person A: Sorting**
* `services/sorting_algorithms.py`: bottom-up MergeSort (stable), and QuickSort with a random pivot, 3-way partition and O(log n) stack
* Sort keys, including parsing duration strings, plus `release_year` (column + migration + form fields)
* `TrackSort` parameters, sort-time headers, and the *Sort by* dropdown, ↑/↓ toggle and algorithm switch in the UI
* `benchmarks/sort_benchmark.py`: 10k+ tracks, ns per n·log n, and different input orders
* *Report:* best, average and worst cases, stability, and why the 3-way partition matters for music data

**Person B: Filtering**
* `TrackFilters` + `apply_filters()` (genre, BPM range, energy range), with validation of the bounds
* Energy-scale normalisation in SQL (`CASE` expression), since existing data mixes 0–1 and 0–100
* Filter bar UI: genre dropdown built from the library, BPM and energy ranges, *Reset*, and the "no tracks match" empty state
* *Report:* filtering in SQL vs in Python, which columns benefit from an index (`genre` is indexed), and handling inconsistent data

**Person C: Searching**
* Case-insensitive B-tree indexes (created in `apply_migrations()`) + `find_exact()` + `GET /search/exact`
* Autocomplete: `find_containing()` (escaped `LIKE` substring match, titles that start with the text first) + `GET /search/autocomplete`
* Search box with the suggestions dropdown (debounce, ↑/↓/Enter/Esc, Ctrl/⌘+K), the "Exact matches for …" view and *Clear search*
* `benchmarks/search_benchmark.py`: indexed lookup vs forced full scan, including `EXPLAIN QUERY PLAN` output
* *Report:* how a B-tree achieves O(log n), why the query's collation must match the index's, and why a `LIKE '%text%'` autocomplete can't use the index (O(n) scan)

**Integration points:**
* A and B both add query parameters to `GET /tracks/`. Agree on the parameter names first, and on the order: **filter (SQL) → sort (Python) → paginate**.
* C's `GET /search/exact` accepts A's sort parameters and B's filters, so exact-search results can be sorted and filtered too. Agree that it returns a plain `List[TrackResponse]` with the same sort headers.

---

### Iteration 3: DJ Smart Shuffle

The shuffle is one feature, so it is split along its natural seams. A owns the algorithm, B the data and API around it, and C the experience.

**Person A: The algorithm**
* `services/shuffle_algorithms.py`: feature scaling, distance, `greedy_flow`, match %, random-baseline calculation
* `benchmarks/shuffle_benchmark.py`: O(n²) evidence, greedy vs random, worst-case jump
* *Stretch goal:* a **2-opt** improvement pass that reverses segments of the path while that shortens it, compared with plain greedy
* *Report:* greedy vs optimal (link to the travelling-salesman problem), why both features are scaled, complexity

**Person B: Data & API**
* `services/shuffle_service.py` + `GET /shuffle/smart`: library or playlist as source, start-track selection, skipping incomplete tracks
* **Ordered playlists:** add a `position` column to `playlist_track`, with a migration, and return a playlist's tracks in that order. This **is not implemented yet**, and it's needed so a flow can be saved without losing its order.
* `POST /playlists/from-flow`, which saves a generated flow as a new ordered playlist
* *Report:* data-model change, migration strategy, and API design

**Person C: The experience**
* Smart Shuffle page: source and start-track dropdowns, Regenerate, cards showing match % and BPM/energy changes, Harmony Score panel with the random baseline
* *Save as playlist* button, using B's endpoint
* *Stretch goal:* a small chart of BPM and energy along the flow (two lines over track position), so the smoothness is visible
* *Report:* how the results are shown to users, and the user-facing explanation of the score

**Integration point:** A delivers `greedy_flow(points, start) -> order` with tests **before** B builds the service on it. B publishes the `SmartShuffleResponse` shape so C can build the page against mock JSON in parallel.

---

### Suggested timeline (adjust to your deadlines)

| Week | Everyone | Milestone |
|---|---|---|
| 1 | Agree on API shapes; A and B build models + CRUD; C builds the shell with mock data | Every CRUD action works end to end |
| 2 | Algorithms for Iteration 2 (A sorting, B filters, C exact search + autocomplete) | Algorithms pass correctness checks in the benchmarks |
| 3 | Iteration 2 UI + benchmarks | Search, sort and filter usable in the app; benchmark tables ready |
| 4 | Iteration 3 (A algorithm → B service → C page, with mocks so nobody waits) | Smart Shuffle working, saving a flow as a playlist |
| 5 | Report, cleanup, demo rehearsal | Each person presents their own algorithms |

### Ways of working

* **Branches:** one feature branch per person per iteration (e.g. `a/sorting`, `c/exact-search`), merged to `main` through a pull request that **one of the other two** reviews. This way everyone reads everyone else's algorithm code at least once.
* **Shared hotspots:** `api/router.py`, `frontend/src/Dashboard.tsx` and `index.css` are edited by everyone. Keep changes small and merge often. Splitting `Dashboard.tsx` into one file per view early on (`views/Library.tsx`, `views/SmartShuffle.tsx`, …) would remove most merge conflicts.
* **Definition of done** for any feature: works in the UI, the benchmark checks correctness, `npx tsc --noEmit` passes, `.\run.ps1` still works on a fresh clone, and the README *Implementation Status* section is updated.
* **The report:** each person writes the complexity analysis of the algorithms they own, and C puts the sections together into the final document.
