"""QuickSort vs MergeSort on synthetic track libraries, with Python's built-in Timsort as a reference.

The "per nlogn" columns divide the runtime by n*log2(n). If an algorithm really is
O(n log n), that figure stays roughly constant as n grows by orders of magnitude.

Run from the backend folder:
    python -m benchmarks.sort_benchmark                    # sizes 1k, 10k, 50k, 100k
    python -m benchmarks.sort_benchmark 10000 200000       # custom sizes
"""
import math
import random
import sys
import time
from types import SimpleNamespace

from services.sorting_algorithms import merge_sort, quick_sort, duration_seconds

REPEATS = 3


def make_tracks(n, rng):
    return [SimpleNamespace(
        id=i,
        bpm=rng.randint(60, 180),
        duration=f"{rng.randint(1, 7)}:{rng.randint(0, 59):02d}",
        release_year=rng.randint(1960, 2026),
        energy=round(rng.random(), 2),
    ) for i in range(n)]


def best_ms(fn, items, key):
    best = math.inf
    for _ in range(REPEATS):
        start = time.perf_counter()
        fn(items, key)
        best = min(best, (time.perf_counter() - start) * 1000)
    return best


def check(items, key):
    expected = sorted(items, key=key)
    assert [key(t) for t in merge_sort(items, key)] == [key(t) for t in expected]
    assert [key(t) for t in quick_sort(items, key)] == [key(t) for t in expected]
    assert [t.id for t in merge_sort(items, key)] == [t.id for t in expected], "MergeSort must be stable"


def growth_table(sizes, rng):
    key = lambda t: duration_seconds(t.duration)
    print("Sorting by duration (random order), best of", REPEATS, "runs\n")
    print(f"{'tracks':>8} | {'MergeSort':>10} | {'QuickSort':>10} | {'Timsort':>9} || "
          f"{'Merge ns per nlogn':>20} | {'Quick ns per nlogn':>20}")
    print("-" * 94)
    for n in sizes:
        tracks = make_tracks(n, rng)
        check(tracks[:2000], key)
        merge_ms = best_ms(merge_sort, tracks, key)
        quick_ms = best_ms(quick_sort, tracks, key)
        builtin_ms = best_ms(lambda items, k: sorted(items, key=k), tracks, key)
        nlogn = n * math.log2(n)
        print(f"{n:>8} | {merge_ms:>8.1f}ms | {quick_ms:>8.1f}ms | {builtin_ms:>7.1f}ms || "
              f"{merge_ms * 1e6 / nlogn:>20.1f} | {quick_ms * 1e6 / nlogn:>20.1f}")


def input_order_table(n, rng):
    print(f"\nEffect of input order ({n} tracks, best of {REPEATS} runs)\n")
    print(f"{'input':>26} | {'MergeSort':>10} | {'QuickSort':>10}")
    print("-" * 54)
    year = lambda t: t.release_year
    bpm = lambda t: t.bpm
    tracks = make_tracks(n, rng)
    cases = [
        ("random, by year", tracks, year),
        ("already sorted, by year", sorted(tracks, key=year), year),
        ("reverse sorted, by year", sorted(tracks, key=year, reverse=True), year),
        ("121 distinct keys, by BPM", tracks, bpm),
        ("all keys equal", [SimpleNamespace(**{**vars(t), "bpm": 120}) for t in tracks], bpm),
    ]
    for label, items, key in cases:
        print(f"{label:>26} | {best_ms(merge_sort, items, key):>8.1f}ms | {best_ms(quick_sort, items, key):>8.1f}ms")


def main(sizes):
    rng = random.Random(42)
    growth_table(sizes, rng)
    input_order_table(min(max(sizes), 100_000), rng)


if __name__ == "__main__":
    main([int(arg) for arg in sys.argv[1:]] or [1_000, 10_000, 50_000, 100_000])
