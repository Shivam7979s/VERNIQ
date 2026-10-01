"""
VERNIQ Phase 4.1 Pilot Authoring Specifications
================================================
Original engineering specifications for the 20 approved pilot problems:
- Independent pedagogical narrative
- Explicit mathematical and computational constraints
- Comprehensive input and output formatting
- Multi-language starter code (C++, Python, Java, TypeScript, Go)
- Edge case inventory and progressive Socratic hints
"""

from typing import Dict, Any, List

PILOT_SPECS: Dict[str, Dict[str, Any]] = {
    # -------------------------------------------------------------
    # 1. VRQ-000002: LRU Cache (Medium)
    # -------------------------------------------------------------
    "VRQ-000002": {
        "verniq_id": "VRQ-000002",
        "slug": "lru-cache",
        "title": "LRU Cache",
        "difficulty": "medium",
        "domain": "DSA",
        "topics": ["Doubly-Linked List", "Hash Table", "System & Class Design"],
        "method_name": "LRUCache",
        "description_markdown": """Design an in-memory data structure that follows the operational constraints of a **Least Recently Used (LRU) Cache**.

Implement the `LRUCache` class:
- `LRUCache(int capacity)`: Initialize the cache with a positive integer capacity `capacity`.
- `int get(int key)`: Return the integer value associated with `key` if it exists in the cache, otherwise return `-1`. Accessing an existing key marks it as the most recently accessed.
- `void put(int key, int value)`: Insert or update the value of `key`. If `key` exists, update its value and promote it to the most recently used position. If `key` does not exist, insert the key-value pair. If the insertion causes the cache to exceed `capacity`, evict the least recently used key prior to insertion.

### Complexity Requirement
Both `get` and `put` operations must run in strictly amortized **$O(1)$ time complexity**.

### Example 1
```text
Input:
["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]
[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]

Output:
[null, null, null, 1, null, -1, null, -1, 3, 4]

Explanation:
LRUCache lRUCache = new LRUCache(2);
lRUCache.put(1, 1); // cache: {1=1}
lRUCache.put(2, 2); // cache: {1=1, 2=2}
lRUCache.get(1);    // returns 1, promotes 1 -> cache: {2=2, 1=1}
lRUCache.put(3, 3); // evicts key 2 -> cache: {1=1, 3=3}
lRUCache.get(2);    // returns -1 (evicted)
lRUCache.put(4, 4); // evicts key 1 -> cache: {3=3, 4=4}
lRUCache.get(1);    // returns -1 (evicted)
lRUCache.get(3);    // returns 3 -> cache: {4=4, 3=3}
lRUCache.get(4);    // returns 4 -> cache: {3=3, 4=4}
```""",
        "input_format": "First array defines method calls. Second array defines the corresponding argument tuples for each call.",
        "output_format": "An array of responses where constructor and put return null, and get returns the key value or -1.",
        "constraints_markdown": """- `1 <= capacity <= 3000`
- `0 <= key <= 10^4`
- `0 <= value <= 10^5`
- At most `2 * 10^5` cumulative calls will be made to `get` and `put`.""",
        "edge_cases": [
            "Cache with capacity 1 undergoing frequent evictions",
            "Repeated put operations on the same key updating value without altering cache size",
            "Retrieving non-existent keys repeatedly",
            "Access sequence where every get promotes an element right before an eviction"
        ],
        "hints": [
            "To achieve O(1) key lookup, a hash map is essential.",
            "To achieve O(1) eviction and node reordering, a doubly-linked list with sentinel head and tail nodes allows constant-time detachment and insertion."
        ],
        "starter_templates": {
            "python": "class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n\n    def get(self, key: int) -> int:\n        return -1\n\n    def put(self, key: int, value: int) -> None:\n        pass",
            "cpp": "#include <unordered_map>\n\nclass LRUCache {\npublic:\n    LRUCache(int capacity) {\n    }\n    \n    int get(int key) {\n        return -1;\n    }\n    \n    void put(int key, int value) {\n    }\n};",
            "java": "import java.util.*;\n\nclass LRUCache {\n    public LRUCache(int capacity) {\n    }\n    \n    public int get(int key) {\n        return -1;\n    }\n    \n    public void put(int key, int value) {\n    }\n}",
            "typescript": "class LRUCache {\n    constructor(capacity: number) {\n    }\n\n    get(key: number): number {\n        return -1;\n    }\n\n    put(key: number, value: number): void {\n    }\n}",
            "go": "package main\n\ntype LRUCache struct {\n}\n\nfunc Constructor(capacity int) LRUCache {\n    return LRUCache{}\n}\n\nfunc (this *LRUCache) Get(key int) int {\n    return -1\n}\n\nfunc (this *LRUCache) Put(key int, value int) {\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 2. VRQ-000003: Merge Intervals (Medium)
    # -------------------------------------------------------------
    "VRQ-000003": {
        "verniq_id": "VRQ-000003",
        "slug": "merge-intervals",
        "title": "Merge Intervals",
        "difficulty": "medium",
        "domain": "DSA",
        "topics": ["Arrays", "Sorting"],
        "method_name": "merge",
        "description_markdown": """You are given an array of closed intervals `intervals` where `intervals[i] = [start_i, end_i]`. 

Merge all overlapping intervals and return *an array of the non-overlapping intervals that cover all the intervals in the input*.

Two intervals `[a, b]` and `[c, d]` overlap if `max(a, c) <= min(b, d)`. Adjacent intervals that touch at a single point (such as `[1, 4]` and `[4, 5]`) are considered overlapping and must be merged into `[1, 5]`.

### Example 1
```text
Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
Explanation: Intervals [1,3] and [2,6] overlap, merging into [1,6].
```

### Example 2
```text
Input: intervals = [[1,4],[4,5]]
Output: [[1,5]]
Explanation: Intervals [1,4] and [4,5] touch at boundary 4, merging into [1,5].
```""",
        "input_format": "A 2D array of integers intervals where each element is an array [start, end].",
        "output_format": "A 2D array of merged non-overlapping intervals, sorted in ascending order of start time.",
        "constraints_markdown": """- `1 <= intervals.length <= 10^4`
- `intervals[i].length == 2`
- `0 <= start_i <= end_i <= 10^4`""",
        "edge_cases": [
            "Single interval in input",
            "Intervals completely contained within a larger interval (e.g. [[1,10],[2,3],[4,8]])",
            "Identical intervals",
            "No intervals overlap"
        ],
        "hints": [
            "Sorting intervals by their starting coordinate simplifies the problem to a single linear scan.",
            "Maintain an active interval: if the next interval's start is <= current end, extend the end time."
        ],
        "starter_templates": {
            "python": "from typing import List\n\nclass Solution:\n    def merge(self, intervals: List[List[int]]) -> List[List[int]]:\n        return []",
            "cpp": "#include <vector>\n\nclass Solution {\npublic:\n    std::vector<std::vector<int>> merge(std::vector<std::vector<int>>& intervals) {\n        return {};\n    }\n};",
            "java": "import java.util.*;\n\nclass Solution {\n    public int[][] merge(int[][] intervals) {\n        return new int[0][0];\n    }\n}",
            "typescript": "function merge(intervals: number[][]): number[][] {\n    return [];\n}",
            "go": "package main\n\nfunc merge(intervals [][]int) [][]int {\n    return nil\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 3. VRQ-000004: Valid Parentheses (Easy)
    # -------------------------------------------------------------
    "VRQ-000004": {
        "verniq_id": "VRQ-000004",
        "slug": "valid-parentheses",
        "title": "Valid Parentheses",
        "difficulty": "easy",
        "domain": "DSA",
        "topics": ["Stack", "Strings", "Bracket Sequences"],
        "method_name": "isValid",
        "description_markdown": """Given a string `s` containing only the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.

An input string is valid if and only if:
1. Open brackets must be closed by the same type of closing bracket.
2. Open brackets must be closed in the exact correct order.
3. Every closing bracket has a corresponding preceding open bracket of the same type.

### Example 1
```text
Input: s = "()"
Output: true
```

### Example 2
```text
Input: s = "()[]{}"
Output: true
```

### Example 3
```text
Input: s = "(]"
Output: false
```""",
        "input_format": "A single string s consisting only of bracket characters.",
        "output_format": "Boolean true if s is a valid bracket sequence, false otherwise.",
        "constraints_markdown": """- `1 <= s.length <= 10^4`
- `s` consists solely of parentheses characters `'()[]{}'`.""",
        "edge_cases": [
            "Odd length strings (immediately false)",
            "Single character strings",
            "Starts with closing bracket",
            "Nested valid structures like ((({[]})))",
            "Interleaved invalid structures like ([)]"
        ],
        "hints": [
            "A Last-In-First-Out (LIFO) stack matches the most recently opened bracket with the current closing bracket.",
            "If encountering a closing bracket when the stack is empty, the sequence is immediately invalid."
        ],
        "starter_templates": {
            "python": "class Solution:\n    def isValid(self, s: str) -> bool:\n        return False",
            "cpp": "#include <string>\n\nclass Solution {\npublic:\n    bool isValid(std::string s) {\n        return false;\n    }\n};",
            "java": "class Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}",
            "typescript": "function isValid(s: string): boolean {\n    return false;\n}",
            "go": "package main\n\nfunc isValid(s string) bool {\n    return false\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 4. VRQ-000005: Longest Substring Without Repeating Characters (Medium)
    # -------------------------------------------------------------
    "VRQ-000005": {
        "verniq_id": "VRQ-000005",
        "slug": "longest-substring-without-repeating-characters",
        "title": "Longest Substring Without Repeating Characters",
        "difficulty": "medium",
        "domain": "DSA",
        "topics": ["Sliding Window", "Hash Table", "Strings"],
        "method_name": "lengthOfLongestSubstring",
        "description_markdown": """Given a string `s`, calculate the length of the **longest contiguous substring** that contains no duplicate characters.

A substring is defined as a contiguous sequence of characters within a string.

### Example 1
```text
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with a length of 3.
```

### Example 2
```text
Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with a length of 1.
```

### Example 3
```text
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with a length of 3. Notice that "pwke" is a subsequence, not a contiguous substring.
```""",
        "input_format": "A single string s.",
        "output_format": "An integer representing the length of the longest duplicate-free substring.",
        "constraints_markdown": """- `0 <= s.length <= 5 * 10^4`
- `s` consists of English letters, digits, symbols and spaces.""",
        "edge_cases": [
            "Empty string s = \"\"",
            "Single character string",
            "String of identical repeated characters",
            "String where all characters are distinct"
        ],
        "hints": [
            "Use a sliding window with left and right pointers.",
            "Store the last seen index of each character in a hash map to advance the left pointer in O(1)."
        ],
        "starter_templates": {
            "python": "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        return 0",
            "cpp": "#include <string>\n\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(std::string s) {\n        return 0;\n    }\n};",
            "java": "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}",
            "typescript": "function lengthOfLongestSubstring(s: string): number {\n    return 0;\n}",
            "go": "package main\n\nfunc lengthOfLongestSubstring(s string) int {\n    return 0\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 5. VRQ-000007: Number of Islands (Medium)
    # -------------------------------------------------------------
    "VRQ-000007": {
        "verniq_id": "VRQ-000007",
        "slug": "number-of-islands",
        "title": "Number of Islands",
        "difficulty": "medium",
        "domain": "DSA",
        "topics": ["Graph Theory", "Breadth-First Search", "Depth-First Search", "Matrix"],
        "method_name": "numIslands",
        "description_markdown": """Given an `m x n` 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), return *the number of islands*.

An **island** is surrounded by water and is formed by connecting adjacent land cells horizontally or vertically (diagonal cells are not connected). You may assume all four edges of the grid are completely surrounded by water.

### Example 1
```text
Input: grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]
Output: 1
```

### Example 2
```text
Input: grid = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]
Output: 3
```""",
        "input_format": "A 2D array grid of size m x n containing character strings '1' and '0'.",
        "output_format": "An integer representing the total count of connected land components.",
        "constraints_markdown": """- `m == grid.length`
- `n == grid[i].length`
- `1 <= m, n <= 300`
- `grid[i][j]` is either `'0'` or `'1'`.""",
        "edge_cases": [
            "Grid consisting entirely of '0's (water)",
            "Grid consisting entirely of '1's (one giant island)",
            "1x1 grid",
            "Checkerboard pattern where 1s only touch diagonally"
        ],
        "hints": [
            "Iterate through each cell. When an unvisited '1' is encountered, trigger BFS or DFS to sink all connected land cells and increment the count.",
            "You can mark visited cells in-place by changing '1' to '0' to avoid extra memory."
        ],
        "starter_templates": {
            "python": "from typing import List\n\nclass Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        return 0",
            "cpp": "#include <vector>\n\nclass Solution {\npublic:\n    int numIslands(std::vector<std::vector<char>>& grid) {\n        return 0;\n    }\n};",
            "java": "class Solution {\n    public int numIslands(char[][] grid) {\n        return 0;\n    }\n}",
            "typescript": "function numIslands(grid: string[][]): number {\n    return 0;\n}",
            "go": "package main\n\nfunc numIslands(grid [][]byte) int {\n    return 0\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 6. VRQ-000011: Maximum Subarray (Medium)
    # -------------------------------------------------------------
    "VRQ-000011": {
        "verniq_id": "VRQ-000011",
        "slug": "maximum-subarray",
        "title": "Maximum Subarray",
        "difficulty": "medium",
        "domain": "DSA",
        "topics": ["Dynamic Programming", "Arrays", "Divide and Conquer"],
        "method_name": "maxSubArray",
        "description_markdown": """Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the **largest sum** and return *its sum*.

A subarray is a contiguous non-empty sequence of elements within an array.

### Example 1
```text
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.
```

### Example 2
```text
Input: nums = [1]
Output: 1
Explanation: The subarray [1] has the largest sum 1.
```

### Example 3
```text
Input: nums = [5,4,-1,7,8]
Output: 23
Explanation: The subarray [5,4,-1,7,8] has the largest sum 23.
```""",
        "input_format": "A 1D array of integers nums.",
        "output_format": "An integer representing the maximum contiguous subarray sum.",
        "constraints_markdown": """- `1 <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`""",
        "edge_cases": [
            "Array with a single negative element",
            "Array with all negative numbers (result is max single element)",
            "Array with all positive numbers (result is sum of entire array)",
            "Large array with alternating positive and negative values"
        ],
        "hints": [
            "Kadane's Algorithm maintains current running sum: current = max(nums[i], current + nums[i]).",
            "Track global maximum across all step evaluations."
        ],
        "starter_templates": {
            "python": "from typing import List\n\nclass Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        return 0",
            "cpp": "#include <vector>\n\nclass Solution {\npublic:\n    int maxSubArray(std::vector<int>& nums) {\n        return 0;\n    }\n};",
            "java": "class Solution {\n    public int maxSubArray(int[] nums) {\n        return 0;\n    }\n}",
            "typescript": "function maxSubArray(nums: number[]): number {\n    return 0;\n}",
            "go": "package main\n\nfunc maxSubArray(nums []int) int {\n    return 0\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 7. VRQ-000019: Merge k Sorted Lists (Hard)
    # -------------------------------------------------------------
    "VRQ-000019": {
        "verniq_id": "VRQ-000019",
        "slug": "merge-k-sorted-lists",
        "title": "Merge k Sorted Lists",
        "difficulty": "hard",
        "domain": "DSA",
        "topics": ["Linked List", "Heap (Priority Queue)", "Divide and Conquer"],
        "method_name": "mergeKLists",
        "description_markdown": """You are given an array of `k` linked-lists `lists`, where each linked-list is sorted in ascending order.

Merge all the linked-lists into one sorted linked-list and return its head.

### Example 1
```text
Input: lists = [[1,4,5],[1,3,4],[2,6]]
Output: [1,1,2,3,4,4,5,6]
Explanation: The linked-lists are:
[
  1->4->5,
  1->3->4,
  2->6
]
merging them into one sorted list:
1->1->2->3->4->4->5->6
```

### Example 2
```text
Input: lists = []
Output: []
```

### Example 3
```text
Input: lists = [[]]
Output: []
```""",
        "input_format": "An array of sorted linked lists lists.",
        "output_format": "A single merged sorted linked list represented as an array.",
        "constraints_markdown": """- `k == lists.length`
- `0 <= k <= 10^4`
- `0 <= lists[i].length <= 500`
- `-10^4 <= lists[i][j] <= 10^4`
- `lists[i]` is sorted in ascending order.
- The total sum of `lists[i].length` will not exceed `10^4`.""",
        "edge_cases": [
            "Empty outer list k = 0",
            "Outer list containing only empty inner lists [[], []]",
            "Single list k = 1",
            "k large with many small lists vs small k with long lists"
        ],
        "hints": [
            "A min-heap / priority queue storing the head of each list yields O(N log k) total time.",
            "Alternatively, pairwise divide-and-conquer merge achieves identical O(N log k) without heap overhead."
        ],
        "starter_templates": {
            "python": "from typing import List, Optional\n\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\nclass Solution:\n    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:\n        return None",
            "cpp": "#include <vector>\n\nstruct ListNode {\n    int val;\n    ListNode *next;\n    ListNode() : val(0), next(nullptr) {}\n    ListNode(int x) : val(x), next(nullptr) {}\n};\n\nclass Solution {\npublic:\n    ListNode* mergeKLists(std::vector<ListNode*>& lists) {\n        return nullptr;\n    }\n};",
            "java": "class ListNode {\n    int val;\n    ListNode next;\n    ListNode(int val) { this.val = val; }\n}\n\nclass Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        return null;\n    }\n}",
            "typescript": "class ListNode {\n    val: number;\n    next: ListNode | null;\n    constructor(val?: number, next?: ListNode | null) {\n        this.val = (val===undefined ? 0 : val);\n        this.next = (next===undefined ? null : next);\n    }\n}\n\nfunction mergeKLists(lists: Array<ListNode | null>): ListNode | null {\n    return null;\n}",
            "go": "package main\n\ntype ListNode struct {\n    Val int\n    Next *ListNode\n}\n\nfunc mergeKLists(lists []*ListNode) *ListNode {\n    return nil\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 8. VRQ-000020: Sliding Window Maximum (Hard)
    # -------------------------------------------------------------
    "VRQ-000020": {
        "verniq_id": "VRQ-000020",
        "slug": "sliding-window-maximum",
        "title": "Sliding Window Maximum",
        "difficulty": "hard",
        "domain": "DSA",
        "topics": ["Monotonic Queue", "Sliding Window", "Arrays"],
        "method_name": "maxSlidingWindow",
        "description_markdown": """You are given an array of integers `nums`, there is a sliding window of size `k` which is moving from the very left of the array to the very right. You can only see the `k` numbers in the window. Each time the sliding window moves right by one position.

Return *the max sliding window* containing the maximum element for every position of the window.

### Example 1
```text
Input: nums = [1,3,-1,-3,5,3,6,7], k = 3
Output: [3,3,5,5,6,7]
Explanation: 
Window position                Max
---------------               -----
[1  3  -1] -3  5  3  6  7       3
 1 [3  -1  -3] 5  3  6  7       3
 1  3 [-1  -3  5] 3  6  7       5
 1  3  -1 [-3  5  3] 6  7       5
 1  3  -1  -3 [5  3  6] 7       6
 1  3  -1  -3  5 [3  6  7]      7
```

### Example 2
```text
Input: nums = [1], k = 1
Output: [1]
```""",
        "input_format": "An integer array nums and an integer window size k.",
        "output_format": "An array of integers representing the maximum in each sliding window.",
        "constraints_markdown": """- `1 <= nums.length <= 10^5`
- `-10^4 <= nums[i] <= 10^4`
- `1 <= k <= nums.length`""",
        "edge_cases": [
            "k == 1 (result is nums itself)",
            "k == nums.length (result is single max of whole array)",
            "Strictly increasing array",
            "Strictly decreasing array",
            "All elements equal"
        ],
        "hints": [
            "A monotonic double-ended queue (deque) storing indices can maintain elements in decreasing order.",
            "Remove indices that fall outside the left window boundary and pop elements smaller than the incoming element from the back in O(1) amortized time."
        ],
        "starter_templates": {
            "python": "from typing import List\n\nclass Solution:\n    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:\n        return []",
            "cpp": "#include <vector>\n\nclass Solution {\npublic:\n    std::vector<int> maxSlidingWindow(std::vector<int>& nums, int k) {\n        return {};\n    }\n};",
            "java": "class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        return new int[0];\n    }\n}",
            "typescript": "function maxSlidingWindow(nums: number[], k: number): number[] {\n    return [];\n}",
            "go": "package main\n\nfunc maxSlidingWindow(nums []int, k int) []int {\n    return nil\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 9. VRQ-000021: Median of Two Sorted Arrays (Hard)
    # -------------------------------------------------------------
    "VRQ-000021": {
        "verniq_id": "VRQ-000021",
        "slug": "median-of-two-sorted-arrays",
        "title": "Median of Two Sorted Arrays",
        "difficulty": "hard",
        "domain": "DSA",
        "topics": ["Binary Search", "Divide and Conquer", "Arrays"],
        "method_name": "findMedianSortedArrays",
        "description_markdown": """Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return **the median** of the two sorted arrays.

The overall run time complexity must be strictly **$O(\\log(m+n))$**.

### Example 1
```text
Input: nums1 = [1,3], nums2 = [2]
Output: 2.00000
Explanation: merged array = [1,2,3] and median is 2.
```

### Example 2
```text
Input: nums1 = [1,2], nums2 = [3,4]
Output: 2.50000
Explanation: merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.
```""",
        "input_format": "Two sorted integer arrays nums1 and nums2.",
        "output_format": "A float representing the exact median.",
        "constraints_markdown": """- `nums1.length == m`
- `nums2.length == n`
- `0 <= m <= 1000`
- `0 <= n <= 1000`
- `1 <= m + n <= 2000`
- `-10^6 <= nums1[i], nums2[i] <= 10^6`""",
        "edge_cases": [
            "One array is completely empty",
            "Both arrays have single elements",
            "All elements of nums1 strictly less than nums2",
            "Odd vs even combined total lengths"
        ],
        "hints": [
            "Perform binary search on the partition of the smaller array.",
            "Ensure maxLeftX <= minRightY and maxLeftY <= minRightX."
        ],
        "starter_templates": {
            "python": "from typing import List\n\nclass Solution:\n    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:\n        return 0.0",
            "cpp": "#include <vector>\n\nclass Solution {\npublic:\n    double findMedianSortedArrays(std::vector<int>& nums1, std::vector<int>& nums2) {\n        return 0.0;\n    }\n};",
            "java": "class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        return 0.0;\n    }\n}",
            "typescript": "function findMedianSortedArrays(nums1: number[], nums2: number[]): number {\n    return 0.0;\n}",
            "go": "package main\n\nfunc findMedianSortedArrays(nums1 []int, nums2 []int) float64 {\n    return 0.0\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 10. VRQ-000022: Course Schedule (Medium)
    # -------------------------------------------------------------
    "VRQ-000022": {
        "verniq_id": "VRQ-000022",
        "slug": "course-schedule",
        "title": "Course Schedule",
        "difficulty": "medium",
        "domain": "DSA",
        "topics": ["Graph Theory", "Topological Sort", "Directed Acyclic Graph"],
        "method_name": "canFinish",
        "description_markdown": """There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [a_i, b_i]` indicates that you **must** take course `b_i` first if you want to take course `a_i`.

Return `true` if you can finish all courses. Otherwise, return `false`.

### Example 1
```text
Input: numCourses = 2, prerequisites = [[1,0]]
Output: true
Explanation: There are a total of 2 courses. To take course 1 you should have finished course 0. So it is possible.
```

### Example 2
```text
Input: numCourses = 2, prerequisites = [[1,0],[0,1]]
Output: false
Explanation: Course 1 requires course 0 and course 0 requires course 1. A directed cycle exists, making it impossible.
```""",
        "input_format": "An integer numCourses and a 2D array prerequisites of pairs [a, b].",
        "output_format": "Boolean true if topological sort exists without cycles, false otherwise.",
        "constraints_markdown": """- `1 <= numCourses <= 2000`
- `0 <= prerequisites.length <= 5000`
- `prerequisites[i].length == 2`
- `0 <= a_i, b_i < numCourses`
- All prerequisites pairs are unique.""",
        "edge_cases": [
            "No prerequisites (always true)",
            "Self loop [[0, 0]] (false)",
            "Disjoint subgraphs where some contain cycles and others are acyclic",
            "Linear chain of all courses"
        ],
        "hints": [
            "Represent the prerequisites as a directed graph.",
            "A cycle detection algorithm via Kahn's BFS (in-degree tracking) or 3-color DFS determines feasibility in O(V + E) time."
        ],
        "starter_templates": {
            "python": "from typing import List\n\nclass Solution:\n    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:\n        return True",
            "cpp": "#include <vector>\n\nclass Solution {\npublic:\n    bool canFinish(int numCourses, std::vector<std::vector<int>>& prerequisites) {\n        return true;\n    }\n};",
            "java": "class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        return true;\n    }\n}",
            "typescript": "function canFinish(numCourses: number, prerequisites: number[][]): boolean {\n    return true;\n}",
            "go": "package main\n\nfunc canFinish(numCourses int, prerequisites [][]int) bool {\n    return true\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 11. VRQ-000025: Koko Eating Bananas (Medium)
    # -------------------------------------------------------------
    "VRQ-000025": {
        "verniq_id": "VRQ-000025",
        "slug": "koko-eating-bananas",
        "title": "Koko Eating Bananas",
        "difficulty": "medium",
        "domain": "DSA",
        "topics": ["Binary Search", "Arrays"],
        "method_name": "minEatingSpeed",
        "description_markdown": """Koko loves to eat bananas. There are `n` piles of bananas, the `i`-th pile has `piles[i]` bananas. The guards have gone and will come back in `h` hours.

Koko can decide her banana-eating speed of `k` bananas per hour. Each hour, she chooses a pile and eats `k` bananas from it. If the pile has less than `k` bananas, she eats all of them instead and will not eat any more bananas during this hour.

Koko likes to eat slowly but still wants to finish eating all the bananas before the guards return.

Return *the minimum integer `k` such that she can eat all the bananas within `h` hours*.

### Example 1
```text
Input: piles = [3,6,7,11], h = 8
Output: 4
```

### Example 2
```text
Input: piles = [30,11,23,4,20], h = 5
Output: 30
```

### Example 3
```text
Input: piles = [30,11,23,4,20], h = 6
Output: 23
```""",
        "input_format": "An integer array piles and an integer h.",
        "output_format": "An integer representing the minimum viable eating speed k.",
        "constraints_markdown": """- `1 <= piles.length <= 10^4`
- `piles.length <= h <= 10^9`
- `1 <= piles[i] <= 10^9`""",
        "edge_cases": [
            "h equals piles.length (k must be max(piles))",
            "h significantly larger than total bananas (k = 1)",
            "Single pile",
            "Very large pile counts up to 10^9"
        ],
        "hints": [
            "The feasibility of speed k is monotonic: if speed k works, any k' > k also works.",
            "Use binary search over the range [1, max(piles)] checking if ceil(pile / k) sum <= h."
        ],
        "starter_templates": {
            "python": "from typing import List\n\nclass Solution:\n    def minEatingSpeed(self, piles: List[int], h: int) -> int:\n        return 1",
            "cpp": "#include <vector>\n\nclass Solution {\npublic:\n    int minEatingSpeed(std::vector<int>& piles, int h) {\n        return 1;\n    }\n};",
            "java": "class Solution {\n    public int minEatingSpeed(int[] piles, int h) {\n        return 1;\n    }\n}",
            "typescript": "function minEatingSpeed(piles: number[], h: number): number {\n    return 1;\n}",
            "go": "package main\n\nfunc minEatingSpeed(piles []int, h int) int {\n    return 1\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 12. VRQ-000030: Move Zeroes (Easy)
    # -------------------------------------------------------------
    "VRQ-000030": {
        "verniq_id": "VRQ-000030",
        "slug": "move-zeroes",
        "title": "Move Zeroes",
        "difficulty": "easy",
        "domain": "DSA",
        "topics": ["Arrays", "Two Pointers"],
        "method_name": "moveZeroes",
        "description_markdown": """Given an integer array `nums`, move all `0`'s to the end of it while maintaining the relative order of the non-zero elements.

**Note** that you must do this in-place without making a copy of the array.

### Example 1
```text
Input: nums = [0,1,0,3,12]
Output: [1,3,12,0,0]
```

### Example 2
```text
Input: nums = [0]
Output: [0]
```""",
        "input_format": "An integer array nums.",
        "output_format": "The array modified in-place with all zeros shifted to the end.",
        "constraints_markdown": """- `1 <= nums.length <= 10^4`
- `-2^31 <= nums[i] <= 2^31 - 1`""",
        "edge_cases": [
            "Array with no zeroes [1, 2, 3]",
            "Array with all zeroes [0, 0, 0]",
            "Single element array",
            "Zeroes already clustered at the end"
        ],
        "hints": [
            "Use two pointers: a slow write pointer tracking the position for the next non-zero, and a fast scan pointer.",
            "Swap non-zero elements into the slow pointer index."
        ],
        "starter_templates": {
            "python": "from typing import List\n\nclass Solution:\n    def moveZeroes(self, nums: List[int]) -> None:\n        \"\"\"Do not return anything, modify nums in-place instead.\"\"\"\n        pass",
            "cpp": "#include <vector>\n\nclass Solution {\npublic:\n    void moveZeroes(std::vector<int>& nums) {\n    }\n};",
            "java": "class Solution {\n    public void moveZeroes(int[] nums) {\n    }\n}",
            "typescript": "function moveZeroes(nums: number[]): void {\n}",
            "go": "package main\n\nfunc moveZeroes(nums []int) {\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 13. VRQ-000031: Valid Anagram (Easy)
    # -------------------------------------------------------------
    "VRQ-000031": {
        "verniq_id": "VRQ-000031",
        "slug": "valid-anagram",
        "title": "Valid Anagram",
        "difficulty": "easy",
        "domain": "DSA",
        "topics": ["Hash Table", "Strings", "Sorting"],
        "method_name": "isAnagram",
        "description_markdown": """Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

### Example 1
```text
Input: s = "anagram", t = "nagaram"
Output: true
```

### Example 2
```text
Input: s = "rat", t = "car"
Output: false
```""",
        "input_format": "Two strings s and t.",
        "output_format": "Boolean true if t is an anagram of s, false otherwise.",
        "constraints_markdown": """- `1 <= s.length, t.length <= 5 * 10^4`
- `s` and `t` consist solely of lowercase English letters.""",
        "edge_cases": [
            "Strings of unequal lengths (immediately false)",
            "Single character strings",
            "Identical strings (true)",
            "Same set of characters but different frequencies"
        ],
        "hints": [
            "Check if lengths match first.",
            "Count character frequencies using an array of size 26 in O(N) time and O(1) extra space."
        ],
        "starter_templates": {
            "python": "class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        return False",
            "cpp": "#include <string>\n\nclass Solution {\npublic:\n    bool isAnagram(std::string s, std::string t) {\n        return false;\n    }\n};",
            "java": "class Solution {\n    public boolean isAnagram(String s, String t) {\n        return false;\n    }\n}",
            "typescript": "function isAnagram(s: string, t: string): boolean {\n    return false;\n}",
            "go": "package main\n\nfunc isAnagram(s string, t string) bool {\n    return false\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 14. VRQ-000032: Word Ladder (Hard)
    # -------------------------------------------------------------
    "VRQ-000032": {
        "verniq_id": "VRQ-000032",
        "slug": "word-ladder",
        "title": "Word Ladder",
        "difficulty": "hard",
        "domain": "DSA",
        "topics": ["Graph Theory", "Breadth-First Search", "Hash Table", "Strings"],
        "method_name": "ladderLength",
        "description_markdown": """A **transformation sequence** from word `beginWord` to word `endWord` using a dictionary `wordList` is a sequence of words `beginWord -> s_1 -> s_2 -> ... -> s_k` such that:
- Every adjacent pair of words differs by exactly one letter.
- Every `s_i` for `1 <= i <= k` is in `wordList`. (Note that `beginWord` does not need to be in `wordList`.)
- `s_k == endWord`.

Given two words, `beginWord` and `endWord`, and a dictionary `wordList`, return *the **number of words** in the shortest transformation sequence from `beginWord` to `endWord`, or `0` if no such sequence exists*.

### Example 1
```text
Input: beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]
Output: 5
Explanation: One shortest transformation sequence is "hit" -> "hot" -> "dot" -> "dog" -> "cog", which is 5 words long.
```

### Example 2
```text
Input: beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]
Output: 0
Explanation: The endWord "cog" is not in wordList, therefore there is no valid transformation sequence.
```""",
        "input_format": "Strings beginWord, endWord, and an array of strings wordList.",
        "output_format": "Integer count of words in the shortest ladder, or 0 if unreachable.",
        "constraints_markdown": """- `1 <= beginWord.length <= 10`
- `endWord.length == beginWord.length`
- `1 <= wordList.length <= 5000`
- `wordList[i].length == beginWord.length`
- `beginWord`, `endWord`, and `wordList[i]` consist of lowercase English letters.
- `beginWord != endWord`
- All words in `wordList` are unique.""",
        "edge_cases": [
            "endWord is not present in wordList (immediately 0)",
            "Direct 1-step transformation (result is 2)",
            "No path connecting beginWord to endWord",
            "Cycle in word transitions"
        ],
        "hints": [
            "Model words as nodes and single-letter differences as unweighted edges.",
            "Use Breadth-First Search (BFS) starting from beginWord. For optimal performance on large word lists, bidirectional BFS cuts the search space exponentially."
        ],
        "starter_templates": {
            "python": "from typing import List\n\nclass Solution:\n    def ladderLength(self, beginWord: str, endWord: str, wordList: List[str]) -> int:\n        return 0",
            "cpp": "#include <string>\n#include <vector>\n\nclass Solution {\npublic:\n    int ladderLength(std::string beginWord, std::string endWord, std::vector<std::string>& wordList) {\n        return 0;\n    }\n};",
            "java": "import java.util.*;\n\nclass Solution {\n    public int ladderLength(String beginWord, String endWord, List<String> wordList) {\n        return 0;\n    }\n}",
            "typescript": "function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {\n    return 0;\n}",
            "go": "package main\n\nfunc ladderLength(beginWord string, endWord string, wordList []string) int {\n    return 0\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 15. VRQ-000033: Coin Change (Medium)
    # -------------------------------------------------------------
    "VRQ-000033": {
        "verniq_id": "VRQ-000033",
        "slug": "coin-change",
        "title": "Coin Change",
        "difficulty": "medium",
        "domain": "DSA",
        "topics": ["Dynamic Programming", "Breadth-First Search"],
        "method_name": "coinChange",
        "description_markdown": """You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.

Return *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return `-1`.

You may assume that you have an infinite number of each kind of coin.

### Example 1
```text
Input: coins = [1,2,5], amount = 11
Output: 3
Explanation: 11 = 5 + 5 + 1 (3 coins total)
```

### Example 2
```text
Input: coins = [2], amount = 3
Output: -1
```

### Example 3
```text
Input: coins = [1], amount = 0
Output: 0
```""",
        "input_format": "An integer array coins and an integer amount.",
        "output_format": "An integer representing the minimum coins needed, or -1.",
        "constraints_markdown": """- `1 <= coins.length <= 12`
- `1 <= coins[i] <= 2^31 - 1`
- `0 <= amount <= 10^4`""",
        "edge_cases": [
            "amount = 0 (result is 0)",
            "amount cannot be formed (result is -1)",
            "Greedy fails (e.g. coins [1, 3, 4], amount 6 -> answer is 2, not 3)",
            "Coin denominations larger than amount"
        ],
        "hints": [
            "Define dp[i] as the minimum coins needed to make amount i.",
            "Initialize dp array with infinity and dp[0] = 0. Transition: dp[i] = min(dp[i], dp[i - c] + 1) for coin c <= i."
        ],
        "starter_templates": {
            "python": "from typing import List\n\nclass Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        return -1",
            "cpp": "#include <vector>\n\nclass Solution {\npublic:\n    int coinChange(std::vector<int>& coins, int amount) {\n        return -1;\n    }\n};",
            "java": "class Solution {\n    public int coinChange(int[] coins, int amount) {\n        return -1;\n    }\n}",
            "typescript": "function coinChange(coins: number[], amount: number): number {\n    return -1;\n}",
            "go": "package main\n\nfunc coinChange(coins []int, amount int) int {\n    return -1\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 16. VRQ-000041: Merge Two Sorted Lists (Easy)
    # -------------------------------------------------------------
    "VRQ-000041": {
        "verniq_id": "VRQ-000041",
        "slug": "merge-two-sorted-lists",
        "title": "Merge Two Sorted Lists",
        "difficulty": "easy",
        "domain": "DSA",
        "topics": ["Linked List", "Recursion"],
        "method_name": "mergeTwoLists",
        "description_markdown": """You are given the heads of two sorted linked lists `list1` and `list2`.

Merge the two lists into one **sorted** linked list. The list should be made by splicing together the nodes of the first two lists.

Return *the head of the merged linked list*.

### Example 1
```text
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]
```

### Example 2
```text
Input: list1 = [], list2 = []
Output: []
```

### Example 3
```text
Input: list1 = [], list2 = [0]
Output: [0]
```""",
        "input_format": "Two sorted linked lists list1 and list2.",
        "output_format": "The merged sorted linked list.",
        "constraints_markdown": """- The number of nodes in both lists is in the range `[0, 50]`
- `-100 <= Node.val <= 100`
- Both `list1` and `list2` are sorted in non-decreasing order.""",
        "edge_cases": [
            "Both lists are empty",
            "One list is empty while the other is non-empty",
            "Lists with identical elements",
            "All elements of list1 smaller than list2"
        ],
        "hints": [
            "Use a sentinel dummy head node to simplify pointer handling.",
            "Compare head values of list1 and list2, appending the smaller node to the merged tail."
        ],
        "starter_templates": {
            "python": "from typing import Optional\n\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\nclass Solution:\n    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:\n        return None",
            "cpp": "struct ListNode {\n    int val;\n    ListNode *next;\n    ListNode(int x) : val(x), next(nullptr) {}\n};\n\nclass Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        return nullptr;\n    }\n};",
            "java": "class ListNode {\n    int val;\n    ListNode next;\n    ListNode(int val) { this.val = val; }\n}\n\nclass Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        return null;\n    }\n}",
            "typescript": "class ListNode {\n    val: number;\n    next: ListNode | null;\n    constructor(val?: number, next?: ListNode | null) {\n        this.val = (val===undefined ? 0 : val);\n        this.next = (next===undefined ? null : next);\n    }\n}\n\nfunction mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {\n    return null;\n}",
            "go": "package main\n\ntype ListNode struct {\n    Val int\n    Next *ListNode\n}\n\nfunc mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {\n    return nil\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 17. VRQ-000043: Climbing Stairs (Easy)
    # -------------------------------------------------------------
    "VRQ-000043": {
        "verniq_id": "VRQ-000043",
        "slug": "climbing-stairs",
        "title": "Climbing Stairs",
        "difficulty": "easy",
        "domain": "DSA",
        "topics": ["Dynamic Programming", "Math", "Memoization"],
        "method_name": "climbStairs",
        "description_markdown": """You are climbing a staircase. It takes `n` steps to reach the top.

Each time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?

### Example 1
```text
Input: n = 2
Output: 2
Explanation: There are two ways to climb to the top:
1. 1 step + 1 step
2. 2 steps
```

### Example 2
```text
Input: n = 3
Output: 3
Explanation: There are three ways to climb to the top:
1. 1 step + 1 step + 1 step
2. 1 step + 2 steps
3. 2 steps + 1 step
```""",
        "input_format": "An integer n representing the total number of steps.",
        "output_format": "An integer representing the count of distinct step combinations.",
        "constraints_markdown": """- `1 <= n <= 250`""",
        "edge_cases": [
            "n = 1 (1 way)",
            "n = 2 (2 ways)",
            "n = 3 (3 ways)",
            "Upper bound testing integer scaling"
        ],
        "hints": [
            "To reach step n, you must arrive from step n-1 (by taking 1 step) or step n-2 (by taking 2 steps).",
            "This gives the recurrence ways(n) = ways(n-1) + ways(n-2), which is identical to the Fibonacci sequence."
        ],
        "starter_templates": {
            "python": "class Solution:\n    def climbStairs(self, n: int) -> int:\n        return 1",
            "cpp": "class Solution {\npublic:\n    int climbStairs(int n) {\n        return 1;\n    }\n};",
            "java": "class Solution {\n    public int climbStairs(int n) {\n        return 1;\n    }\n}",
            "typescript": "function climbStairs(n: number): number {\n    return 1;\n}",
            "go": "package main\n\nfunc climbStairs(n int) int {\n    return 1\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 18. VRQ-000056: Jump Game (Medium)
    # -------------------------------------------------------------
    "VRQ-000056": {
        "verniq_id": "VRQ-000056",
        "slug": "jump-game",
        "title": "Jump Game",
        "difficulty": "medium",
        "domain": "DSA",
        "topics": ["Greedy", "Arrays", "Dynamic Programming"],
        "method_name": "canJump",
        "description_markdown": """You are given an integer array `nums`. You are initially positioned at the array's **first index**, and each element in the array represents your maximum jump length at that position.

Return `true` if you can reach the last index, or `false` otherwise.

### Example 1
```text
Input: nums = [2,3,1,1,4]
Output: true
Explanation: Jump 1 step from index 0 to 1, then 3 steps to the last index.
```

### Example 2
```text
Input: nums = [3,2,1,0,4]
Output: false
Explanation: You will always arrive at index 3 no matter what. Its maximum jump length is 0, which makes it impossible to reach the last index.
```""",
        "input_format": "An integer array nums.",
        "output_format": "Boolean true if the last index is reachable, false otherwise.",
        "constraints_markdown": """- `1 <= nums.length <= 10^4`
- `0 <= nums[i] <= 10^5`""",
        "edge_cases": [
            "Single element array (already at last index -> true)",
            "Starting element is 0 with length > 1 (immediately false)",
            "Zeros that can be leaped over",
            "Maximum reachable index exactly equals last index"
        ],
        "hints": [
            "Track the furthest index reachable so far.",
            "If current index exceeds furthest reachable index, you are trapped and return false."
        ],
        "starter_templates": {
            "python": "from typing import List\n\nclass Solution:\n    def canJump(self, nums: List[int]) -> bool:\n        return False",
            "cpp": "#include <vector>\n\nclass Solution {\npublic:\n    bool canJump(std::vector<int>& nums) {\n        return false;\n    }\n};",
            "java": "class Solution {\n    public boolean canJump(int[] nums) {\n        return false;\n    }\n}",
            "typescript": "function canJump(nums: number[]): boolean {\n    return false;\n}",
            "go": "package main\n\nfunc canJump(nums []int) bool {\n    return false\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 19. VRQ-000065: Largest Rectangle in Histogram (Hard)
    # -------------------------------------------------------------
    "VRQ-000065": {
        "verniq_id": "VRQ-000065",
        "slug": "largest-rectangle-in-histogram",
        "title": "Largest Rectangle in Histogram",
        "difficulty": "hard",
        "domain": "DSA",
        "topics": ["Monotonic Stack", "Stack", "Arrays"],
        "method_name": "largestRectangleArea",
        "description_markdown": """Given an array of integers `heights` representing the histogram's bar height where the width of each bar is `1`, return *the area of the largest rectangle in the histogram*.

### Example 1
```text
Input: heights = [2,1,5,6,2,3]
Output: 10
Explanation: The largest rectangle is formed by bars [5, 6] with area = 2 * 5 = 10 units.
```

### Example 2
```text
Input: heights = [2,4]
Output: 4
```""",
        "input_format": "An integer array heights.",
        "output_format": "An integer representing the maximum rectangle area.",
        "constraints_markdown": """- `1 <= heights.length <= 10^5`
- `0 <= heights[i] <= 10^4`""",
        "edge_cases": [
            "Single bar",
            "All bars having equal height",
            "Strictly increasing staircase heights",
            "Strictly decreasing heights",
            "Bars with height 0"
        ],
        "hints": [
            "For each bar of height h, what is the widest range it can extend to the left and right before hitting a shorter bar?",
            "A monotonic increasing stack of indices allows computing the left and right boundaries in O(N) total time."
        ],
        "starter_templates": {
            "python": "from typing import List\n\nclass Solution:\n    def largestRectangleArea(self, heights: List[int]) -> int:\n        return 0",
            "cpp": "#include <vector>\n\nclass Solution {\npublic:\n    int largestRectangleArea(std::vector<int>& heights) {\n        return 0;\n    }\n};",
            "java": "class Solution {\n    public int largestRectangleArea(int[] heights) {\n        return 0;\n    }\n}",
            "typescript": "function largestRectangleArea(heights: number[]): number {\n    return 0;\n}",
            "go": "package main\n\nfunc largestRectangleArea(heights []int) int {\n    return 0\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    },

    # -------------------------------------------------------------
    # 20. VRQ-000119: Validate Binary Search Tree (Medium)
    # -------------------------------------------------------------
    "VRQ-000119": {
        "verniq_id": "VRQ-000119",
        "slug": "validate-binary-search-tree",
        "title": "Validate Binary Search Tree",
        "difficulty": "medium",
        "domain": "DSA",
        "topics": ["Tree", "Binary Search Tree", "Depth-First Search"],
        "method_name": "isValidBST",
        "description_markdown": """Given the `root` of a binary tree, *determine if it is a valid binary search tree (BST)*.

A **valid BST** is defined as follows:
- The left subtree of a node contains only nodes with keys **strictly less than** the node's key.
- The right subtree of a node contains only nodes with keys **strictly greater than** the node's key.
- Both the left and right subtrees must also be binary search trees.

### Example 1
```text
Input: root = [2,1,3]
Output: true
```

### Example 2
```text
Input: root = [5,1,4,null,null,3,6]
Output: false
Explanation: The root node's value is 5 but its right child's value is 4, which violates the BST property.
```""",
        "input_format": "A level-order array representation of a binary tree root where null denotes absent children.",
        "output_format": "Boolean true if root satisfies all BST properties, false otherwise.",
        "constraints_markdown": """- The number of nodes in the tree is in the range `[1, 10^4]`
- `-2^31 <= Node.val <= 2^31 - 1`""",
        "edge_cases": [
            "Single node tree (always true)",
            "Duplicate values (violates strict inequality -> false)",
            "Local valid relationship where global ancestor bound is violated (e.g. root 5, right child 6 has left child 4 -> false)",
            "Node values at extreme 32-bit integer limits (-2^31, 2^31 - 1)"
        ],
        "hints": [
            "Do not just check node.left.val < node.val and node.right.val > node.val.",
            "Pass an allowed range [low, high] down the recursive traversal, ensuring every node value falls strictly within (low, high)."
        ],
        "starter_templates": {
            "python": "from typing import Optional\n\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\nclass Solution:\n    def isValidBST(self, root: Optional[TreeNode]) -> bool:\n        return True",
            "cpp": "struct TreeNode {\n    int val;\n    TreeNode *left;\n    TreeNode *right;\n    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n};\n\nclass Solution {\npublic:\n    bool isValidBST(TreeNode* root) {\n        return true;\n    }\n};",
            "java": "class TreeNode {\n    int val;\n    TreeNode left;\n    TreeNode right;\n    TreeNode(int val) { this.val = val; }\n}\n\nclass Solution {\n    public boolean isValidBST(TreeNode root) {\n        return true;\n    }\n}",
            "typescript": "class TreeNode {\n    val: number;\n    left: TreeNode | null;\n    right: TreeNode | null;\n    constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {\n        this.val = (val===undefined ? 0 : val);\n        this.left = (left===undefined ? null : left);\n        this.right = (right===undefined ? null : right);\n    }\n}\n\nfunction isValidBST(root: TreeNode | null): boolean {\n    return true;\n}",
            "go": "package main\n\ntype TreeNode struct {\n    Val int\n    Left *TreeNode\n    Right *TreeNode\n}\n\nfunc isValidBST(root *TreeNode) bool {\n    return true\n}"
        },
        "time_limit_ms": 2000,
        "memory_limit_mb": 256
    }
}
