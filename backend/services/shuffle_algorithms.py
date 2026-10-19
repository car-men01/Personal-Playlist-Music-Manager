import math

# Largest possible distance between two points in the unit square, used to turn a distance into a match %
_MAX_DISTANCE = math.sqrt(2)


def feature_points(bpms, energies):
    """Maps tracks into a 2-D unit square so BPM and energy carry equal weight.

    BPM is min-max scaled over the given tracks; energy (a 0-100 percentage) is divided by 100.
    """
    lo, hi = min(bpms), max(bpms)
    span = (hi - lo) or 1
    return [((bpm - lo) / span, energy / 100) for bpm, energy in zip(bpms, energies)]


def distance(a, b):
    """Euclidean distance between two feature points - the weight of the graph edge between two songs."""
    return math.dist(a, b)


def match_percent(d):
    return max(0.0, 1 - d / _MAX_DISTANCE) * 100


def greedy_flow(points, start):
    """Nearest-neighbour traversal of the complete graph whose nodes are tracks.

    From the current track, always move to the closest track not yet played.
    Time:  O(n^2) - n steps, each scanning the remaining unvisited tracks.
    Space: O(n).
    Greedy, so not guaranteed to give the shortest total path (that is the NP-hard
    travelling-salesman problem), but every single step is the smoothest one available.
    """
    unvisited = set(range(len(points))) - {start}
    order = [start]
    current = start
    while unvisited:
        # min over (distance, index) so ties resolve deterministically
        _, current = min((distance(points[current], points[i]), i) for i in unvisited)
        unvisited.remove(current)
        order.append(current)
    return order


def mean_pairwise_distance(points):
    """Average distance over all pairs - the expected distance of one transition in a random shuffle."""
    n = len(points)
    if n < 2:
        return 0.0
    total = sum(distance(points[i], points[j]) for i in range(n) for j in range(i + 1, n))
    return total / (n * (n - 1) / 2)
