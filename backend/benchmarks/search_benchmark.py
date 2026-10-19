"""Search benchmarks on synthetic track libraries.

1. Prefix search: Trie vs brute-force linear scan (same tokens, same results).
2. Exact search:  SQLite B-tree index vs forced full table scan.

Run from the backend folder:
    python -m benchmarks.search_benchmark                # sizes 1k, 10k, 50k
    python -m benchmarks.search_benchmark 1000 100000    # custom sizes
"""
import random
import sqlite3
import sys
import time

from services.search_algorithms import Trie, tokenize, linear_prefix_search

SYLLABLES = ["ka", "lo", "mi", "ra", "ve", "su", "na", "tor", "el", "di", "zan", "qu",
             "fy", "bel", "ni", "sa", "ro", "lux", "ten", "op", "ar", "is", "um", "ky"]
QUERIES = 300


def make_word(rng):
    return "".join(rng.choice(SYLLABLES) for _ in range(rng.randint(2, 3))).capitalize()


def make_library(n, rng):
    artists = [f"{make_word(rng)} {make_word(rng)}" for _ in range(max(10, n // 20))]
    return [(i, " ".join(make_word(rng) for _ in range(rng.randint(1, 3))), rng.choice(artists))
            for i in range(n)]


def elapsed_ms(fn, args_list):
    start = time.perf_counter()
    for args in args_list:
        fn(*args)
    return (time.perf_counter() - start) * 1000


def bench_prefix(library, rng):
    entries = [(i, tokenize(title, artist)) for i, title, artist in library]

    start = time.perf_counter()
    trie = Trie()
    for i, tokens in entries:
        for token in tokens:
            trie.insert(token, i)
    build_ms = (time.perf_counter() - start) * 1000

    # Prefixes of 1-4 characters taken from real tokens, like a user typing
    prefixes = []
    for _ in range(QUERIES):
        token = rng.choice(sorted(rng.choice(entries)[1]))
        prefixes.append(token[:rng.randint(1, min(4, len(token)))])

    for p in prefixes[:20]:
        assert trie.starts_with(p) == linear_prefix_search(entries, p), p

    trie_ms = elapsed_ms(trie.starts_with, [(p,) for p in prefixes])
    linear_ms = elapsed_ms(linear_prefix_search, [(entries, p) for p in prefixes])

    # Trie cost is O(p + matches) while linear stays O(N): short prefixes match a large
    # share of the library, so the gap widens as the user types more characters.
    by_length = {}
    for length in range(1, 5):
        group = [p for p in prefixes if len(p) == length]
        if group:
            matches = sum(len(trie.starts_with(p)) for p in group) / len(group)
            by_length[length] = (matches,
                                 elapsed_ms(trie.starts_with, [(p,) for p in group]) / len(group),
                                 elapsed_ms(linear_prefix_search, [(entries, p) for p in group]) / len(group))
    return build_ms, trie_ms / QUERIES, linear_ms / QUERIES, by_length


def bench_exact(library, rng):
    conn = sqlite3.connect(":memory:")
    conn.execute("CREATE TABLE tracks (id INTEGER PRIMARY KEY, title TEXT, artist TEXT)")
    conn.executemany("INSERT INTO tracks VALUES (?, ?, ?)", library)
    conn.execute("CREATE INDEX ix_tracks_title_nocase ON tracks (title COLLATE NOCASE)")

    titles = [(rng.choice(library)[1].upper(),) for _ in range(QUERIES)]
    indexed_sql = "SELECT id FROM tracks WHERE title = ? COLLATE NOCASE"
    scan_sql = "SELECT id FROM tracks NOT INDEXED WHERE title = ? COLLATE NOCASE"

    plans = [conn.execute("EXPLAIN QUERY PLAN " + sql, titles[0]).fetchone()[-1] for sql in (indexed_sql, scan_sql)]
    indexed_ms = elapsed_ms(lambda *a: conn.execute(indexed_sql, a).fetchall(), titles)
    scan_ms = elapsed_ms(lambda *a: conn.execute(scan_sql, a).fetchall(), titles)
    conn.close()
    return indexed_ms / QUERIES, scan_ms / QUERIES, plans


def main(sizes):
    rng = random.Random(42)
    print(f"Average time per query over {QUERIES} queries (ms)\n")
    print(f"{'tracks':>8} | {'trie build':>10} | {'trie':>9} | {'linear':>9} | {'speedup':>7} || "
          f"{'indexed':>9} | {'full scan':>9} | {'speedup':>7}")
    print("-" * 94)

    plans = by_length = None
    for n in sizes:
        library = make_library(n, rng)
        build_ms, trie_ms, linear_ms, by_length = bench_prefix(library, rng)
        indexed_ms, scan_ms, plans = bench_exact(library, rng)
        print(f"{n:>8} | {build_ms:>10.1f} | {trie_ms:>9.4f} | {linear_ms:>9.4f} | {linear_ms / trie_ms:>6.1f}x || "
              f"{indexed_ms:>9.4f} | {scan_ms:>9.4f} | {scan_ms / indexed_ms:>6.1f}x")

    print(f"\nPrefix search by prefix length ({sizes[-1]} tracks):\n")
    print(f"{'length':>6} | {'avg matches':>11} | {'trie':>9} | {'linear':>9} | {'speedup':>7}")
    print("-" * 54)
    for length, (matches, trie_ms, linear_ms) in by_length.items():
        print(f"{length:>6} | {matches:>11.0f} | {trie_ms:>9.4f} | {linear_ms:>9.4f} | {linear_ms / trie_ms:>6.1f}x")

    print(f"\nSQLite query plans:\n  indexed:   {plans[0]}\n  full scan: {plans[1]}")


if __name__ == "__main__":
    main([int(arg) for arg in sys.argv[1:]] or [1_000, 10_000, 50_000])
