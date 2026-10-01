# VERNIQ Topic Taxonomy & Normalization Standards

> **Version:** 1.0.0  
> **Status:** Production Content Architecture Standard  
> **Scope:** Canonical 189-Topic Mapping & Hierarchical Domain Model

---

## 1. Top-Level Engineering Domains

The Verniq problem catalog organizes all challenges under 8 distinct engineering domains:

| Domain | Slug | Order | Description |
|:---|:---:|:---:|:---|
| **DSA** | `dsa` | 1 | Data Structures & Algorithms: core computational complexity, discrete math, and invariants. |
| **Database** | `database` | 2 | Relational Databases: SQL queries, aggregation, joins, subqueries, and window functions. |
| **JavaScript** | `javascript` | 3 | Modern ECMAScript: event loop, promises, closures, prototypes, and asynchronous execution. |
| **Pandas** | `pandas` | 4 | Data Science & Analysis: DataFrame operations, reshaping, indexing, and tabular filtering. |
| **Shell** | `shell` | 5 | Unix & Bash: stream processing, sed/awk, pipelines, and operating system utilities. |
| **Concurrency** | `concurrency` | 6 | Multithreading & Synchronization: mutexes, semaphores, barriers, and atomic primitives. |
| **Design** | `design` | 7 | System & Object-Oriented Design: architectural patterns, in-memory caches, and interfaces. |
| **Other** | `other` | 8 | Unclassified or multidisciplinary engineering interview questions. |

---

## 2. Comprehensive 189-Topic Normalization Matrix

| # | Source Topic (Raw) | Verniq Topic (Normalized) | Domain | Parent Topic | Default Role | Normalization Rule | Confidence |
|:---:|:---|:---|:---:|:---|:---:|:---|:---:|
| 1 | `Concurrency` | **Concurrency** | `CONCURRENCY` | *(Root)* | `PRIMARY` | Thread synchronization and race conditions | **HIGH** |
| 2 | `Database` | **Database Queries** | `DATABASE` | *(Root)* | `PRIMARY` | Core SQL DDL, DML and schema queries | **HIGH** |
| 3 | `Design` | **System & Class Design** | `DESIGN` | *(Root)* | `PRIMARY` | Modular architecture and object models | **HIGH** |
| 4 | `Iterator` | **Iterators** | `DESIGN` | `Design` | `PATTERN` | Sequential element traversal pattern | **HIGH** |
| 5 | `Object-Oriented Programming` | **Object-Oriented Programming** | `DESIGN` | `Design` | `PATTERN` | Encapsulation, inheritance and polymorphism | **HIGH** |
| 6 | `Algorithm X` | **Algorithm X** | `DSA` | *(Root)* | `ALGORITHM` | Knuth's exact cover backtrack algorithm | **HIGH** |
| 7 | `Array` | **Arrays** | `DSA` | *(Root)* | `PRIMARY` | Pluralize core container | **HIGH** |
| 8 | `Backtracking` | **Backtracking** | `DSA` | *(Root)* | `PATTERN` | Constraint satisfaction state search | **HIGH** |
| 9 | `Binary Search` | **Binary Search** | `DSA` | *(Root)* | `ALGORITHM` | Logarithmic monotonic search | **HIGH** |
| 10 | `Bit Manipulation` | **Bit Manipulation** | `DSA` | *(Root)* | `PRIMARY` | Bitwise AND, OR, XOR, shifts and masks | **HIGH** |
| 11 | `Boyer–Moore Majority Vote Algorithm` | **Boyer–Moore Majority Vote Algorithm** | `DSA` | *(Root)* | `ALGORITHM` | Linear-time O(1) space majority element | **HIGH** |
| 12 | `Brainteaser` | **Brainteaser** | `DSA` | *(Root)* | `SECONDARY` | Insight and trick based logic riddles | **HIGH** |
| 13 | `Brute-Force Search` | **Brute-Force Search** | `DSA` | *(Root)* | `ALGORITHM` | Complete state exploration | **HIGH** |
| 14 | `Counting` | **Counting** | `DSA` | *(Root)* | `ALGORITHM` | Frequency mapping and bucket accounting | **HIGH** |
| 15 | `Data Stream` | **Data Stream** | `DSA` | *(Root)* | `SECONDARY` | Online streaming data processing | **HIGH** |
| 16 | `Divide and Conquer` | **Divide and Conquer** | `DSA` | *(Root)* | `PATTERN` | Subproblem decomposition and merging | **HIGH** |
| 17 | `Dynamic Programming` | **Dynamic Programming** | `DSA` | *(Root)* | `PRIMARY` | Optimal substructure & overlapping subproblems | **HIGH** |
| 18 | `Enumeration` | **Enumeration** | `DSA` | *(Root)* | `ALGORITHM` | Exhaustive candidate iteration | **HIGH** |
| 19 | `Graph` | **Graph Theory** | `DSA` | *(Root)* | `PRIMARY` | Alias for Graph Theory | **HIGH** |
| 20 | `Graph Theory` | **Graph Theory** | `DSA` | *(Root)* | `PRIMARY` | Vertices, edges, networks and topologies | **HIGH** |
| 21 | `Greedy` | **Greedy** | `DSA` | *(Root)* | `PATTERN` | Locally optimal choice heuristics | **HIGH** |
| 22 | `Hash Table` | **Hash Table** | `DSA` | *(Root)* | `PRIMARY` | Preserve standard associative container | **HIGH** |
| 23 | `Heap (Priority Queue)` | **Heap (Priority Queue)** | `DSA` | *(Root)* | `PRIMARY` | Preserve priority queue container | **HIGH** |
| 24 | `Interactive` | **Interactive** | `DSA` | *(Root)* | `SECONDARY` | API judge query problems | **HIGH** |
| 25 | `Linked List` | **Linked List** | `DSA` | *(Root)* | `PRIMARY` | Preserve fundamental linear structure | **HIGH** |
| 26 | `Math` | **Math** | `DSA` | *(Root)* | `PRIMARY` | General mathematical logic and equations | **HIGH** |
| 27 | `Ordered Set` | **Ordered Set** | `DSA` | *(Root)* | `SECONDARY` | Self-balancing sorted sets (Red-Black / AVL) | **HIGH** |
| 28 | `Persistent Data Structure` | **Persistent Data Structure** | `DSA` | *(Root)* | `ALGORITHM` | Historical state preservation structures | **HIGH** |
| 29 | `Queue` | **Queue** | `DSA` | *(Root)* | `PRIMARY` | Preserve FIFO structure | **HIGH** |
| 30 | `Randomized` | **Randomized** | `DSA` | *(Root)* | `ALGORITHM` | Probabilistic sampling & Fisher-Yates | **HIGH** |
| 31 | `Range Minimum/Maximum Query` | **Range Minimum/Maximum Query** | `DSA` | *(Root)* | `ALGORITHM` | Static and dynamic RMQ | **HIGH** |
| 32 | `Recursion` | **Recursion** | `DSA` | *(Root)* | `PATTERN` | Self-referential function invocation | **HIGH** |
| 33 | `Simulation` | **Simulation** | `DSA` | *(Root)* | `ALGORITHM` | Deterministic step-by-step state emulation | **HIGH** |
| 34 | `Sort` | **Sorting** | `DSA` | *(Root)* | `PRIMARY` | Alias for Sorting | **HIGH** |
| 35 | `Sorting` | **Sorting** | `DSA` | *(Root)* | `PRIMARY` | Ordering algorithms and comparator techniques | **HIGH** |
| 36 | `Sparse Table` | **Sparse Table** | `DSA` | *(Root)* | `ALGORITHM` | Static idempotent range minimum query | **HIGH** |
| 37 | `Sqrt Decomposition` | **Sqrt Decomposition** | `DSA` | *(Root)* | `ALGORITHM` | O(sqrt(N)) bucket query technique (Mo's algorithm) | **HIGH** |
| 38 | `Stack` | **Stack** | `DSA` | *(Root)* | `PRIMARY` | Preserve LIFO structure | **HIGH** |
| 39 | `String` | **Strings** | `DSA` | *(Root)* | `PRIMARY` | Pluralize core sequence | **HIGH** |
| 40 | `Tree` | **Tree** | `DSA` | *(Root)* | `PRIMARY` | General hierarchical tree structure | **HIGH** |
| 41 | `Two Pointers` | **Two Pointers** | `DSA` | *(Root)* | `PATTERN` | Index convergence or chasing technique | **HIGH** |
| 42 | `Dancing Links` | **Dancing Links** | `DSA` | `Algorithm X` | `ALGORITHM` | Circular doubly-linked list for Algorithm X | **HIGH** |
| 43 | `Intervals` | **Intervals** | `DSA` | `Arrays` | `PATTERN` | Interval overlap, merging and intersection | **HIGH** |
| 44 | `Matrix` | **Matrix** | `DSA` | `Arrays` | `SECONDARY` | 2D grid specialization of Arrays | **HIGH** |
| 45 | `Prefix Sum` | **Prefix Sum** | `DSA` | `Arrays` | `PATTERN` | Cumulative range sum lookup pattern | **HIGH** |
| 46 | `Ternary Search` | **Ternary Search** | `DSA` | `Binary Search` | `ALGORITHM` | Unimodal function extremum search | **HIGH** |
| 47 | `Binary Search Tree` | **Binary Search Tree** | `DSA` | `Binary Tree` | `SECONDARY` | Ordered key binary search invariant | **HIGH** |
| 48 | `0-1 BFS` | **0-1 BFS** | `DSA` | `Breadth-First Search` | `ALGORITHM` | Deque-based 0/1 weight shortest path | **HIGH** |
| 49 | `Bidirectional Search` | **Bidirectional Search** | `DSA` | `Breadth-First Search` | `ALGORITHM` | Simultaneous source and target traversal | **HIGH** |
| 50 | `Inclusion-Exclusion Principle` | **Inclusion-Exclusion Principle** | `DSA` | `Combinatorics` | `PATTERN` | Overlapping set cardinality accounting | **HIGH** |
| 51 | `Pigeonhole Principle` | **Pigeonhole Principle** | `DSA` | `Combinatorics` | `PATTERN` | Discrete existence guarantee bounds | **HIGH** |
| 52 | `Meet in the Middle` | **Meet in the Middle** | `DSA` | `Divide and Conquer` | `PATTERN` | Bidirectional search space reduction | **HIGH** |
| 53 | `Quickselect` | **Quickselect** | `DSA` | `Divide and Conquer` | `ALGORITHM` | Linear-time k-th order statistic selection | **HIGH** |
| 54 | `Bitmask` | **Bitmask** | `DSA` | `Dynamic Programming` | `PATTERN` | Subset state compression DP | **HIGH** |
| 55 | `DP on Trees` | **DP on Trees** | `DSA` | `Dynamic Programming` | `ALGORITHM` | Subtree state transitions | **HIGH** |
| 56 | `Knapsack Problem` | **Knapsack Problem** | `DSA` | `Dynamic Programming` | `PATTERN` | Bounded value capacity optimization | **HIGH** |
| 57 | `Longest Common Subsequence` | **Longest Common Subsequence** | `DSA` | `Dynamic Programming` | `PATTERN` | Two-sequence alignment DP | **HIGH** |
| 58 | `Longest Increasing Subsequence` | **Longest Increasing Subsequence** | `DSA` | `Dynamic Programming` | `PATTERN` | Monotonic subsequence DP / Patience sorting | **HIGH** |
| 59 | `Memoization` | **Memoization** | `DSA` | `Dynamic Programming` | `PATTERN` | Top-down cache recurrence pattern | **HIGH** |
| 60 | `Subsequence` | **Subsequence** | `DSA` | `Dynamic Programming` | `PATTERN` | General subsequence properties | **HIGH** |
| 61 | `Dinic's Algorithm` | **Dinic's Algorithm** | `DSA` | `Flow Network` | `ALGORITHM` | Level graph blocking flow optimization | **HIGH** |
| 62 | `Edmonds–Karp Algorithm` | **Edmonds–Karp Algorithm** | `DSA` | `Flow Network` | `ALGORITHM` | BFS augmenting path max flow | **HIGH** |
| 63 | `MPM Algorithm` | **MPM Algorithm** | `DSA` | `Flow Network` | `ALGORITHM` | Malhotra-Pramodh-Kumar blocking flow | **HIGH** |
| 64 | `Maximum Flow` | **Maximum Flow** | `DSA` | `Flow Network` | `ALGORITHM` | Source-sink throughput maximization | **HIGH** |
| 65 | `Minimum Cut` | **Minimum Cut** | `DSA` | `Flow Network` | `ALGORITHM` | Max-flow min-cut theorem cut capacity | **HIGH** |
| 66 | `Minimum-Cost Flow` | **Minimum-Cost Flow** | `DSA` | `Flow Network` | `ALGORITHM` | Flow with per-unit transit costs | **HIGH** |
| 67 | `Push-Relabel Algorithm` | **Push-Relabel Algorithm** | `DSA` | `Flow Network` | `ALGORITHM` | Preflow height-based flow distribution | **HIGH** |
| 68 | `Impartial Game` | **Impartial Game** | `DSA` | `Game Theory` | `PATTERN` | Symmetric move available games | **HIGH** |
| 69 | `Minimax` | **Minimax** | `DSA` | `Game Theory` | `ALGORITHM` | Adversarial zero-sum decision rule | **HIGH** |
| 70 | `Nim Game` | **Nim Game** | `DSA` | `Game Theory` | `PATTERN` | XOR sum parity invariant game | **HIGH** |
| 71 | `Sprague–Grundy Theorem` | **Sprague–Grundy Theorem** | `DSA` | `Game Theory` | `ALGORITHM` | Impartial games mapping to Nim-heaps | **HIGH** |
| 72 | `Zero-Sum Game` | **Zero-Sum Game** | `DSA` | `Game Theory` | `PATTERN` | Constant utility allocation games | **HIGH** |
| 73 | `Convex Hull` | **Convex Hull** | `DSA` | `Geometry` | `ALGORITHM` | Graham scan & Monotone chain hull | **HIGH** |
| 74 | `Minimum Enclosing Circle` | **Minimum Enclosing Circle** | `DSA` | `Geometry` | `ALGORITHM` | Welzl's randomized boundary circle | **HIGH** |
| 75 | `Nearest Pair of Points` | **Nearest Pair of Points** | `DSA` | `Geometry` | `ALGORITHM` | Divide and conquer closest pair | **HIGH** |
| 76 | `Polygons` | **Polygons** | `DSA` | `Geometry` | `SECONDARY` | Area, point-in-polygon, shoelace formula | **HIGH** |
| 77 | `Sweep Line` | **Sweep Line** | `DSA` | `Geometry` | `PATTERN` | Event-driven coordinate axis sweep | **HIGH** |
| 78 | `Triangulation` | **Triangulation** | `DSA` | `Geometry` | `ALGORITHM` | Polygon ear-clipping & Delaunay | **HIGH** |
| 79 | `A* Search` | **A* Search** | `DSA` | `Graph Theory` | `ALGORITHM` | Heuristic guided graph search | **HIGH** |
| 80 | `Articulation Point` | **Articulation Point** | `DSA` | `Graph Theory` | `ALGORITHM` | Cut vertices in biconnected components | **HIGH** |
| 81 | `Biconnected Component` | **Biconnected Component** | `DSA` | `Graph Theory` | `ALGORITHM` | 2-vertex connected subgraphs | **HIGH** |
| 82 | `Bipartite Graph` | **Bipartite Graph** | `DSA` | `Graph Theory` | `SECONDARY` | Two-colorable graph topology | **HIGH** |
| 83 | `Breadth-First Search` | **Breadth-First Search** | `DSA` | `Graph Theory` | `ALGORITHM` | Level-order shortest path traversal | **HIGH** |
| 84 | `Bridge (Graph)` | **Bridge (Graph)** | `DSA` | `Graph Theory` | `ALGORITHM` | Critical disconnect edges | **HIGH** |
| 85 | `Depth-First Search` | **Depth-First Search** | `DSA` | `Graph Theory` | `ALGORITHM` | Exhaustive branch traversal | **HIGH** |
| 86 | `Directed Acyclic Graph` | **Directed Acyclic Graph** | `DSA` | `Graph Theory` | `SECONDARY` | Dependency graph topology | **HIGH** |
| 87 | `Eulerian Circuit` | **Eulerian Circuit** | `DSA` | `Graph Theory` | `ALGORITHM` | Visit every edge exactly once (closed) | **HIGH** |
| 88 | `Eulerian Graph` | **Eulerian Graph** | `DSA` | `Graph Theory` | `SECONDARY` | Even vertex degree graphs | **HIGH** |
| 89 | `Eulerian Path` | **Eulerian Path** | `DSA` | `Graph Theory` | `ALGORITHM` | Visit every edge exactly once (open) | **HIGH** |
| 90 | `Flow Network` | **Flow Network** | `DSA` | `Graph Theory` | `ALGORITHM` | Directed capacity network flow | **HIGH** |
| 91 | `Graph Coloring` | **Graph Coloring** | `DSA` | `Graph Theory` | `ALGORITHM` | Vertex chromatic number scheduling | **HIGH** |
| 92 | `Hamiltonian Path` | **Hamiltonian Path** | `DSA` | `Graph Theory` | `ALGORITHM` | Visit every vertex exactly once | **HIGH** |
| 93 | `Heuristic Search` | **Heuristic Search** | `DSA` | `Graph Theory` | `ALGORITHM` | Evaluation function search | **HIGH** |
| 94 | `Matching (Graph)` | **Matching (Graph)** | `DSA` | `Graph Theory` | `ALGORITHM` | Independent edge subsets | **HIGH** |
| 95 | `Minimum Spanning Tree` | **Minimum Spanning Tree** | `DSA` | `Graph Theory` | `ALGORITHM` | Spanning tree weight minimization | **HIGH** |
| 96 | `Planar Graph` | **Planar Graph** | `DSA` | `Graph Theory` | `SECONDARY` | Non-intersecting edge embeddings | **HIGH** |
| 97 | `Semi-Eulerian Graph` | **Semi-Eulerian Graph** | `DSA` | `Graph Theory` | `SECONDARY` | Graphs with exactly two odd degree vertices | **HIGH** |
| 98 | `Shortest Path` | **Shortest Path** | `DSA` | `Graph Theory` | `ALGORITHM` | Path minimization queries | **HIGH** |
| 99 | `Strongly Connected Component` | **Strongly Connected Component** | `DSA` | `Graph Theory` | `ALGORITHM` | Directed mutual reachability components | **HIGH** |
| 100 | `Topological Sort` | **Topological Sort** | `DSA` | `Graph Theory` | `ALGORITHM` | DAG dependency ordering | **HIGH** |
| 101 | `Union-Find` | **Union-Find** | `DSA` | `Graph Theory` | `SECONDARY` | Disjoint Set Union (DSU) with path compression | **HIGH** |
| 102 | `Hash Function` | **Hash Function** | `DSA` | `Hash Table` | `ALGORITHM` | Key hashing and uniform distribution | **HIGH** |
| 103 | `0-1 Knapsack` | **0-1 Knapsack** | `DSA` | `Knapsack Problem` | `PATTERN` | Binary inclusion knapsack | **HIGH** |
| 104 | `Complete Knapsack` | **Complete Knapsack** | `DSA` | `Knapsack Problem` | `PATTERN` | Unbounded quantity knapsack | **HIGH** |
| 105 | `Mixed Knapsack` | **Mixed Knapsack** | `DSA` | `Knapsack Problem` | `PATTERN` | Heterogeneous item knapsack | **HIGH** |
| 106 | `Multiple Knapsack` | **Multiple Knapsack** | `DSA` | `Knapsack Problem` | `PATTERN` | Bounded count knapsack | **HIGH** |
| 107 | `Doubly-Linked List` | **Doubly-Linked List** | `DSA` | `Linked List` | `SECONDARY` | Subtopic of Linked List | **HIGH** |
| 108 | `Hungarian Algorithm` | **Hungarian Algorithm** | `DSA` | `Matching (Graph)` | `ALGORITHM` | Kuhn-Munkres weighted bipartite matching | **HIGH** |
| 109 | `Maximum Matching` | **Maximum Matching** | `DSA` | `Matching (Graph)` | `ALGORITHM` | Maximum cardinality edge matching | **HIGH** |
| 110 | `Perfect Matching` | **Perfect Matching** | `DSA` | `Matching (Graph)` | `ALGORITHM` | Every vertex incident to matched edge | **HIGH** |
| 111 | `Combinatorics` | **Combinatorics** | `DSA` | `Math` | `SECONDARY` | Permutations, combinations, Catalan numbers | **HIGH** |
| 112 | `Game Theory` | **Game Theory** | `DSA` | `Math` | `SECONDARY` | Combinatorial game states and strategies | **HIGH** |
| 113 | `Geometry` | **Geometry** | `DSA` | `Math` | `SECONDARY` | 2D/3D coordinates, vectors, distances | **HIGH** |
| 114 | `Linear Algebra` | **Linear Algebra** | `DSA` | `Math` | `SECONDARY` | Matrix multiplication, Gaussian elimination | **HIGH** |
| 115 | `Newton's Method` | **Newton's Method** | `DSA` | `Math` | `ALGORITHM` | Root-finding numerical tangent iterations | **HIGH** |
| 116 | `Number Theory` | **Number Theory** | `DSA` | `Math` | `SECONDARY` | Divisibility, modular arithmetic, primes | **HIGH** |
| 117 | `Probability and Statistics` | **Probability and Statistics** | `DSA` | `Math` | `SECONDARY` | Expectation, distributions, Bayes | **HIGH** |
| 118 | `Borůvka's Algorithm` | **Borůvka's Algorithm** | `DSA` | `Minimum Spanning Tree` | `ALGORITHM` | Component contraction parallel MST | **HIGH** |
| 119 | `Kruskal's Algorithm` | **Kruskal's Algorithm** | `DSA` | `Minimum Spanning Tree` | `ALGORITHM` | Disjoint set union edge selection MST | **HIGH** |
| 120 | `Prim's Algorithm` | **Prim's Algorithm** | `DSA` | `Minimum Spanning Tree` | `ALGORITHM` | Greedy vertex growth MST | **HIGH** |
| 121 | `Successive Shortest Path Algorithm` | **Successive Shortest Path Algorithm** | `DSA` | `Minimum-Cost Flow` | `ALGORITHM` | Min-cost flow augmenting path | **HIGH** |
| 122 | `Bézout's Lemma` | **Bézout's Lemma** | `DSA` | `Number Theory` | `ALGORITHM` | Identity ax + by = gcd(a,b) | **HIGH** |
| 123 | `Euclidean Algorithm` | **Euclidean Algorithm** | `DSA` | `Number Theory` | `ALGORITHM` | Modulo step GCD algorithm | **HIGH** |
| 124 | `Euler's Theorem` | **Euler's Theorem** | `DSA` | `Number Theory` | `ALGORITHM` | Generalization of Fermat's Little Theorem | **HIGH** |
| 125 | `Euler's Totient Function` | **Euler's Totient Function** | `DSA` | `Number Theory` | `ALGORITHM` | Count of coprimes up to n (phi function) | **HIGH** |
| 126 | `Extended Euclidean Algorithm` | **Extended Euclidean Algorithm** | `DSA` | `Number Theory` | `ALGORITHM` | Linear Diophantine integer equation solutions | **HIGH** |
| 127 | `Fermat's Little Theorem` | **Fermat's Little Theorem** | `DSA` | `Number Theory` | `ALGORITHM` | Modular inverse under prime moduli | **HIGH** |
| 128 | `Greatest Common Divisor` | **Greatest Common Divisor** | `DSA` | `Number Theory` | `ALGORITHM` | Euclidean GCD computation | **HIGH** |
| 129 | `Least Common Multiple` | **Least Common Multiple** | `DSA` | `Number Theory` | `ALGORITHM` | LCM through GCD relations | **HIGH** |
| 130 | `Primality Test` | **Primality Test** | `DSA` | `Number Theory` | `ALGORITHM` | Deterministic & probabilistic prime testing | **HIGH** |
| 131 | `Prime Factorization` | **Prime Factorization** | `DSA` | `Number Theory` | `ALGORITHM` | Decomposition into prime products | **HIGH** |
| 132 | `Prime Number Sieve` | **Prime Number Sieve** | `DSA` | `Number Theory` | `ALGORITHM` | Sieve of Eratosthenes | **HIGH** |
| 133 | `Sieve Theory` | **Sieve Theory** | `DSA` | `Number Theory` | `ALGORITHM` | Generalized mathematical sieving | **HIGH** |
| 134 | `Monotonic Queue` | **Monotonic Queue** | `DSA` | `Queue` | `PATTERN` | Sliding window optimization queue | **HIGH** |
| 135 | `Rejection Sampling` | **Rejection Sampling** | `DSA` | `Randomized` | `ALGORITHM` | Conditional probability sampling | **HIGH** |
| 136 | `Reservoir Sampling` | **Reservoir Sampling** | `DSA` | `Randomized` | `ALGORITHM` | Uniform k-sample from unknown stream length | **HIGH** |
| 137 | `Bellman–Ford Algorithm` | **Bellman–Ford Algorithm** | `DSA` | `Shortest Path` | `ALGORITHM` | Negative cycle tolerant shortest path | **HIGH** |
| 138 | `Dijkstra's Algorithm` | **Dijkstra's Algorithm** | `DSA` | `Shortest Path` | `ALGORITHM` | Non-negative edge greedy shortest path | **HIGH** |
| 139 | `Floyd–Warshall Algorithm` | **Floyd–Warshall Algorithm** | `DSA` | `Shortest Path` | `ALGORITHM` | All-pairs shortest path dynamic programming | **HIGH** |
| 140 | `K Shortest Path` | **K Shortest Path** | `DSA` | `Shortest Path` | `ALGORITHM` | Ranked path finding (Yen's algorithm) | **HIGH** |
| 141 | `Bubble Sort` | **Bubble Sort** | `DSA` | `Sorting` | `ALGORITHM` | Adjacent swap elementary sort | **HIGH** |
| 142 | `Bucket Sort` | **Bucket Sort** | `DSA` | `Sorting` | `ALGORITHM` | Uniform interval distribution sort | **HIGH** |
| 143 | `Counting Sort` | **Counting Sort** | `DSA` | `Sorting` | `ALGORITHM` | Non-comparison integer sorting | **HIGH** |
| 144 | `Merge Sort` | **Merge Sort** | `DSA` | `Sorting` | `ALGORITHM` | Divide-and-conquer stable sorting | **HIGH** |
| 145 | `Quicksort` | **Quicksort** | `DSA` | `Sorting` | `ALGORITHM` | Partition-exchange sorting | **HIGH** |
| 146 | `Radix Sort` | **Radix Sort** | `DSA` | `Sorting` | `ALGORITHM` | Positional digit distribution sort | **HIGH** |
| 147 | `Timsort` | **Timsort** | `DSA` | `Sorting` | `ALGORITHM` | Hybrid merge and insertion sort | **HIGH** |
| 148 | `Tournament Sort` | **Tournament Sort** | `DSA` | `Sorting` | `ALGORITHM` | Tree-based selection sorting | **HIGH** |
| 149 | `Bracket Sequences` | **Bracket Sequences** | `DSA` | `Stack` | `PATTERN` | Stack-based balanced delimiter validation | **HIGH** |
| 150 | `Monotonic Stack` | **Monotonic Stack** | `DSA` | `Stack` | `PATTERN` | Algorithm pattern specializing Stack | **HIGH** |
| 151 | `Aho–Corasick Algorithm` | **Aho–Corasick Algorithm** | `DSA` | `String Matching` | `ALGORITHM` | Trie automaton multi-pattern search | **HIGH** |
| 152 | `Boyer–Moore String-Search Algorithm` | **Boyer–Moore String-Search Algorithm** | `DSA` | `String Matching` | `ALGORITHM` | Bad character & good suffix shift search | **HIGH** |
| 153 | `Knuth–Morris–Pratt Algorithm` | **Knuth–Morris–Pratt Algorithm** | `DSA` | `String Matching` | `ALGORITHM` | LPS prefix function string search | **HIGH** |
| 154 | `Rolling Hash` | **Rolling Hash** | `DSA` | `String Matching` | `ALGORITHM` | Rabin-Karp polynomial rolling hash | **HIGH** |
| 155 | `Z Algorithm` | **Z Algorithm** | `DSA` | `String Matching` | `ALGORITHM` | Prefix match box Z-array | **HIGH** |
| 156 | `Lexicographically Minimal String Rotation` | **Lexicographically Minimal String Rotation** | `DSA` | `Strings` | `ALGORITHM` | Booth's algorithm for string cycles | **HIGH** |
| 157 | `Lyndon Factorization` | **Lyndon Factorization** | `DSA` | `Strings` | `ALGORITHM` | Duval's strictly smaller suffix decomposition | **HIGH** |
| 158 | `Manacher` | **Manacher's Algorithm** | `DSA` | `Strings` | `ALGORITHM` | Linear time longest palindromic substring | **HIGH** |
| 159 | `String Matching` | **String Matching** | `DSA` | `Strings` | `ALGORITHM` | Substring search in text | **HIGH** |
| 160 | `Suffix Array` | **Suffix Array** | `DSA` | `Strings` | `ALGORITHM` | Lexicographical suffix permutations | **HIGH** |
| 161 | `Suffix Automaton` | **Suffix Automaton** | `DSA` | `Strings` | `ALGORITHM` | Minimal DFA recognizing all substrings | **HIGH** |
| 162 | `Suffix Tree` | **Suffix Tree** | `DSA` | `Strings` | `ALGORITHM` | Compressed trie of all suffixes | **HIGH** |
| 163 | `Kosaraju's Algorithm` | **Kosaraju's Algorithm** | `DSA` | `Strongly Connected Component` | `ALGORITHM` | Two-pass transpose DFS SCC discovery | **HIGH** |
| 164 | `Tarjan's SCC Algorithm` | **Tarjan's SCC Algorithm** | `DSA` | `Strongly Connected Component` | `ALGORITHM` | DFS low-link SCC discovery | **HIGH** |
| 165 | `Binary Indexed Tree` | **Binary Indexed Tree** | `DSA` | `Tree` | `ALGORITHM` | Fenwick tree prefix sum structure | **HIGH** |
| 166 | `Binary Lifting` | **Binary Lifting** | `DSA` | `Tree` | `ALGORITHM` | Power-of-two jump pointer technique | **HIGH** |
| 167 | `Binary Tree` | **Binary Tree** | `DSA` | `Tree` | `PRIMARY` | Two-child tree specialization | **HIGH** |
| 168 | `Cartesian Tree` | **Cartesian Tree** | `DSA` | `Tree` | `ALGORITHM` | Inorder heap tree representation | **HIGH** |
| 169 | `K-D Tree` | **K-D Tree** | `DSA` | `Tree` | `ALGORITHM` | Multidimensional space partitioning tree | **HIGH** |
| 170 | `Lowest Common Ancestor` | **Lowest Common Ancestor** | `DSA` | `Tree` | `ALGORITHM` | Tree ancestor queries | **HIGH** |
| 171 | `Segment Tree` | **Segment Tree** | `DSA` | `Tree` | `ALGORITHM` | Range query & point update tree | **HIGH** |
| 172 | `Splay Tree` | **Splay Tree** | `DSA` | `Tree` | `ALGORITHM` | Self-adjusting binary search tree | **HIGH** |
| 173 | `Treap` | **Treap** | `DSA` | `Tree` | `ALGORITHM` | Randomized BST + Heap hybrid | **HIGH** |
| 174 | `Trie` | **Trie** | `DSA` | `Tree` | `SECONDARY` | Prefix tree data structure | **HIGH** |
| 175 | `Floyd's Cycle Finding Algorithm` | **Floyd's Cycle Finding Algorithm** | `DSA` | `Two Pointers` | `ALGORITHM` | Tortoise and hare cycle detection | **HIGH** |
| 176 | `Sliding Window` | **Sliding Window** | `DSA` | `Two Pointers` | `PATTERN` | Subsegment window invariant pattern | **HIGH** |
| 177 | `JavaScript` | **JavaScript** | `JAVASCRIPT` | *(Root)* | `PRIMARY` | Core ECMAScript language runtime | **HIGH** |
| 178 | `Asynchronous Programming` | **Asynchronous Programming** | `JAVASCRIPT` | `JavaScript` | `PATTERN` | Async/await and microtask queue | **HIGH** |
| 179 | `Closure` | **Closures** | `JAVASCRIPT` | `JavaScript` | `PATTERN` | Lexical scoping state retention | **HIGH** |
| 180 | `Event Handling` | **Event Handling** | `JAVASCRIPT` | `JavaScript` | `PATTERN` | DOM & EventEmitter event pipelines | **HIGH** |
| 181 | `Function` | **Functions** | `JAVASCRIPT` | `JavaScript` | `SECONDARY` | First-class and higher-order functions | **HIGH** |
| 182 | `JSON` | **JSON** | `JAVASCRIPT` | `JavaScript` | `SECONDARY` | Data interchange serialization | **HIGH** |
| 183 | `Object` | **Objects** | `JAVASCRIPT` | `JavaScript` | `SECONDARY` | Keyed collections and prototypes | **HIGH** |
| 184 | `Promise` | **Promises** | `JAVASCRIPT` | `JavaScript` | `SECONDARY` | Asynchronous deferred result primitives | **HIGH** |
| 185 | `Pandas` | **Pandas** | `PANDAS` | *(Root)* | `PRIMARY` | Python Pandas data analysis library | **HIGH** |
| 186 | `Data Cleaning` | **Data Cleaning** | `PANDAS` | `Pandas` | `ALGORITHM` | Missing value imputation and deduplication | **HIGH** |
| 187 | `Data Reshaping` | **Data Reshaping** | `PANDAS` | `Pandas` | `ALGORITHM` | Pivot, melt and cross-tabulation | **HIGH** |
| 188 | `DataFrame` | **DataFrame Operations** | `PANDAS` | `Pandas` | `SECONDARY` | Tabular data frame manipulation | **HIGH** |
| 189 | `Shell` | **Shell Scripting** | `SHELL` | *(Root)* | `PRIMARY` | Bash & POSIX shell processing | **HIGH** |

---

## 3. Taxonomy Hierarchy Example (DSA Graphs)

```
DSA
└── Graph Theory
    ├── Breadth-First Search
    │   ├── 0-1 BFS
    │   └── Bidirectional Search
    ├── Depth-First Search
    ├── Shortest Path
    │   ├── Dijkstra's Algorithm
    │   ├── Bellman–Ford Algorithm
    │   ├── Floyd–Warshall Algorithm
    │   └── K Shortest Path
    ├── Minimum Spanning Tree
    │   ├── Prim's Algorithm
    │   ├── Kruskal's Algorithm
    │   └── Borůvka's Algorithm
    ├── Flow Network
    │   ├── Maximum Flow
    │   ├── Minimum Cut
    │   ├── Dinic's Algorithm
    │   └── Minimum-Cost Flow
    └── Strongly Connected Component
        ├── Tarjan's SCC Algorithm
        └── Kosaraju's Algorithm
```

---

## 4. Preservation Rule

The raw source topic is **always preserved verbatim** in `public.topics.source_topic` and `problem_import_staging.raw_topics`. Normalization applies to catalog navigation and relational indexing without altering historical provenance.