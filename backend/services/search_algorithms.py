import re

_WORD_RE = re.compile(r"\w+")


def tokenize(*fields):
    """Lower-cased keys a track can be found by: each whole field plus every word inside it.

    "Velvet Skies" -> {"velvet skies", "velvet", "skies"}, so typing "sk" still suggests it.
    """
    tokens = set()
    for field in fields:
        if not field:
            continue
        text = field.strip().lower()
        if text:
            tokens.add(text)
            tokens.update(_WORD_RE.findall(text))
    return tokens


class _TrieNode:
    __slots__ = ("children", "ids")

    def __init__(self):
        self.children = {}
        self.ids = set()  # IDs of items having a token that ends at this node


class Trie:
    """Prefix tree mapping tokens to the IDs of the items that contain them.

    insert / remove:  O(m)      for a token of length m
    starts_with:      O(p + s)  for a prefix of length p whose subtree has s nodes;
                                independent of the total number of items N
    """

    def __init__(self):
        self.root = _TrieNode()

    def insert(self, token, item_id):
        node = self.root
        for ch in token:
            node = node.children.setdefault(ch, _TrieNode())
        node.ids.add(item_id)

    def remove(self, token, item_id):
        path = [self.root]
        for ch in token:
            node = path[-1].children.get(ch)
            if node is None:
                return
            path.append(node)
        path[-1].ids.discard(item_id)

        # Prune nodes that no longer lead to any token
        for depth in range(len(token), 0, -1):
            node = path[depth]
            if node.ids or node.children:
                break
            del path[depth - 1].children[token[depth - 1]]

    def starts_with(self, prefix):
        node = self.root
        for ch in prefix:
            node = node.children.get(ch)
            if node is None:
                return set()

        found = set()
        stack = [node]
        while stack:
            current = stack.pop()
            found |= current.ids
            stack.extend(current.children.values())
        return found


def linear_prefix_search(entries, prefix):
    """Brute-force baseline: checks every token of every item - O(N * T * p).

    `entries` is an iterable of (item_id, tokens) pairs built with `tokenize`,
    so it returns exactly the same IDs as Trie.starts_with.
    """
    found = set()
    for item_id, tokens in entries:
        for token in tokens:
            if token.startswith(prefix):
                found.add(item_id)
                break
    return found
