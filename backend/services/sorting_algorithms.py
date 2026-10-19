import random
import time


def _precedes(descending):
    return (lambda a, b: a > b) if descending else (lambda a, b: a < b)


def merge_sort(items, key=lambda x: x, descending=False):
    """Bottom-up MergeSort. Returns a new list.

    Time:  O(n log n) in every case - log2(n) passes, each merging n elements.
    Space: O(n) for the merge buffer.
    Stable: equal keys keep their original order.
    """
    precedes = _precedes(descending)
    src = [(key(item), item) for item in items]
    n = len(src)
    dst = [None] * n

    width = 1
    while width < n:
        for lo in range(0, n, 2 * width):
            mid = min(lo + width, n)
            hi = min(lo + 2 * width, n)
            i, j, k = lo, mid, lo
            while i < mid and j < hi:
                # Take from the right run only if strictly before - ties favour the left (stability)
                if precedes(src[j][0], src[i][0]):
                    dst[k] = src[j]
                    j += 1
                else:
                    dst[k] = src[i]
                    i += 1
                k += 1
            dst[k:hi] = src[i:mid] if i < mid else src[j:hi]
        src, dst = dst, src
        width *= 2

    return [item for _, item in src]


def quick_sort(items, key=lambda x: x, descending=False, rng=None):
    """In-place QuickSort with a random pivot and 3-way (Dijkstra) partitioning. Returns a new list.

    Time:  O(n log n) expected; O(n^2) worst case, made vanishingly unlikely by the random pivot.
           3-way partitioning keeps runs of equal keys (e.g. many tracks at 120 BPM) linear.
    Space: O(log n) - always continue into the smaller partition and defer the larger one.
    Not stable.
    """
    precedes = _precedes(descending)
    rng = rng or random.Random()
    a = [(key(item), item) for item in items]

    stack = [(0, len(a) - 1)]
    while stack:
        lo, hi = stack.pop()
        while lo < hi:
            pivot = a[rng.randint(lo, hi)][0]
            lt, i, gt = lo, lo, hi
            while i <= gt:
                k = a[i][0]
                if precedes(k, pivot):
                    a[lt], a[i] = a[i], a[lt]
                    lt += 1
                    i += 1
                elif precedes(pivot, k):
                    a[i], a[gt] = a[gt], a[i]
                    gt -= 1
                else:
                    i += 1
            # Now a[lo:lt] < pivot, a[lt:gt+1] == pivot, a[gt+1:hi+1] > pivot
            if lt - lo < hi - gt:
                stack.append((gt + 1, hi))
                hi = lt - 1
            else:
                stack.append((lo, lt - 1))
                lo = gt + 1

    return [item for _, item in a]


SORT_ALGORITHMS = {"merge": merge_sort, "quick": quick_sort}
ALGORITHM_NAMES = {"merge": "MergeSort", "quick": "QuickSort"}


def duration_seconds(duration):
    """'3:48' -> 228, '1:02:03' -> 3723; None for missing or malformed values."""
    if not duration:
        return None
    try:
        seconds = 0
        for part in duration.strip().split(":"):
            seconds = seconds * 60 + int(part)
        return seconds
    except ValueError:
        return None


def energy_percent(energy):
    # Energy is stored both as 0-1 and as 0-100; compare everything on the 0-100 scale
    if energy is None:
        return None
    return energy * 100 if energy <= 1 else energy


TRACK_SORT_KEYS = {
    "recent": lambda t: t.id,
    "title": lambda t: (t.title or "").lower(),
    "duration": lambda t: duration_seconds(t.duration),
    "release_year": lambda t: t.release_year,
    "bpm": lambda t: t.bpm,
    "energy": lambda t: energy_percent(t.energy),
}


def sort_tracks(tracks, sort_by, descending, algorithm):
    """Sorts tracks with the chosen algorithm; tracks missing the sort value go last.

    Returns (sorted_tracks, elapsed_ms).
    """
    key = TRACK_SORT_KEYS[sort_by]
    keyed = [t for t in tracks if key(t) is not None]
    missing = [t for t in tracks if key(t) is None]

    start = time.perf_counter()
    ordered = SORT_ALGORITHMS[algorithm](keyed, key, descending)
    elapsed_ms = (time.perf_counter() - start) * 1000
    return ordered + missing, elapsed_ms
