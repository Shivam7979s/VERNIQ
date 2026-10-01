"""
VERNIQ Problem Catalog Taxonomy Engine
=====================================
Hierarchical taxonomy, domain classification, and normalization rules
for all 189 distinct topic labels in the Verniq Problem Catalog.

Standards:
- Domain -> Topic -> Subtopic / Algorithm / Pattern
- Never over-normalize; raw source labels are strictly preserved in `source_topic`.
- Explicit role assignments: PRIMARY, SECONDARY, ALGORITHM, PATTERN.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

DOMAINS: Dict[str, Dict[str, Any]] = {
    "DSA": {
        "name": "DSA",
        "slug": "dsa",
        "description": "Data Structures & Algorithms: core computational complexity, discrete math, and invariants.",
        "order_index": 1,
    },
    "DATABASE": {
        "name": "Database",
        "slug": "database",
        "description": "Relational Databases: SQL queries, aggregation, joins, subqueries, and window functions.",
        "order_index": 2,
    },
    "JAVASCRIPT": {
        "name": "JavaScript",
        "slug": "javascript",
        "description": "Modern ECMAScript: event loop, promises, closures, prototypes, and asynchronous execution.",
        "order_index": 3,
    },
    "PANDAS": {
        "name": "Pandas",
        "slug": "pandas",
        "description": "Data Science & Analysis: DataFrame operations, reshaping, indexing, and tabular filtering.",
        "order_index": 4,
    },
    "SHELL": {
        "name": "Shell",
        "slug": "shell",
        "description": "Unix & Bash: stream processing, sed/awk, pipelines, and operating system utilities.",
        "order_index": 5,
    },
    "CONCURRENCY": {
        "name": "Concurrency",
        "slug": "concurrency",
        "description": "Multithreading & Synchronization: mutexes, semaphores, barriers, and atomic primitives.",
        "order_index": 6,
    },
    "DESIGN": {
        "name": "Design",
        "slug": "design",
        "description": "System & Object-Oriented Design: architectural patterns, in-memory caches, and interfaces.",
        "order_index": 7,
    },
    "OTHER": {
        "name": "Other",
        "slug": "other",
        "description": "Unclassified or multidisciplinary engineering interview questions.",
        "order_index": 8,
    },
}

# Mapping: raw_source_topic -> (verniq_name, slug, domain, parent_topic, default_role, rule, confidence)
TOPIC_TAXONOMY_MAP: Dict[str, Tuple[str, str, str, Optional[str], str, str, str]] = {
    # Core Data Structures
    "Array": ("Arrays", "arrays", "DSA", None, "primary", "Pluralize core container", "HIGH"),
    "String": ("Strings", "strings", "DSA", None, "primary", "Pluralize core sequence", "HIGH"),
    "Hash Table": ("Hash Table", "hash-table", "DSA", None, "primary", "Preserve standard associative container", "HIGH"),
    "Linked List": ("Linked List", "linked-list", "DSA", None, "primary", "Preserve fundamental linear structure", "HIGH"),
    "Doubly-Linked List": ("Doubly-Linked List", "doubly-linked-list", "DSA", "Linked List", "secondary", "Subtopic of Linked List", "HIGH"),
    "Stack": ("Stack", "stack", "DSA", None, "primary", "Preserve LIFO structure", "HIGH"),
    "Monotonic Stack": ("Monotonic Stack", "monotonic-stack", "DSA", "Stack", "pattern", "Algorithm pattern specializing Stack", "HIGH"),
    "Bracket Sequences": ("Bracket Sequences", "bracket-sequences", "DSA", "Stack", "pattern", "Stack-based balanced delimiter validation", "HIGH"),
    "Queue": ("Queue", "queue", "DSA", None, "primary", "Preserve FIFO structure", "HIGH"),
    "Monotonic Queue": ("Monotonic Queue", "monotonic-queue", "DSA", "Queue", "pattern", "Sliding window optimization queue", "HIGH"),
    "Heap (Priority Queue)": ("Heap (Priority Queue)", "heap-priority-queue", "DSA", None, "primary", "Preserve priority queue container", "HIGH"),
    "Matrix": ("Matrix", "matrix", "DSA", "Arrays", "secondary", "2D grid specialization of Arrays", "HIGH"),
    "Simulation": ("Simulation", "simulation", "DSA", None, "algorithm", "Deterministic step-by-step state emulation", "HIGH"),
    "Counting": ("Counting", "counting", "DSA", None, "algorithm", "Frequency mapping and bucket accounting", "HIGH"),
    "Enumeration": ("Enumeration", "enumeration", "DSA", None, "algorithm", "Exhaustive candidate iteration", "HIGH"),

    # Trees
    "Tree": ("Tree", "tree", "DSA", None, "primary", "General hierarchical tree structure", "HIGH"),
    "Binary Tree": ("Binary Tree", "binary-tree", "DSA", "Tree", "primary", "Two-child tree specialization", "HIGH"),
    "Binary Search Tree": ("Binary Search Tree", "binary-search-tree", "DSA", "Binary Tree", "secondary", "Ordered key binary search invariant", "HIGH"),
    "Trie": ("Trie", "trie", "DSA", "Tree", "secondary", "Prefix tree data structure", "HIGH"),
    "Segment Tree": ("Segment Tree", "segment-tree", "DSA", "Tree", "algorithm", "Range query & point update tree", "HIGH"),
    "Binary Indexed Tree": ("Binary Indexed Tree", "binary-indexed-tree", "DSA", "Tree", "algorithm", "Fenwick tree prefix sum structure", "HIGH"),
    "Treap": ("Treap", "treap", "DSA", "Tree", "algorithm", "Randomized BST + Heap hybrid", "HIGH"),
    "Cartesian Tree": ("Cartesian Tree", "cartesian-tree", "DSA", "Tree", "algorithm", "Inorder heap tree representation", "HIGH"),
    "Splay Tree": ("Splay Tree", "splay-tree", "DSA", "Tree", "algorithm", "Self-adjusting binary search tree", "HIGH"),
    "K-D Tree": ("K-D Tree", "k-d-tree", "DSA", "Tree", "algorithm", "Multidimensional space partitioning tree", "HIGH"),
    "Lowest Common Ancestor": ("Lowest Common Ancestor", "lowest-common-ancestor", "DSA", "Tree", "algorithm", "Tree ancestor queries", "HIGH"),
    "Binary Lifting": ("Binary Lifting", "binary-lifting", "DSA", "Tree", "algorithm", "Power-of-two jump pointer technique", "HIGH"),

    # Two Pointers & Windows
    "Two Pointers": ("Two Pointers", "two-pointers", "DSA", None, "pattern", "Index convergence or chasing technique", "HIGH"),
    "Sliding Window": ("Sliding Window", "sliding-window", "DSA", "Two Pointers", "pattern", "Subsegment window invariant pattern", "HIGH"),
    "Prefix Sum": ("Prefix Sum", "prefix-sum", "DSA", "Arrays", "pattern", "Cumulative range sum lookup pattern", "HIGH"),

    # Search & Divide & Conquer
    "Binary Search": ("Binary Search", "binary-search", "DSA", None, "algorithm", "Logarithmic monotonic search", "HIGH"),
    "Ternary Search": ("Ternary Search", "ternary-search", "DSA", "Binary Search", "algorithm", "Unimodal function extremum search", "HIGH"),
    "Divide and Conquer": ("Divide and Conquer", "divide-and-conquer", "DSA", None, "pattern", "Subproblem decomposition and merging", "HIGH"),
    "Quickselect": ("Quickselect", "quickselect", "DSA", "Divide and Conquer", "algorithm", "Linear-time k-th order statistic selection", "HIGH"),
    "Meet in the Middle": ("Meet in the Middle", "meet-in-the-middle", "DSA", "Divide and Conquer", "pattern", "Bidirectional search space reduction", "HIGH"),

    # Sorting
    "Sorting": ("Sorting", "sorting", "DSA", None, "primary", "Ordering algorithms and comparator techniques", "HIGH"),
    "Sort": ("Sorting", "sorting", "DSA", None, "primary", "Alias for Sorting", "HIGH"),
    "Quicksort": ("Quicksort", "quicksort", "DSA", "Sorting", "algorithm", "Partition-exchange sorting", "HIGH"),
    "Merge Sort": ("Merge Sort", "merge-sort", "DSA", "Sorting", "algorithm", "Divide-and-conquer stable sorting", "HIGH"),
    "Counting Sort": ("Counting Sort", "counting-sort", "DSA", "Sorting", "algorithm", "Non-comparison integer sorting", "HIGH"),
    "Radix Sort": ("Radix Sort", "radix-sort", "DSA", "Sorting", "algorithm", "Positional digit distribution sort", "HIGH"),
    "Bucket Sort": ("Bucket Sort", "bucket-sort", "DSA", "Sorting", "algorithm", "Uniform interval distribution sort", "HIGH"),
    "Bubble Sort": ("Bubble Sort", "bubble-sort", "DSA", "Sorting", "algorithm", "Adjacent swap elementary sort", "HIGH"),
    "Tournament Sort": ("Tournament Sort", "tournament-sort", "DSA", "Sorting", "algorithm", "Tree-based selection sorting", "HIGH"),
    "Timsort": ("Timsort", "timsort", "DSA", "Sorting", "algorithm", "Hybrid merge and insertion sort", "HIGH"),

    # Dynamic Programming
    "Dynamic Programming": ("Dynamic Programming", "dynamic-programming", "DSA", None, "primary", "Optimal substructure & overlapping subproblems", "HIGH"),
    "Memoization": ("Memoization", "memoization", "DSA", "Dynamic Programming", "pattern", "Top-down cache recurrence pattern", "HIGH"),
    "DP on Trees": ("DP on Trees", "dp-on-trees", "DSA", "Dynamic Programming", "algorithm", "Subtree state transitions", "HIGH"),
    "Bitmask": ("Bitmask", "bitmask", "DSA", "Dynamic Programming", "pattern", "Subset state compression DP", "HIGH"),
    "Knapsack Problem": ("Knapsack Problem", "knapsack-problem", "DSA", "Dynamic Programming", "pattern", "Bounded value capacity optimization", "HIGH"),
    "0-1 Knapsack": ("0-1 Knapsack", "0-1-knapsack", "DSA", "Knapsack Problem", "pattern", "Binary inclusion knapsack", "HIGH"),
    "Complete Knapsack": ("Complete Knapsack", "complete-knapsack", "DSA", "Knapsack Problem", "pattern", "Unbounded quantity knapsack", "HIGH"),
    "Multiple Knapsack": ("Multiple Knapsack", "multiple-knapsack", "DSA", "Knapsack Problem", "pattern", "Bounded count knapsack", "HIGH"),
    "Mixed Knapsack": ("Mixed Knapsack", "mixed-knapsack", "DSA", "Knapsack Problem", "pattern", "Heterogeneous item knapsack", "HIGH"),
    "Longest Increasing Subsequence": ("Longest Increasing Subsequence", "longest-increasing-subsequence", "DSA", "Dynamic Programming", "pattern", "Monotonic subsequence DP / Patience sorting", "HIGH"),
    "Longest Common Subsequence": ("Longest Common Subsequence", "longest-common-subsequence", "DSA", "Dynamic Programming", "pattern", "Two-sequence alignment DP", "HIGH"),
    "Subsequence": ("Subsequence", "subsequence", "DSA", "Dynamic Programming", "pattern", "General subsequence properties", "HIGH"),

    # Greedy & Backtracking
    "Greedy": ("Greedy", "greedy", "DSA", None, "pattern", "Locally optimal choice heuristics", "HIGH"),
    "Backtracking": ("Backtracking", "backtracking", "DSA", None, "pattern", "Constraint satisfaction state search", "HIGH"),
    "Recursion": ("Recursion", "recursion", "DSA", None, "pattern", "Self-referential function invocation", "HIGH"),

    # Graph Theory
    "Graph Theory": ("Graph Theory", "graph-theory", "DSA", None, "primary", "Vertices, edges, networks and topologies", "HIGH"),
    "Graph": ("Graph Theory", "graph-theory", "DSA", None, "primary", "Alias for Graph Theory", "HIGH"),
    "Depth-First Search": ("Depth-First Search", "depth-first-search", "DSA", "Graph Theory", "algorithm", "Exhaustive branch traversal", "HIGH"),
    "Breadth-First Search": ("Breadth-First Search", "breadth-first-search", "DSA", "Graph Theory", "algorithm", "Level-order shortest path traversal", "HIGH"),
    "Bidirectional Search": ("Bidirectional Search", "bidirectional-search", "DSA", "Breadth-First Search", "algorithm", "Simultaneous source and target traversal", "HIGH"),
    "0-1 BFS": ("0-1 BFS", "0-1-bfs", "DSA", "Breadth-First Search", "algorithm", "Deque-based 0/1 weight shortest path", "HIGH"),
    "A* Search": ("A* Search", "a-star-search", "DSA", "Graph Theory", "algorithm", "Heuristic guided graph search", "HIGH"),
    "Heuristic Search": ("Heuristic Search", "heuristic-search", "DSA", "Graph Theory", "algorithm", "Evaluation function search", "HIGH"),
    "Topological Sort": ("Topological Sort", "topological-sort", "DSA", "Graph Theory", "algorithm", "DAG dependency ordering", "HIGH"),
    "Directed Acyclic Graph": ("Directed Acyclic Graph", "directed-acyclic-graph", "DSA", "Graph Theory", "secondary", "Dependency graph topology", "HIGH"),
    "Shortest Path": ("Shortest Path", "shortest-path", "DSA", "Graph Theory", "algorithm", "Path minimization queries", "HIGH"),
    "Dijkstra's Algorithm": ("Dijkstra's Algorithm", "dijkstras-algorithm", "DSA", "Shortest Path", "algorithm", "Non-negative edge greedy shortest path", "HIGH"),
    "Bellman–Ford Algorithm": ("Bellman–Ford Algorithm", "bellman-ford-algorithm", "DSA", "Shortest Path", "algorithm", "Negative cycle tolerant shortest path", "HIGH"),
    "Floyd–Warshall Algorithm": ("Floyd–Warshall Algorithm", "floyd-warshall-algorithm", "DSA", "Shortest Path", "algorithm", "All-pairs shortest path dynamic programming", "HIGH"),
    "K Shortest Path": ("K Shortest Path", "k-shortest-path", "DSA", "Shortest Path", "algorithm", "Ranked path finding (Yen's algorithm)", "HIGH"),
    "Minimum Spanning Tree": ("Minimum Spanning Tree", "minimum-spanning-tree", "DSA", "Graph Theory", "algorithm", "Spanning tree weight minimization", "HIGH"),
    "Prim's Algorithm": ("Prim's Algorithm", "prims-algorithm", "DSA", "Minimum Spanning Tree", "algorithm", "Greedy vertex growth MST", "HIGH"),
    "Kruskal's Algorithm": ("Kruskal's Algorithm", "kruskals-algorithm", "DSA", "Minimum Spanning Tree", "algorithm", "Disjoint set union edge selection MST", "HIGH"),
    "Borůvka's Algorithm": ("Borůvka's Algorithm", "boruvkas-algorithm", "DSA", "Minimum Spanning Tree", "algorithm", "Component contraction parallel MST", "HIGH"),
    "Union-Find": ("Union-Find", "union-find", "DSA", "Graph Theory", "secondary", "Disjoint Set Union (DSU) with path compression", "HIGH"),
    "Bipartite Graph": ("Bipartite Graph", "bipartite-graph", "DSA", "Graph Theory", "secondary", "Two-colorable graph topology", "HIGH"),
    "Graph Coloring": ("Graph Coloring", "graph-coloring", "DSA", "Graph Theory", "algorithm", "Vertex chromatic number scheduling", "HIGH"),
    "Planar Graph": ("Planar Graph", "planar-graph", "DSA", "Graph Theory", "secondary", "Non-intersecting edge embeddings", "HIGH"),
    "Eulerian Circuit": ("Eulerian Circuit", "eulerian-circuit", "DSA", "Graph Theory", "algorithm", "Visit every edge exactly once (closed)", "HIGH"),
    "Eulerian Path": ("Eulerian Path", "eulerian-path", "DSA", "Graph Theory", "algorithm", "Visit every edge exactly once (open)", "HIGH"),
    "Eulerian Graph": ("Eulerian Graph", "eulerian-graph", "DSA", "Graph Theory", "secondary", "Even vertex degree graphs", "HIGH"),
    "Semi-Eulerian Graph": ("Semi-Eulerian Graph", "semi-eulerian-graph", "DSA", "Graph Theory", "secondary", "Graphs with exactly two odd degree vertices", "HIGH"),
    "Hamiltonian Path": ("Hamiltonian Path", "hamiltonian-path", "DSA", "Graph Theory", "algorithm", "Visit every vertex exactly once", "HIGH"),
    "Strongly Connected Component": ("Strongly Connected Component", "strongly-connected-component", "DSA", "Graph Theory", "algorithm", "Directed mutual reachability components", "HIGH"),
    "Tarjan's SCC Algorithm": ("Tarjan's SCC Algorithm", "tarjans-scc-algorithm", "DSA", "Strongly Connected Component", "algorithm", "DFS low-link SCC discovery", "HIGH"),
    "Kosaraju's Algorithm": ("Kosaraju's Algorithm", "kosarajus-algorithm", "DSA", "Strongly Connected Component", "algorithm", "Two-pass transpose DFS SCC discovery", "HIGH"),
    "Bridge (Graph)": ("Bridge (Graph)", "bridge-graph", "DSA", "Graph Theory", "algorithm", "Critical disconnect edges", "HIGH"),
    "Articulation Point": ("Articulation Point", "articulation-point", "DSA", "Graph Theory", "algorithm", "Cut vertices in biconnected components", "HIGH"),
    "Biconnected Component": ("Biconnected Component", "biconnected-component", "DSA", "Graph Theory", "algorithm", "2-vertex connected subgraphs", "HIGH"),
    "Flow Network": ("Flow Network", "flow-network", "DSA", "Graph Theory", "algorithm", "Directed capacity network flow", "HIGH"),
    "Maximum Flow": ("Maximum Flow", "maximum-flow", "DSA", "Flow Network", "algorithm", "Source-sink throughput maximization", "HIGH"),
    "Minimum Cut": ("Minimum Cut", "minimum-cut", "DSA", "Flow Network", "algorithm", "Max-flow min-cut theorem cut capacity", "HIGH"),
    "Edmonds–Karp Algorithm": ("Edmonds–Karp Algorithm", "edmonds-karp-algorithm", "DSA", "Flow Network", "algorithm", "BFS augmenting path max flow", "HIGH"),
    "Dinic's Algorithm": ("Dinic's Algorithm", "dinics-algorithm", "DSA", "Flow Network", "algorithm", "Level graph blocking flow optimization", "HIGH"),
    "Push-Relabel Algorithm": ("Push-Relabel Algorithm", "push-relabel-algorithm", "DSA", "Flow Network", "algorithm", "Preflow height-based flow distribution", "HIGH"),
    "MPM Algorithm": ("MPM Algorithm", "mpm-algorithm", "DSA", "Flow Network", "algorithm", "Malhotra-Pramodh-Kumar blocking flow", "HIGH"),
    "Minimum-Cost Flow": ("Minimum-Cost Flow", "minimum-cost-flow", "DSA", "Flow Network", "algorithm", "Flow with per-unit transit costs", "HIGH"),
    "Successive Shortest Path Algorithm": ("Successive Shortest Path Algorithm", "successive-shortest-path-algorithm", "DSA", "Minimum-Cost Flow", "algorithm", "Min-cost flow augmenting path", "HIGH"),
    "Matching (Graph)": ("Matching (Graph)", "matching-graph", "DSA", "Graph Theory", "algorithm", "Independent edge subsets", "HIGH"),
    "Maximum Matching": ("Maximum Matching", "maximum-matching", "DSA", "Matching (Graph)", "algorithm", "Maximum cardinality edge matching", "HIGH"),
    "Perfect Matching": ("Perfect Matching", "perfect-matching", "DSA", "Matching (Graph)", "algorithm", "Every vertex incident to matched edge", "HIGH"),
    "Hungarian Algorithm": ("Hungarian Algorithm", "hungarian-algorithm", "DSA", "Matching (Graph)", "algorithm", "Kuhn-Munkres weighted bipartite matching", "HIGH"),

    # Strings & Pattern Matching
    "String Matching": ("String Matching", "string-matching", "DSA", "Strings", "algorithm", "Substring search in text", "HIGH"),
    "Hash Function": ("Hash Function", "hash-function", "DSA", "Hash Table", "algorithm", "Key hashing and uniform distribution", "HIGH"),
    "Rolling Hash": ("Rolling Hash", "rolling-hash", "DSA", "String Matching", "algorithm", "Rabin-Karp polynomial rolling hash", "HIGH"),
    "Knuth–Morris–Pratt Algorithm": ("Knuth–Morris–Pratt Algorithm", "knuth-morris-pratt-algorithm", "DSA", "String Matching", "algorithm", "LPS prefix function string search", "HIGH"),
    "Boyer–Moore String-Search Algorithm": ("Boyer–Moore String-Search Algorithm", "boyer-moore-string-search-algorithm", "DSA", "String Matching", "algorithm", "Bad character & good suffix shift search", "HIGH"),
    "Aho–Corasick Algorithm": ("Aho–Corasick Algorithm", "aho-corasick-algorithm", "DSA", "String Matching", "algorithm", "Trie automaton multi-pattern search", "HIGH"),
    "Z Algorithm": ("Z Algorithm", "z-algorithm", "DSA", "String Matching", "algorithm", "Prefix match box Z-array", "HIGH"),
    "Manacher": ("Manacher's Algorithm", "manachers-algorithm", "DSA", "Strings", "algorithm", "Linear time longest palindromic substring", "HIGH"),
    "Suffix Array": ("Suffix Array", "suffix-array", "DSA", "Strings", "algorithm", "Lexicographical suffix permutations", "HIGH"),
    "Suffix Tree": ("Suffix Tree", "suffix-tree", "DSA", "Strings", "algorithm", "Compressed trie of all suffixes", "HIGH"),
    "Suffix Automaton": ("Suffix Automaton", "suffix-automaton", "DSA", "Strings", "algorithm", "Minimal DFA recognizing all substrings", "HIGH"),
    "Lyndon Factorization": ("Lyndon Factorization", "lyndon-factorization", "DSA", "Strings", "algorithm", "Duval's strictly smaller suffix decomposition", "HIGH"),
    "Lexicographically Minimal String Rotation": ("Lexicographically Minimal String Rotation", "lexicographically-minimal-string-rotation", "DSA", "Strings", "algorithm", "Booth's algorithm for string cycles", "HIGH"),

    # Math, Number Theory & Combinatorics
    "Math": ("Math", "math", "DSA", None, "primary", "General mathematical logic and equations", "HIGH"),
    "Number Theory": ("Number Theory", "number-theory", "DSA", "Math", "secondary", "Divisibility, modular arithmetic, primes", "HIGH"),
    "Prime Factorization": ("Prime Factorization", "prime-factorization", "DSA", "Number Theory", "algorithm", "Decomposition into prime products", "HIGH"),
    "Prime Number Sieve": ("Prime Number Sieve", "prime-number-sieve", "DSA", "Number Theory", "algorithm", "Sieve of Eratosthenes", "HIGH"),
    "Sieve Theory": ("Sieve Theory", "sieve-theory", "DSA", "Number Theory", "algorithm", "Generalized mathematical sieving", "HIGH"),
    "Primality Test": ("Primality Test", "primality-test", "DSA", "Number Theory", "algorithm", "Deterministic & probabilistic prime testing", "HIGH"),
    "Greatest Common Divisor": ("Greatest Common Divisor", "greatest-common-divisor", "DSA", "Number Theory", "algorithm", "Euclidean GCD computation", "HIGH"),
    "Least Common Multiple": ("Least Common Multiple", "least-common-multiple", "DSA", "Number Theory", "algorithm", "LCM through GCD relations", "HIGH"),
    "Euclidean Algorithm": ("Euclidean Algorithm", "euclidean-algorithm", "DSA", "Number Theory", "algorithm", "Modulo step GCD algorithm", "HIGH"),
    "Extended Euclidean Algorithm": ("Extended Euclidean Algorithm", "extended-euclidean-algorithm", "DSA", "Number Theory", "algorithm", "Linear Diophantine integer equation solutions", "HIGH"),
    "Bézout's Lemma": ("Bézout's Lemma", "bezouts-lemma", "DSA", "Number Theory", "algorithm", "Identity ax + by = gcd(a,b)", "HIGH"),
    "Fermat's Little Theorem": ("Fermat's Little Theorem", "fermats-little-theorem", "DSA", "Number Theory", "algorithm", "Modular inverse under prime moduli", "HIGH"),
    "Euler's Totient Function": ("Euler's Totient Function", "eulers-totient-function", "DSA", "Number Theory", "algorithm", "Count of coprimes up to n (phi function)", "HIGH"),
    "Euler's Theorem": ("Euler's Theorem", "eulers-theorem", "DSA", "Number Theory", "algorithm", "Generalization of Fermat's Little Theorem", "HIGH"),
    "Combinatorics": ("Combinatorics", "combinatorics", "DSA", "Math", "secondary", "Permutations, combinations, Catalan numbers", "HIGH"),
    "Pigeonhole Principle": ("Pigeonhole Principle", "pigeonhole-principle", "DSA", "Combinatorics", "pattern", "Discrete existence guarantee bounds", "HIGH"),
    "Inclusion-Exclusion Principle": ("Inclusion-Exclusion Principle", "inclusion-exclusion-principle", "DSA", "Combinatorics", "pattern", "Overlapping set cardinality accounting", "HIGH"),
    "Probability and Statistics": ("Probability and Statistics", "probability-and-statistics", "DSA", "Math", "secondary", "Expectation, distributions, Bayes", "HIGH"),
    "Game Theory": ("Game Theory", "game-theory", "DSA", "Math", "secondary", "Combinatorial game states and strategies", "HIGH"),
    "Minimax": ("Minimax", "minimax", "DSA", "Game Theory", "algorithm", "Adversarial zero-sum decision rule", "HIGH"),
    "Nim Game": ("Nim Game", "nim-game", "DSA", "Game Theory", "pattern", "XOR sum parity invariant game", "HIGH"),
    "Sprague–Grundy Theorem": ("Sprague–Grundy Theorem", "sprague-grundy-theorem", "DSA", "Game Theory", "algorithm", "Impartial games mapping to Nim-heaps", "HIGH"),
    "Zero-Sum Game": ("Zero-Sum Game", "zero-sum-game", "DSA", "Game Theory", "pattern", "Constant utility allocation games", "HIGH"),
    "Impartial Game": ("Impartial Game", "impartial-game", "DSA", "Game Theory", "pattern", "Symmetric move available games", "HIGH"),
    "Geometry": ("Geometry", "geometry", "DSA", "Math", "secondary", "2D/3D coordinates, vectors, distances", "HIGH"),
    "Convex Hull": ("Convex Hull", "convex-hull", "DSA", "Geometry", "algorithm", "Graham scan & Monotone chain hull", "HIGH"),
    "Polygons": ("Polygons", "polygons", "DSA", "Geometry", "secondary", "Area, point-in-polygon, shoelace formula", "HIGH"),
    "Triangulation": ("Triangulation", "triangulation", "DSA", "Geometry", "algorithm", "Polygon ear-clipping & Delaunay", "HIGH"),
    "Nearest Pair of Points": ("Nearest Pair of Points", "nearest-pair-of-points", "DSA", "Geometry", "algorithm", "Divide and conquer closest pair", "HIGH"),
    "Minimum Enclosing Circle": ("Minimum Enclosing Circle", "minimum-enclosing-circle", "DSA", "Geometry", "algorithm", "Welzl's randomized boundary circle", "HIGH"),
    "Sweep Line": ("Sweep Line", "sweep-line", "DSA", "Geometry", "pattern", "Event-driven coordinate axis sweep", "HIGH"),
    "Linear Algebra": ("Linear Algebra", "linear-algebra", "DSA", "Math", "secondary", "Matrix multiplication, Gaussian elimination", "HIGH"),
    "Newton's Method": ("Newton's Method", "newtons-method", "DSA", "Math", "algorithm", "Root-finding numerical tangent iterations", "HIGH"),

    # Bit Manipulation & Low-Level
    "Bit Manipulation": ("Bit Manipulation", "bit-manipulation", "DSA", None, "primary", "Bitwise AND, OR, XOR, shifts and masks", "HIGH"),

    # Data Structures Advanced
    "Ordered Set": ("Ordered Set", "ordered-set", "DSA", None, "secondary", "Self-balancing sorted sets (Red-Black / AVL)", "HIGH"),
    "Data Stream": ("Data Stream", "data-stream", "DSA", None, "secondary", "Online streaming data processing", "HIGH"),
    "Interactive": ("Interactive", "interactive", "DSA", None, "secondary", "API judge query problems", "HIGH"),
    "Brainteaser": ("Brainteaser", "brainteaser", "DSA", None, "secondary", "Insight and trick based logic riddles", "HIGH"),
    "Randomized": ("Randomized", "randomized", "DSA", None, "algorithm", "Probabilistic sampling & Fisher-Yates", "HIGH"),
    "Reservoir Sampling": ("Reservoir Sampling", "reservoir-sampling", "DSA", "Randomized", "algorithm", "Uniform k-sample from unknown stream length", "HIGH"),
    "Rejection Sampling": ("Rejection Sampling", "rejection-sampling", "DSA", "Randomized", "algorithm", "Conditional probability sampling", "HIGH"),
    "Algorithm X": ("Algorithm X", "algorithm-x", "DSA", None, "algorithm", "Knuth's exact cover backtrack algorithm", "HIGH"),
    "Dancing Links": ("Dancing Links", "dancing-links", "DSA", "Algorithm X", "algorithm", "Circular doubly-linked list for Algorithm X", "HIGH"),
    "Persistent Data Structure": ("Persistent Data Structure", "persistent-data-structure", "DSA", None, "algorithm", "Historical state preservation structures", "HIGH"),
    "Sparse Table": ("Sparse Table", "sparse-table", "DSA", None, "algorithm", "Static idempotent range minimum query", "HIGH"),
    "Sqrt Decomposition": ("Sqrt Decomposition", "sqrt-decomposition", "DSA", None, "algorithm", "O(sqrt(N)) bucket query technique (Mo's algorithm)", "HIGH"),
    "Range Minimum/Maximum Query": ("Range Minimum/Maximum Query", "range-minimum-maximum-query", "DSA", None, "algorithm", "Static and dynamic RMQ", "HIGH"),
    "Brute-Force Search": ("Brute-Force Search", "brute-force-search", "DSA", None, "algorithm", "Complete state exploration", "HIGH"),
    "Boyer–Moore Majority Vote Algorithm": ("Boyer–Moore Majority Vote Algorithm", "boyer-moore-majority-vote-algorithm", "DSA", None, "algorithm", "Linear-time O(1) space majority element", "HIGH"),
    "Floyd's Cycle Finding Algorithm": ("Floyd's Cycle Finding Algorithm", "floyds-cycle-finding-algorithm", "DSA", "Two Pointers", "algorithm", "Tortoise and hare cycle detection", "HIGH"),
    "Intervals": ("Intervals", "intervals", "DSA", "Arrays", "pattern", "Interval overlap, merging and intersection", "HIGH"),

    # Database & SQL Domain
    "Database": ("Database Queries", "database-queries", "DATABASE", None, "primary", "Core SQL DDL, DML and schema queries", "HIGH"),

    # Pandas Domain
    "Pandas": ("Pandas", "pandas", "PANDAS", None, "primary", "Python Pandas data analysis library", "HIGH"),
    "DataFrame": ("DataFrame Operations", "dataframe-operations", "PANDAS", "Pandas", "secondary", "Tabular data frame manipulation", "HIGH"),
    "Data Cleaning": ("Data Cleaning", "data-cleaning", "PANDAS", "Pandas", "algorithm", "Missing value imputation and deduplication", "HIGH"),
    "Data Reshaping": ("Data Reshaping", "data-reshaping", "PANDAS", "Pandas", "algorithm", "Pivot, melt and cross-tabulation", "HIGH"),

    # JavaScript Domain
    "JavaScript": ("JavaScript", "javascript", "JAVASCRIPT", None, "primary", "Core ECMAScript language runtime", "HIGH"),
    "Promise": ("Promises", "promises", "JAVASCRIPT", "JavaScript", "secondary", "Asynchronous deferred result primitives", "HIGH"),
    "Asynchronous Programming": ("Asynchronous Programming", "asynchronous-programming", "JAVASCRIPT", "JavaScript", "pattern", "Async/await and microtask queue", "HIGH"),
    "Closure": ("Closures", "closures", "JAVASCRIPT", "JavaScript", "pattern", "Lexical scoping state retention", "HIGH"),
    "Function": ("Functions", "functions", "JAVASCRIPT", "JavaScript", "secondary", "First-class and higher-order functions", "HIGH"),
    "Object": ("Objects", "objects", "JAVASCRIPT", "JavaScript", "secondary", "Keyed collections and prototypes", "HIGH"),
    "JSON": ("JSON", "json", "JAVASCRIPT", "JavaScript", "secondary", "Data interchange serialization", "HIGH"),
    "Event Handling": ("Event Handling", "event-handling", "JAVASCRIPT", "JavaScript", "pattern", "DOM & EventEmitter event pipelines", "HIGH"),

    # Shell Domain
    "Shell": ("Shell Scripting", "shell-scripting", "SHELL", None, "primary", "Bash & POSIX shell processing", "HIGH"),

    # Concurrency Domain
    "Concurrency": ("Concurrency", "concurrency", "CONCURRENCY", None, "primary", "Thread synchronization and race conditions", "HIGH"),

    # Design Domain
    "Design": ("System & Class Design", "system-and-class-design", "DESIGN", None, "primary", "Modular architecture and object models", "HIGH"),
    "Iterator": ("Iterators", "iterators", "DESIGN", "Design", "pattern", "Sequential element traversal pattern", "HIGH"),
    "Object-Oriented Programming": ("Object-Oriented Programming", "object-oriented-programming", "DESIGN", "Design", "pattern", "Encapsulation, inheritance and polymorphism", "HIGH"),
}


def slugify(text: str) -> str:
    """Generate a clean, deterministic, URL-safe slug."""
    s = text.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def classify_problem_domain(topics: List[str]) -> str:
    """
    Deterministically classify a problem into a primary engineering domain based on topics.
    Precedence:
    1. Shell -> SHELL
    2. Concurrency -> CONCURRENCY
    3. Pandas / DataFrame -> PANDAS
    4. JavaScript / Promise -> JAVASCRIPT
    5. Database -> DATABASE
    6. Design only -> DESIGN
    7. All other algorithmic topics -> DSA
    """
    topic_set = {t.strip() for t in topics if t.strip()}

    if "Shell" in topic_set:
        return "SHELL"
    if "Concurrency" in topic_set:
        return "CONCURRENCY"
    if any(t in topic_set for t in ["Pandas", "DataFrame", "Data Cleaning", "Data Reshaping"]):
        return "PANDAS"
    if any(t in topic_set for t in ["JavaScript", "Promise", "Asynchronous Programming", "Closure", "Event Handling"]):
        return "JAVASCRIPT"
    if "Database" in topic_set:
        return "DATABASE"
    if topic_set == {"Design"}:
        return "DESIGN"

    return "DSA"


def get_topic_metadata(raw_topic: str) -> Dict[str, Any]:
    """Retrieve normalized taxonomy attributes for any source topic."""
    clean = raw_topic.strip()
    if clean in TOPIC_TAXONOMY_MAP:
        name, slug, domain, parent, role, rule, conf = TOPIC_TAXONOMY_MAP[clean]
        return {
            "source_topic": clean,
            "verniq_name": name,
            "slug": slug,
            "domain": domain,
            "parent_topic": parent,
            "role": role,
            "rule": rule,
            "confidence": conf,
        }

    # Fallback for unexpected future topics
    return {
        "source_topic": clean,
        "verniq_name": clean,
        "slug": slugify(clean),
        "domain": "DSA",
        "parent_topic": None,
        "role": "secondary",
        "rule": "Default unmapped passthrough",
        "confidence": "MEDIUM",
    }
