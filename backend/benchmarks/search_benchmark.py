"""Exact search benchmark on synthetic track libraries: SQLite B-tree index vs forced full table scan.

Run from the backend folder:
    python -m benchmarks.search_benchmark                # sizes 1k, 10k, 50k
    python -m benchmarks.search_benchmark 1000 100000    # custom sizes
"""
import random
import sqlite3
import sys
import time

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


def bench_exact(library, rng):
    conn = sqlite3.connect(":memory:")
    conn.execute("CREATE TABLE tracks (id INTEGER PRIMARY KEY, title TEXT, artist TEXT)")
    conn.executemany("INSERT INTO tracks VALUES (?, ?, ?)", library)
    conn.execute("CREATE INDEX ix_tracks_title_nocase ON tracks (title COLLATE NOCASE)")

    # Upper-cased on purpose: the lookup must be case-insensitive
    titles = [(rng.choice(library)[1].upper(),) for _ in range(QUERIES)]
    indexed_sql = "SELECT id FROM tracks WHERE title = ? COLLATE NOCASE"
    scan_sql = "SELECT id FROM tracks NOT INDEXED WHERE title = ? COLLATE NOCASE"

    for (title,) in titles[:20]:
        assert conn.execute(indexed_sql, (title,)).fetchall() == conn.execute(scan_sql, (title,)).fetchall()

    plans = [conn.execute("EXPLAIN QUERY PLAN " + sql, titles[0]).fetchone()[-1] for sql in (indexed_sql, scan_sql)]
    indexed_ms = elapsed_ms(lambda *a: conn.execute(indexed_sql, a).fetchall(), titles)
    scan_ms = elapsed_ms(lambda *a: conn.execute(scan_sql, a).fetchall(), titles)
    conn.close()
    return indexed_ms / QUERIES, scan_ms / QUERIES, plans


def main(sizes):
    rng = random.Random(42)
    print(f"Average time per exact-title lookup over {QUERIES} queries (ms)\n")
    print(f"{'tracks':>8} | {'indexed':>9} | {'full scan':>9} | {'speedup':>7}")
    print("-" * 44)

    plans = None
    for n in sizes:
        indexed_ms, scan_ms, plans = bench_exact(make_library(n, rng), rng)
        print(f"{n:>8} | {indexed_ms:>9.4f} | {scan_ms:>9.4f} | {scan_ms / indexed_ms:>6.1f}x")

    print(f"\nSQLite query plans:\n  indexed:   {plans[0]}\n  full scan: {plans[1]}")


if __name__ == "__main__":
    main([int(arg) for arg in sys.argv[1:]] or [1_000, 10_000, 50_000])
