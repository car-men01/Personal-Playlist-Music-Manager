# Sonora: Personal Music Playlist Manager
**Computational Thinking Masters Project**

## 1. Project Overview
The "Personal Music Playlist Manager" (code-named *Sonora*) is a full-stack web application designed to manage a local music library, organize playlists, and discover relationships between tracks. This project emphasizes **computational thinking** by requiring the implementation and analysis of specific algorithms and data structures for searching, sorting, and recommendation systems.

### Frontend Figma Mockup 
![alt text](<Screenshot 2026-10-16 144122.png>)

---

## 2. Technology Stack
To ensure rapid development and seamless integration, the project will utilize the following stack:

*   **Backend:** **Python FastAPI**
    *   *Why:* Extremely fast, highly intuitive, and provides automatic interactive API documentation (Swagger UI). Excellent for implementing and exposing complex Python algorithms.
*   **Database:** **SQLite via SQLAlchemy (ORM)**
    *   *Why:* SQLite requires zero configuration and lives in a single file, making it the easiest database to set up. SQLAlchemy integrates perfectly with FastAPI (especially when paired with Pydantic for validation) and abstracts the SQL logic cleanly.
*   **Frontend:** **HTML/JS + Tailwind CSS**
    *   *Why:* Tailwind CSS allows for rapid, utility-first styling directly in HTML, making it easy to replicate the sleek, dark-mode aesthetic of the provided UI mockup without writing complex custom CSS.

---

## 3. Core Requirements (Iterations 1 & 2)

### Iteration 1: CRUD Operations (Data Management)
The foundational data layer. Tracks will be modeled with attributes such as `title`, `artist`, `duration`, `genre`, `energy_score`, and `tempo_bpm`.
*   **Create:** Add a new track with all relevant metadata.
*   **Read:** Display a list of all songs, view detailed metadata for a specific song, or export the catalog to a CSV file.
*   **Update:** Edit tags (e.g., fix a misspelled artist name, adjust energy score, or update play counts).
*   **Delete:** Remove tracks from a specific playlist or drop a song entirely from the primary library.

### Iteration 2: Searching, Sorting, and Filtering (Algorithmic Focus)
This iteration introduces computational complexity analysis.
*   **Searching:**
    *   *Exact Search:* $O(1)$ or $O(\log n)$ retrieval using database indexing by artist or title.
    *   *Fuzzy/Prefix Search:* Implement an auto-complete feature as the user types. *Computational requirement:* Implement a **Trie (Prefix Tree)** data structure or optimized substring matching, comparing its efficiency to a brute-force linear search.
*   **Sorting & Filtering:**
    *   Filter tracks by genre, BPM range, or energy level.
    *   Sort songs by duration, release year, or tempo.
    *   *Computational requirement:* Implement both **QuickSort** and **MergeSort**. Perform a runtime comparison benchmark by sorting a generated dataset of 10,000+ tracks to demonstrate Big $O(n \log n)$ performance characteristics in the real world.

---

## 4. Iteration 3: Advanced Feature (Recommendations & Graphs)
As a master's level project, the final iteration requires a complex feature utilizing advanced data structures, machine learning concepts, or graph theory. 

**Below are several suggestions; you only need to pick ONE to implement:**

### Option A: "DJ Smart Shuffle" (Greedy Graph Traversal)
Create a playlist that transitions smoothly between tracks.
*   **Concept:** Treat each song as a node in a graph. The edges are the "distance" between songs based on BPM and Energy.
*   **Algorithm:** Use a Nearest-Neighbor or Greedy algorithm to find the next song that has the closest BPM and Energy score to the current song, preventing jarring transitions.

### Option B: Simple Recommendation Engine (Euclidean Distance)
"Find 5 songs most similar to my favorite track."
*   **Concept:** Map songs into a multi-dimensional vector space using audio features (e.g., $x=$ tempo, $y=$ energy, $z=$ danceability).
*   **Algorithm:** Calculate the **Euclidean distance** $d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2 + (z_2 - z_1)^2}$ between the target track and all other tracks. Return the $k$ tracks with the smallest distance.

### Option C: K-Means Clustering for "Mood" Playlists
Automatically group the user's library into distinct "moods".
*   **Concept:** Group unlabelled tracks based on their tempo and energy.
*   **Algorithm:** Implement a basic **K-Means Clustering** algorithm from scratch. Plot the library into $K$ clusters (e.g., $K=4$ for Chill, Upbeat, Aggressive, Melancholy) and generate distinct playlists from these clusters.

### Option D: "Six Degrees of Separation" Artist Graph
*   **Concept:** Model the database to track featured artists or overlapping genres.
*   **Algorithm:** Implement **Breadth-First Search (BFS)** or **Dijkstra's Algorithm** to find the shortest path between two vastly different artists in the user's library (e.g., finding a path from a Classical composer to a Heavy Metal band through shared genres or compilation albums).

---

## 5. Development Roadmap

1.  **Setup:** Initialize FastAPI project. Create `models.py` (SQLAlchemy schemas) and `schemas.py` (Pydantic models).
2.  **Database:** Configure `sqlite:///./musicapp.db`. Write a script to seed the database with 100+ dummy songs (using a library like `Faker`).
3.  **API Endpoints:** Build out the `/tracks` POST, GET, PUT, DELETE endpoints.
4.  **Frontend Integration:** Serve a static `index.html` styled with Tailwind via FastAPI. Use vanilla JavaScript `fetch()` calls to populate the UI table from the backend API.
5.  **Algorithmic Implementation:** Build out the Search/Sort logic and the chosen Advanced Feature (Iteration 3) in a dedicated `services.py` module to keep the API routes clean.
6.  **Documentation:** Write a brief report analyzing the time and space complexity of the algorithms used.