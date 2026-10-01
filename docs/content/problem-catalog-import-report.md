# VERNIQ Problem Catalog Import & Analytics Audit Report

> **Import Batch Date:** October 2026  
> **Dataset Source:** `data/problems/raw/verniq_all_3392_with_topics.csv`  
> **Source Digest (SHA-256):** `c1f92edbf0d78adf7f32c7d141555e72894d6c7fa7f028baedd72245cf6f4f84`  
> **Pipeline Engine:** `backend/importer/importer.py` (Phase 3 Execution)

---

## 1. Executive Summary & Verification Metrics

| Metric | Measured Value | Target / Requirement | Status |
|:---|:---:|:---:|:---:|
| **Total Source Records** | **3,392** | 3,392 | ✅ 100% Parity |
| **Unique Verniq IDs** | **3,392** | 3,392 | ✅ Zero Duplicates |
| **Duplicate IDs** | **0** | 0 | ✅ Zero Collision |
| **Duplicate Titles** | **0** | 0 | ✅ Zero Collision |
| **Missing Titles** | **0** | 0 | ✅ Clean Integrity |
| **Missing Difficulty** | **0** | 0 | ✅ Clean Integrity |
| **Missing Topics** | **0** | 0 | ✅ Clean Integrity |
| **Invalid Difficulty Values** | **0** | 0 | ✅ 100% Conformance |
| **Malformed Rows** | **0** | 0 | ✅ RFC 4180 Compliant |
| **Staged Ingestion Audit Rows** | **3,392** | 3,392 | ✅ Full Traceability |
| **Source Provenance Rows** | **3,392** | 3,392 | ✅ Audit Recorded |
| **Hierarchical Normalized Topics** | **187** | 187 (from 189 raw) | ✅ Taxonomy Mapped |
| **Problem-Topic Junctions** | **11,339** | ~11,000 | ✅ Multi-Topic Relational |

---

## 2. Problem Status & Review Governance

Every imported record is strictly quarantined in `DRAFT / CONTENT_REVIEW`. No third-party problem is published automatically without verified editorial, test cases, and judge validation.

| Workflow Status | Published Flag | Count | Operational Role |
|:---|:---:|:---:|:---|
| **`DRAFT`** | `False` | **3,386** | Catalog index records pending statement/editorial review |
| **`PUBLISHED`** | `True` | **6** | Canonical Seed Problems with verified judge test vectors |

---

## 3. Difficulty Distribution

| Difficulty Tier | Total Problems | Percentage |
|:---|:---:|:---:|
| **Medium** | **1,803** | 53.2% |
| **Easy** | **815** | 24.0% |
| **Hard** | **774** | 22.8% |

---

## 4. Engineering Domain Classification

Problems are deterministically segregated into top-level engineering domains to ensure language and ecosystem specialization:

| Domain | Slug | Total Problems | Percentage | Precedence Classification Rules |
|:---|:---:|:---:|:---:|:---|
| **DSA** | `dsa` | **3,145** | 92.7% | Data Structures & Algorithms: core computational complexity, discrete math, and invariants. |
| **Database** | `database` | **194** | 5.7% | Relational Databases: SQL queries, aggregation, joins, subqueries, and window functions. |
| **JavaScript** | `javascript` | **32** | 0.9% | Modern ECMAScript: event loop, promises, closures, prototypes, and asynchronous execution. |
| **Pandas** | `pandas` | **10** | 0.3% | Data Science & Analysis: DataFrame operations, reshaping, indexing, and tabular filtering. |
| **Concurrency** | `concurrency` | **7** | 0.2% | Multithreading & Synchronization: mutexes, semaphores, barriers, and atomic primitives. |
| **Shell** | `shell` | **4** | 0.1% | Unix & Bash: stream processing, sed/awk, pipelines, and operating system utilities. |

---

## 5. Metadata Field Audit: `companies` & `records`

> ### ⚠️ Strict Provenance Compliance Notice
> - **`companies` Field**: 3,392 records preserved verbatim in `problem_import_staging.raw_companies` and `problems.metadata`. Marked: **`COMPANY_METADATA_REQUIRES_MAPPING`**. Zero company relationships were fabricated.
> - **`records` Field**: 3,392 records preserved verbatim in `problem_import_staging.raw_records` and `problems.metadata`. Marked: **`SEMANTICS_UNCONFIRMED`**. No frequency, popularity, or interview weightings were inferred.

---

## 6. Comprehensive Topic Taxonomy & Problem Distribution

Total unique normalized topics: **187** (from 189 distinct source labels).

| # | Topic Name | Slug | Domain | Associated Problems |
|:---:|:---|:---|:---:|:---:|
| 1 | **Arrays** | `arrays` | `DSA` | **1,938** |
| 2 | **Strings** | `strings` | `DSA` | **785** |
| 3 | **Hash Table** | `hash-table` | `DSA` | **742** |
| 4 | **Math** | `math` | `DSA` | **588** |
| 5 | **Dynamic Programming** | `dynamic-programming` | `DSA` | **584** |
| 6 | **Sorting** | `sorting` | `DSA` | **484** |
| 7 | **Greedy** | `greedy` | `DSA` | **428** |
| 8 | **Depth-First Search** | `depth-first-search` | `DSA` | **321** |
| 9 | **Binary Search** | `binary-search` | `DSA` | **307** |
| 10 | **Matrix** | `matrix` | `DSA` | **255** |
| 11 | **Breadth-First Search** | `breadth-first-search` | `DSA` | **248** |
| 12 | **Bit Manipulation** | `bit-manipulation` | `DSA` | **244** |
| 13 | **Tree** | `tree` | `DSA` | **238** |
| 14 | **Prefix Sum** | `prefix-sum` | `DSA` | **225** |
| 15 | **Two Pointers** | `two-pointers` | `DSA` | **225** |
| 16 | **Heap (Priority Queue)** | `heap-priority-queue` | `DSA` | **202** |
| 17 | **Database Queries** | `database-queries` | `Database` | **194** |
| 18 | **Counting** | `counting` | `DSA` | **182** |
| 19 | **Simulation** | `simulation` | `DSA` | **182** |
| 20 | **Stack** | `stack` | `DSA` | **170** |
| 21 | **Binary Tree** | `binary-tree` | `DSA` | **169** |
| 22 | **Graph Theory** | `graph-theory` | `DSA` | **168** |
| 23 | **Sliding Window** | `sliding-window` | `DSA` | **148** |
| 24 | **System & Class Design** | `system-and-class-design` | `Design` | **134** |
| 25 | **Enumeration** | `enumeration` | `DSA` | **119** |
| 26 | **Backtracking** | `backtracking` | `DSA` | **108** |
| 27 | **Union-Find** | `union-find` | `DSA` | **92** |
| 28 | **Number Theory** | `number-theory` | `DSA` | **79** |
| 29 | **Linked List** | `linked-list` | `DSA` | **75** |
| 30 | **Segment Tree** | `segment-tree` | `DSA` | **70** |
| 31 | **Monotonic Stack** | `monotonic-stack` | `DSA` | **69** |
| 32 | **Ordered Set** | `ordered-set` | `DSA` | **69** |
| 33 | **Divide and Conquer** | `divide-and-conquer` | `DSA` | **56** |
| 34 | **Trie** | `trie` | `DSA` | **56** |
| 35 | **Combinatorics** | `combinatorics` | `DSA` | **51** |
| 36 | **Queue** | `queue` | `DSA` | **50** |
| 37 | **Recursion** | `recursion` | `DSA` | **50** |
| 38 | **Bitmask** | `bitmask` | `DSA` | **48** |
| 39 | **Geometry** | `geometry` | `DSA` | **42** |
| 40 | **Binary Search Tree** | `binary-search-tree` | `DSA` | **40** |
| 41 | **Memoization** | `memoization` | `DSA` | **40** |
| 42 | **Binary Indexed Tree** | `binary-indexed-tree` | `DSA` | **39** |
| 43 | **Hash Function** | `hash-function` | `DSA` | **39** |
| 44 | **Topological Sort** | `topological-sort` | `DSA` | **38** |
| 45 | **Shortest Path** | `shortest-path` | `DSA` | **36** |
| 46 | **String Matching** | `string-matching` | `DSA` | **35** |
| 47 | **JavaScript** | `javascript` | `JavaScript` | **32** |
| 48 | **DP on Trees** | `dp-on-trees` | `DSA` | **30** |
| 49 | **Rolling Hash** | `rolling-hash` | `DSA` | **29** |
| 50 | **Game Theory** | `game-theory` | `DSA` | **27** |
| 51 | **Data Stream** | `data-stream` | `DSA` | **24** |
| 52 | **Interactive** | `interactive` | `DSA` | **23** |
| 53 | **Greatest Common Divisor** | `greatest-common-divisor` | `DSA` | **22** |
| 54 | **Euclidean Algorithm** | `euclidean-algorithm` | `DSA` | **20** |
| 55 | **Brainteaser** | `brainteaser` | `DSA` | **18** |
| 56 | **Monotonic Queue** | `monotonic-queue` | `DSA` | **18** |
| 57 | **Directed Acyclic Graph** | `directed-acyclic-graph` | `DSA` | **17** |
| 58 | **Dijkstra's Algorithm** | `dijkstras-algorithm` | `DSA` | **16** |
| 59 | **Bracket Sequences** | `bracket-sequences` | `DSA` | **15** |
| 60 | **Knapsack Problem** | `knapsack-problem` | `DSA` | **15** |
| 61 | **Minimax** | `minimax` | `DSA` | **15** |
| 62 | **Doubly-Linked List** | `doubly-linked-list` | `DSA` | **13** |
| 63 | **Merge Sort** | `merge-sort` | `DSA` | **13** |
| 64 | **Binary Lifting** | `binary-lifting` | `DSA` | **12** |
| 65 | **Functions** | `functions` | `JavaScript` | **12** |
| 66 | **Prime Factorization** | `prime-factorization` | `DSA` | **12** |
| 67 | **Randomized** | `randomized` | `DSA` | **12** |
| 68 | **Lowest Common Ancestor** | `lowest-common-ancestor` | `DSA` | **11** |
| 69 | **Z Algorithm** | `z-algorithm` | `DSA` | **11** |
| 70 | **Zero-Sum Game** | `zero-sum-game` | `DSA` | **11** |
| 71 | **Bipartite Graph** | `bipartite-graph` | `DSA` | **10** |
| 72 | **Counting Sort** | `counting-sort` | `DSA` | **10** |
| 73 | **DataFrame Operations** | `dataframe-operations` | `Pandas` | **10** |
| 74 | **Fermat's Little Theorem** | `fermats-little-theorem` | `DSA` | **10** |
| 75 | **Knuth–Morris–Pratt Algorithm** | `knuth-morris-pratt-algorithm` | `DSA` | **10** |
| 76 | **Longest Increasing Subsequence** | `longest-increasing-subsequence` | `DSA` | **10** |
| 77 | **Pandas** | `pandas` | `Pandas` | **10** |
| 78 | **Iterators** | `iterators` | `Design` | **9** |
| 79 | **Sieve Theory** | `sieve-theory` | `DSA` | **9** |
| 80 | **Sweep Line** | `sweep-line` | `DSA` | **9** |
| 81 | **0-1 Knapsack** | `0-1-knapsack` | `DSA` | **8** |
| 82 | **Polygons** | `polygons` | `DSA` | **8** |
| 83 | **Primality Test** | `primality-test` | `DSA` | **8** |
| 84 | **Asynchronous Programming** | `asynchronous-programming` | `JavaScript` | **7** |
| 85 | **Bidirectional Search** | `bidirectional-search` | `DSA` | **7** |
| 86 | **Concurrency** | `concurrency` | `Concurrency` | **7** |
| 87 | **Flow Network** | `flow-network` | `DSA` | **7** |
| 88 | **Quickselect** | `quickselect` | `DSA` | **7** |
| 89 | **Suffix Array** | `suffix-array` | `DSA` | **7** |
| 90 | **Boyer–Moore String-Search Algorithm** | `boyer-moore-string-search-algorithm` | `DSA` | **6** |
| 91 | **Bucket Sort** | `bucket-sort` | `DSA` | **6** |
| 92 | **Floyd's Cycle Finding Algorithm** | `floyds-cycle-finding-algorithm` | `DSA` | **6** |
| 93 | **Least Common Multiple** | `least-common-multiple` | `DSA` | **6** |
| 94 | **Longest Common Subsequence** | `longest-common-subsequence` | `DSA` | **6** |
| 95 | **Matching (Graph)** | `matching-graph` | `DSA` | **6** |
| 96 | **Minimum Spanning Tree** | `minimum-spanning-tree` | `DSA` | **6** |
| 97 | **Prime Number Sieve** | `prime-number-sieve` | `DSA` | **6** |
| 98 | **Probability and Statistics** | `probability-and-statistics` | `DSA` | **6** |
| 99 | **Promises** | `promises` | `JavaScript` | **6** |
| 100 | **Quicksort** | `quicksort` | `DSA` | **6** |
| 101 | **Sqrt Decomposition** | `sqrt-decomposition` | `DSA` | **6** |
| 102 | **Treap** | `treap` | `DSA` | **6** |
| 103 | **A* Search** | `a-star-search` | `DSA` | **5** |
| 104 | **Cartesian Tree** | `cartesian-tree` | `DSA` | **5** |
| 105 | **Complete Knapsack** | `complete-knapsack` | `DSA` | **5** |
| 106 | **Graph Coloring** | `graph-coloring` | `DSA` | **5** |
| 107 | **Heuristic Search** | `heuristic-search` | `DSA` | **5** |
| 108 | **Kosaraju's Algorithm** | `kosarajus-algorithm` | `DSA` | **5** |
| 109 | **Pigeonhole Principle** | `pigeonhole-principle` | `DSA` | **5** |
| 110 | **Successive Shortest Path Algorithm** | `successive-shortest-path-algorithm` | `DSA` | **5** |
| 111 | **Tarjan's SCC Algorithm** | `tarjans-scc-algorithm` | `DSA` | **5** |
| 112 | **Aho–Corasick Algorithm** | `aho-corasick-algorithm` | `DSA` | **4** |
| 113 | **Boyer–Moore Majority Vote Algorithm** | `boyer-moore-majority-vote-algorithm` | `DSA` | **4** |
| 114 | **Bubble Sort** | `bubble-sort` | `DSA` | **4** |
| 115 | **Hungarian Algorithm** | `hungarian-algorithm` | `DSA` | **4** |
| 116 | **Impartial Game** | `impartial-game` | `DSA` | **4** |
| 117 | **Meet in the Middle** | `meet-in-the-middle` | `DSA` | **4** |
| 118 | **Reservoir Sampling** | `reservoir-sampling` | `DSA` | **4** |
| 119 | **Shell Scripting** | `shell-scripting` | `Shell` | **4** |
| 120 | **Suffix Automaton** | `suffix-automaton` | `DSA` | **4** |
| 121 | **Suffix Tree** | `suffix-tree` | `DSA` | **4** |
| 122 | **Algorithm X** | `algorithm-x` | `DSA` | **3** |
| 123 | **Borůvka's Algorithm** | `boruvkas-algorithm` | `DSA` | **3** |
| 124 | **Closures** | `closures` | `JavaScript` | **3** |
| 125 | **Data Reshaping** | `data-reshaping` | `Pandas` | **3** |
| 126 | **Dinic's Algorithm** | `dinics-algorithm` | `DSA` | **3** |
| 127 | **Edmonds–Karp Algorithm** | `edmonds-karp-algorithm` | `DSA` | **3** |
| 128 | **Eulerian Circuit** | `eulerian-circuit` | `DSA` | **3** |
| 129 | **Eulerian Path** | `eulerian-path` | `DSA` | **3** |
| 130 | **Inclusion-Exclusion Principle** | `inclusion-exclusion-principle` | `DSA` | **3** |
| 131 | **Kruskal's Algorithm** | `kruskals-algorithm` | `DSA` | **3** |
| 132 | **Linear Algebra** | `linear-algebra` | `DSA` | **3** |
| 133 | **Minimum-Cost Flow** | `minimum-cost-flow` | `DSA` | **3** |
| 134 | **MPM Algorithm** | `mpm-algorithm` | `DSA` | **3** |
| 135 | **Nim Game** | `nim-game` | `DSA` | **3** |
| 136 | **Object-Oriented Programming** | `object-oriented-programming` | `Design` | **3** |
| 137 | **Prim's Algorithm** | `prims-algorithm` | `DSA` | **3** |
| 138 | **Push-Relabel Algorithm** | `push-relabel-algorithm` | `DSA` | **3** |
| 139 | **Radix Sort** | `radix-sort` | `DSA` | **3** |
| 140 | **Sprague–Grundy Theorem** | `sprague-grundy-theorem` | `DSA` | **3** |
| 141 | **0-1 BFS** | `0-1-bfs` | `DSA` | **2** |
| 142 | **Bellman–Ford Algorithm** | `bellman-ford-algorithm` | `DSA` | **2** |
| 143 | **Bézout's Lemma** | `bezouts-lemma` | `DSA` | **2** |
| 144 | **Brute-Force Search** | `brute-force-search` | `DSA` | **2** |
| 145 | **Data Cleaning** | `data-cleaning` | `Pandas` | **2** |
| 146 | **Extended Euclidean Algorithm** | `extended-euclidean-algorithm` | `DSA` | **2** |
| 147 | **Floyd–Warshall Algorithm** | `floyd-warshall-algorithm` | `DSA` | **2** |
| 148 | **Hamiltonian Path** | `hamiltonian-path` | `DSA` | **2** |
| 149 | **JSON** | `json` | `JavaScript` | **2** |
| 150 | **Manacher's Algorithm** | `manachers-algorithm` | `DSA` | **2** |
| 151 | **Maximum Flow** | `maximum-flow` | `DSA` | **2** |
| 152 | **Maximum Matching** | `maximum-matching` | `DSA` | **2** |
| 153 | **Objects** | `objects` | `JavaScript` | **2** |
| 154 | **Perfect Matching** | `perfect-matching` | `DSA` | **2** |
| 155 | **Range Minimum/Maximum Query** | `range-minimum-maximum-query` | `DSA` | **2** |
| 156 | **Rejection Sampling** | `rejection-sampling` | `DSA` | **2** |
| 157 | **Semi-Eulerian Graph** | `semi-eulerian-graph` | `DSA` | **2** |
| 158 | **Strongly Connected Component** | `strongly-connected-component` | `DSA` | **2** |
| 159 | **Ternary Search** | `ternary-search` | `DSA` | **2** |
| 160 | **Articulation Point** | `articulation-point` | `DSA` | **1** |
| 161 | **Biconnected Component** | `biconnected-component` | `DSA` | **1** |
| 162 | **Bridge (Graph)** | `bridge-graph` | `DSA` | **1** |
| 163 | **Convex Hull** | `convex-hull` | `DSA` | **1** |
| 164 | **Dancing Links** | `dancing-links` | `DSA` | **1** |
| 165 | **Euler's Theorem** | `eulers-theorem` | `DSA` | **1** |
| 166 | **Euler's Totient Function** | `eulers-totient-function` | `DSA` | **1** |
| 167 | **Eulerian Graph** | `eulerian-graph` | `DSA` | **1** |
| 168 | **Event Handling** | `event-handling` | `JavaScript` | **1** |
| 169 | **Intervals** | `intervals` | `DSA` | **1** |
| 170 | **K Shortest Path** | `k-shortest-path` | `DSA` | **1** |
| 171 | **K-D Tree** | `k-d-tree` | `DSA` | **1** |
| 172 | **Lexicographically Minimal String Rotation** | `lexicographically-minimal-string-rotation` | `DSA` | **1** |
| 173 | **Lyndon Factorization** | `lyndon-factorization` | `DSA` | **1** |
| 174 | **Minimum Cut** | `minimum-cut` | `DSA` | **1** |
| 175 | **Minimum Enclosing Circle** | `minimum-enclosing-circle` | `DSA` | **1** |
| 176 | **Mixed Knapsack** | `mixed-knapsack` | `DSA` | **1** |
| 177 | **Multiple Knapsack** | `multiple-knapsack` | `DSA` | **1** |
| 178 | **Nearest Pair of Points** | `nearest-pair-of-points` | `DSA` | **1** |
| 179 | **Newton's Method** | `newtons-method` | `DSA` | **1** |
| 180 | **Persistent Data Structure** | `persistent-data-structure` | `DSA` | **1** |
| 181 | **Planar Graph** | `planar-graph` | `DSA` | **1** |
| 182 | **Sparse Table** | `sparse-table` | `DSA` | **1** |
| 183 | **Splay Tree** | `splay-tree` | `DSA` | **1** |
| 184 | **Subsequence** | `subsequence` | `DSA` | **1** |
| 185 | **Timsort** | `timsort` | `DSA` | **1** |
| 186 | **Tournament Sort** | `tournament-sort` | `DSA` | **1** |
| 187 | **Triangulation** | `triangulation` | `DSA` | **1** |