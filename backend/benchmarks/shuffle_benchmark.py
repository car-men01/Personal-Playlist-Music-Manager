"""DJ Smart Shuffle: greedy nearest-neighbour flow vs a random shuffle.

Shows (1) how much smoother greedy transitions are, and (2) that runtime grows as O(n^2):
the "ns per n^2" column stays roughly constant as n grows.

Run from the backend folder:
    python -m benchmarks.shuffle_benchmark                  # sizes 100, 500, 1k, 2k, 4k
    python -m benchmarks.shuffle_benchmark 250 1000 8000    # custom sizes
"""
import random
import sys
import time

from services.shuffle_algorithms import feature_points, distance, match_percent, greedy_flow


def average_match(points, order):
    return sum(match_percent(distance(points[a], points[b])) for a, b in zip(order, order[1:])) / (len(order) - 1)


def worst_match(points, order):
    return min(match_percent(distance(points[a], points[b])) for a, b in zip(order, order[1:]))


def main(sizes):
    rng = random.Random(42)
    print(f"{'tracks':>7} | {'greedy time':>11} | {'ns per n^2':>10} || {'greedy avg':>10} | {'random avg':>10} "
          f"|| {'greedy worst':>12} | {'random worst':>12}")
    print("-" * 98)
    for n in sizes:
        points = feature_points([rng.randint(60, 180) for _ in range(n)], [rng.uniform(0, 100) for _ in range(n)])

        start = time.perf_counter()
        greedy = greedy_flow(points, 0)
        elapsed_ms = (time.perf_counter() - start) * 1000

        shuffled = list(range(n))
        rng.shuffle(shuffled)

        print(f"{n:>7} | {elapsed_ms:>9.1f}ms | {elapsed_ms * 1e6 / n ** 2:>10.1f} || "
              f"{average_match(points, greedy):>9.1f}% | {average_match(points, shuffled):>9.1f}% || "
              f"{worst_match(points, greedy):>11.1f}% | {worst_match(points, shuffled):>11.1f}%")

    print("\nMatch % = 1 - distance / sqrt(2) in the normalised BPM/energy unit square.")
    print("Greedy's worst step is still a real jump: once nearby tracks are used up, only distant ones remain.")


if __name__ == "__main__":
    main([int(arg) for arg in sys.argv[1:]] or [100, 500, 1_000, 2_000, 4_000])
