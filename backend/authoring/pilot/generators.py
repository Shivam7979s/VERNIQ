"""
VERNIQ Phase 4.1 Canonical Test Vector Generators
=================================================
Generates verified, non-duplicate, multi-category canonical test suites
satisfying strict difficulty minimums:
- EASY: minimum 200 tests
- MEDIUM: minimum 250 tests
- HARD: minimum 300 tests
Total: >= 5,000 verified non-duplicate test vectors.
"""

import json
import random
from collections import OrderedDict, deque
from typing import List, Dict, Any, Tuple


# =====================================================================
# REFERENCE SOLVERS (Independently Verified)
# =====================================================================

class ReferenceSolvers:
    @staticmethod
    def lru_cache(commands: List[str], args: List[List[int]]) -> List[Any]:
        results = []
        cache = None
        for cmd, arg in zip(commands, args):
            if cmd == "LRUCache":
                cap = arg[0]
                cache = OrderedDict()
                cache_cap = cap
                results.append(None)
            elif cmd == "put":
                k, v = arg[0], arg[1]
                if k in cache:
                    cache.move_to_end(k)
                cache[k] = v
                if len(cache) > cache_cap:
                    cache.popitem(last=False)
                results.append(None)
            elif cmd == "get":
                k = arg[0]
                if k in cache:
                    cache.move_to_end(k)
                    results.append(cache[k])
                else:
                    results.append(-1)
        return results

    @staticmethod
    def merge_intervals(intervals: List[List[int]]) -> List[List[int]]:
        if not intervals:
            return []
        sorted_ints = sorted(intervals, key=lambda x: x[0])
        merged = [sorted_ints[0]]
        for cur in sorted_ints[1:]:
            prev = merged[-1]
            if cur[0] <= prev[1]:
                prev[1] = max(prev[1], cur[1])
            else:
                merged.append(cur)
        return merged

    @staticmethod
    def valid_parentheses(s: str) -> bool:
        stack = []
        mapping = {')': '(', '}': '{', ']': '['}
        for ch in s:
            if ch in mapping:
                top = stack.pop() if stack else '#'
                if mapping[ch] != top:
                    return False
            else:
                stack.append(ch)
        return len(stack) == 0

    @staticmethod
    def length_of_longest_substring(s: str) -> int:
        char_map = {}
        left = 0
        max_len = 0
        for right, ch in enumerate(s):
            if ch in char_map and char_map[ch] >= left:
                left = char_map[ch] + 1
            char_map[ch] = right
            max_len = max(max_len, right - left + 1)
        return max_len

    @staticmethod
    def num_islands(grid: List[List[str]]) -> int:
        if not grid or not grid[0]:
            return 0
        m, n = len(grid), len(grid[0])
        visited = [[False] * n for _ in range(m)]
        count = 0
        for i in range(m):
            for j in range(n):
                if grid[i][j] == "1" and not visited[i][j]:
                    count += 1
                    queue = deque([(i, j)])
                    visited[i][j] = True
                    while queue:
                        r, c = queue.popleft()
                        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                            nr, nc = r + dr, c + dc
                            if 0 <= nr < m and 0 <= nc < n and grid[nr][nc] == "1" and not visited[nr][nc]:
                                visited[nr][nc] = True
                                queue.append((nr, nc))
        return count

    @staticmethod
    def max_sub_array(nums: List[int]) -> int:
        cur_sum = nums[0]
        max_sum = nums[0]
        for x in nums[1:]:
            cur_sum = max(x, cur_sum + x)
            max_sum = max(max_sum, cur_sum)
        return max_sum

    @staticmethod
    def merge_k_lists(lists: List[List[int]]) -> List[int]:
        flattened = []
        for l in lists:
            flattened.extend(l)
        return sorted(flattened)

    @staticmethod
    def max_sliding_window(nums: List[int], k: int) -> List[int]:
        if not nums or k == 0:
            return []
        d = deque()
        res = []
        for i, x in enumerate(nums):
            while d and d[0] < i - k + 1:
                d.popleft()
            while d and nums[d[-1]] < x:
                d.pop()
            d.append(i)
            if i >= k - 1:
                res.append(nums[d[0]])
        return res

    @staticmethod
    def find_median_sorted_arrays(nums1: List[int], nums2: List[int]) -> float:
        merged = sorted(nums1 + nums2)
        total = len(merged)
        if total % 2 == 1:
            return float(merged[total // 2])
        else:
            return (merged[total // 2 - 1] + merged[total // 2]) / 2.0

    @staticmethod
    def can_finish(num_courses: int, prerequisites: List[List[int]]) -> bool:
        adj = [[] for _ in range(num_courses)]
        in_degree = [0] * num_courses
        for a, b in prerequisites:
            adj[b].append(a)
            in_degree[a] += 1
        q = deque([i for i in range(num_courses) if in_degree[i] == 0])
        visited = 0
        while q:
            u = q.popleft()
            visited += 1
            for v in adj[u]:
                in_degree[v] -= 1
                if in_degree[v] == 0:
                    q.append(v)
        return visited == num_courses

    @staticmethod
    def min_eating_speed(piles: List[int], h: int) -> int:
        low, high = 1, max(piles)
        ans = high
        while low <= high:
            mid = (low + high) // 2
            total_hours = sum((p + mid - 1) // mid for p in piles)
            if total_hours <= h:
                ans = mid
                high = mid - 1
            else:
                low = mid + 1
        return ans

    @staticmethod
    def move_zeroes(nums: List[int]) -> List[int]:
        res = [x for x in nums if x != 0]
        res += [0] * (len(nums) - len(res))
        return res

    @staticmethod
    def is_anagram(s: str, t: str) -> bool:
        if len(s) != len(t):
            return False
        return sorted(s) == sorted(t)

    @staticmethod
    def ladder_length(begin_word: str, end_word: str, word_list: List[str]) -> int:
        word_set = set(word_list)
        if end_word not in word_set:
            return 0
        queue = deque([(begin_word, 1)])
        visited = {begin_word}
        while queue:
            cur, dist = queue.popleft()
            if cur == end_word:
                return dist
            for i in range(len(cur)):
                for c in 'abcdefghijklmnopqrstuvwxyz':
                    next_word = cur[:i] + c + cur[i+1:]
                    if next_word in word_set and next_word not in visited:
                        visited.add(next_word)
                        queue.append((next_word, dist + 1))
        return 0

    @staticmethod
    def coin_change(coins: List[int], amount: int) -> int:
        dp = [float('inf')] * (amount + 1)
        dp[0] = 0
        for i in range(1, amount + 1):
            for c in coins:
                if c <= i:
                    dp[i] = min(dp[i], dp[i - c] + 1)
        return dp[amount] if dp[amount] != float('inf') else -1

    @staticmethod
    def merge_two_lists(list1: List[int], list2: List[int]) -> List[int]:
        return sorted(list1 + list2)

    @staticmethod
    def climb_stairs(n: int) -> int:
        if n <= 2:
            return n
        a, b = 1, 2
        for _ in range(3, n + 1):
            a, b = b, a + b
        return b

    @staticmethod
    def can_jump(nums: List[int]) -> bool:
        reach = 0
        for i, jump in enumerate(nums):
            if i > reach:
                return False
            reach = max(reach, i + jump)
            if reach >= len(nums) - 1:
                return True
        return reach >= len(nums) - 1

    @staticmethod
    def largest_rectangle_area(heights: List[int]) -> int:
        stack = []
        max_area = 0
        h_extended = heights + [0]
        for i, h in enumerate(h_extended):
            while stack and h_extended[stack[-1]] > h:
                top_h = h_extended[stack.pop()]
                w = i if not stack else i - stack[-1] - 1
                max_area = max(max_area, top_h * w)
            stack.append(i)
        return max_area

    @staticmethod
    def is_valid_bst(tree_nodes: List[Any]) -> bool:
        # tree_nodes in level-order
        if not tree_nodes:
            return True
        
        # Build node tree
        class Node:
            def __init__(self, val):
                self.val = val
                self.left = None
                self.right = None

        if tree_nodes[0] is None:
            return True
        root = Node(tree_nodes[0])
        q = deque([root])
        idx = 1
        while q and idx < len(tree_nodes):
            cur = q.popleft()
            if idx < len(tree_nodes) and tree_nodes[idx] is not None:
                cur.left = Node(tree_nodes[idx])
                q.append(cur.left)
            idx += 1
            if idx < len(tree_nodes) and tree_nodes[idx] is not None:
                cur.right = Node(tree_nodes[idx])
                q.append(cur.right)
            idx += 1

        def validate(node, low, high):
            if not node:
                return True
            if not (low < node.val < high):
                return False
            return validate(node.left, low, node.val) and validate(node.right, node.val, high)

        return validate(root, float('-inf'), float('inf'))


# =====================================================================
# INDIVIDUAL TEST VECTOR GENERATORS
# =====================================================================

def generate_tests_for_problem(verniq_id: str) -> List[Dict[str, Any]]:
    """Generates non-duplicate test vectors meeting or exceeding difficulty minimums."""
    rng = random.Random(42 + hash(verniq_id))
    tests = []
    seen_inputs = set()

    def add_case(raw_input: str, expected_out: Any, is_sample: bool, category: str, explanation: str):
        if raw_input in seen_inputs:
            return
        seen_inputs.add(raw_input)
        tests.append({
            "input": raw_input,
            "expected_output": json.dumps(expected_out, separators=(',', ':')) if not isinstance(expected_out, str) else expected_out,
            "is_sample": is_sample,
            "order_index": len(tests) + 1,
            "category": category,
            "explanation": explanation
        })

    # 1. VRQ-000002: LRU Cache (Medium, >= 250)
    if verniq_id == "VRQ-000002":
        # Sample 1
        cmds1 = ["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]
        args1 = [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]
        add_case(f'commands = {json.dumps(cmds1)}\nargs = {json.dumps(args1)}', ReferenceSolvers.lru_cache(cmds1, args1), True, "sample", "[Sample] Standard eviction flow")
        
        # Boundary cases: capacity 1
        for i in range(1, 30):
            cmds = ["LRUCache"] + ["put", "get"] * i
            args = [[1]]
            for j in range(i):
                args.append([j, j * 10])
                args.append([j])
            add_case(f'commands = {json.dumps(cmds)}\nargs = {json.dumps(args)}', ReferenceSolvers.lru_cache(cmds, args), False, "edge_case", f"[Boundary] Capacity 1 alternating put/get {i}")

        # Diverse randomized cache workloads
        for cap in [2, 3, 5, 10, 50, 100]:
            for rep in range(40):
                op_count = rng.randint(15, 60)
                cmds = ["LRUCache"]
                args = [[cap]]
                for _ in range(op_count):
                    if rng.random() < 0.6:
                        cmds.append("put")
                        args.append([rng.randint(0, cap * 3), rng.randint(0, 1000)])
                    else:
                        cmds.append("get")
                        args.append([rng.randint(0, cap * 3)])
                add_case(f'commands = {json.dumps(cmds)}\nargs = {json.dumps(args)}', ReferenceSolvers.lru_cache(cmds, args), False, "hidden" if rep % 2 == 0 else "stress", f"[Workload] Cap {cap} len {op_count}")

    # 2. VRQ-000003: Merge Intervals (Medium, >= 250)
    elif verniq_id == "VRQ-000003":
        # Samples
        add_case('intervals = [[1,3],[2,6],[8,10],[15,18]]', ReferenceSolvers.merge_intervals([[1,3],[2,6],[8,10],[15,18]]), True, "sample", "[Sample] Overlapping intervals")
        add_case('intervals = [[1,4],[4,5]]', ReferenceSolvers.merge_intervals([[1,4],[4,5]]), True, "sample", "[Sample] Touching endpoints")
        add_case('intervals = [[1,4]]', ReferenceSolvers.merge_intervals([[1,4]]), False, "edge_case", "[Boundary] Single interval")

        # Boundary / Adversarial / Random cases
        iteration = 0
        while len(tests) < 265:
            iteration += 1
            if iteration < 20:
                # Completely nested
                ints = [[j, 100 - j] for j in range(iteration % 10 + 2)]
            elif iteration < 50:
                # Disjoint
                ints = [[j * 4, j * 4 + 2] for j in range(iteration % 15 + 2)]
            elif iteration < 80:
                # Contiguous chain
                ints = [[j, j + 1] for j in range(iteration % 20 + 2)]
            else:
                count = rng.randint(3, 30)
                ints = []
                for _ in range(count):
                    s = rng.randint(0, 500)
                    e = s + rng.randint(0, 50)
                    ints.append([s, e])
            add_case(f'intervals = {json.dumps(ints)}', ReferenceSolvers.merge_intervals(ints), False, "hidden" if iteration % 2 == 0 else "stress", f"[Intervals] Category {iteration}")

    # 3. VRQ-000004: Valid Parentheses (Easy, >= 200)
    elif verniq_id == "VRQ-000004":
        add_case('s = "()"', True, True, "sample", "[Sample] Single pair")
        add_case('s = "()[]{}"', True, True, "sample", "[Sample] Three types")
        add_case('s = "(]"', False, True, "sample", "[Sample] Mismatched")
        add_case('s = "([)]"', False, False, "edge_case", "[Adversarial] Interleaved brackets")

        # Systematic generation
        for i in range(1, 40):
            # Pure nested
            nested = "(" * i + ")" * i
            add_case(f's = "{nested}"', ReferenceSolvers.valid_parentheses(nested), False, "edge_case", f"[Nested] Depth {i}")
            # Invalid open
            unclosed = "(" * i + ")" * (i - 1)
            add_case(f's = "{unclosed}"', ReferenceSolvers.valid_parentheses(unclosed), False, "edge_case", f"[Unclosed] Len {len(unclosed)}")

        # Complex mixtures
        iteration = 0
        while len(tests) < 215:
            iteration += 1
            pattern = []
            for _ in range(rng.randint(2, 30)):
                t = rng.choice(["()", "[]", "{}"])
                if rng.random() < 0.8:
                    pattern.append(t)
                else:
                    pattern.append(t[0]) # introduce invalidity
            s = "".join(pattern)
            add_case(f's = "{s}"', ReferenceSolvers.valid_parentheses(s), False, "hidden", f"[Random Bracket Sequence] #{iteration}")

    # 4. VRQ-000005: Longest Substring Without Repeating Characters (Medium, >= 250)
    elif verniq_id == "VRQ-000005":
        add_case('s = "abcabcbb"', 3, True, "sample", "[Sample] abcabcbb")
        add_case('s = "bbbbb"', 1, True, "sample", "[Sample] bbbbb")
        add_case('s = "pwwkew"', 3, True, "sample", "[Sample] pwwkew")
        add_case('s = ""', 0, False, "edge_case", "[Boundary] Empty string")

        for i in range(1, 30):
            unique_s = "".join(chr(ord('a') + (j % 26)) for j in range(i))
            add_case(f's = "{unique_s}"', len(unique_s), False, "edge_case", f"[All Unique] Len {i}")
            all_same = "z" * i
            add_case(f's = "{all_same}"', 1, False, "edge_case", f"[All Same] Len {i}")

        iteration = 0
        while len(tests) < 265:
            iteration += 1
            alphabet = "abcdefghijklmnopqrstuvwxyz"[:rng.randint(3, 26)]
            s = "".join(rng.choice(alphabet) for _ in range(rng.randint(5, 80)))
            add_case(f's = "{s}"', ReferenceSolvers.length_of_longest_substring(s), False, "hidden", f"[Random String] #{iteration}")

    # 5. VRQ-000007: Number of Islands (Medium, >= 250)
    elif verniq_id == "VRQ-000007":
        g1 = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]
        add_case(f'grid = {json.dumps(g1)}', ReferenceSolvers.num_islands(g1), True, "sample", "[Sample] 1 island")
        g2 = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]
        add_case(f'grid = {json.dumps(g2)}', ReferenceSolvers.num_islands(g2), True, "sample", "[Sample] 3 islands")
        add_case('grid = [["1"]]', 1, False, "edge_case", "[Boundary] 1x1 land")
        add_case('grid = [["0"]]', 0, False, "edge_case", "[Boundary] 1x1 water")

        iteration = 0
        while len(tests) < 265:
            iteration += 1
            r = rng.randint(2, 15)
            c = rng.randint(2, 15)
            density = rng.uniform(0.1, 0.8)
            grid = [[ "1" if rng.random() < density else "0" for _ in range(c)] for _ in range(r)]
            add_case(f'grid = {json.dumps(grid)}', ReferenceSolvers.num_islands(grid), False, "hidden", f"[Grid Island Map] {r}x{c} #{iteration}")

    # 6. VRQ-000011: Maximum Subarray (Medium, >= 250)
    elif verniq_id == "VRQ-000011":
        add_case('nums = [-2,1,-3,4,-1,2,1,-5,4]', 6, True, "sample", "[Sample] Classic Kadane")
        add_case('nums = [1]', 1, True, "sample", "[Sample] Single element")
        add_case('nums = [5,4,-1,7,8]', 23, True, "sample", "[Sample] Mostly positive")
        add_case('nums = [-5,-2,-8,-1]', -1, False, "edge_case", "[Boundary] All negative")

        iteration = 0
        while len(tests) < 265:
            iteration += 1
            length = rng.randint(3, 50)
            nums = [rng.randint(-100, 100) for _ in range(length)]
            add_case(f'nums = {json.dumps(nums)}', ReferenceSolvers.max_sub_array(nums), False, "hidden", f"[Kadane Vector] Len {length} #{iteration}")

    # 7. VRQ-000019: Merge k Sorted Lists (Hard, >= 300)
    elif verniq_id == "VRQ-000019":
        add_case('lists = [[1,4,5],[1,3,4],[2,6]]', [1,1,2,3,4,4,5,6], True, "sample", "[Sample] 3 sorted lists")
        add_case('lists = []', [], True, "sample", "[Sample] Empty lists")
        add_case('lists = [[]]', [], True, "sample", "[Sample] Single empty list")
        add_case('lists = [[], [1], []]', [1], False, "edge_case", "[Boundary] Mixed empty and non-empty")

        iteration = 0
        while len(tests) < 315:
            iteration += 1
            k = rng.randint(2, 12)
            lists = []
            for _ in range(k):
                size = rng.randint(0, 15)
                sub = sorted(rng.randint(-50, 50) for _ in range(size))
                lists.append(sub)
            add_case(f'lists = {json.dumps(lists)}', ReferenceSolvers.merge_k_lists(lists), False, "hidden" if iteration % 2 == 0 else "stress", f"[Multi-List Merge] k={k} #{iteration}")

    # 8. VRQ-000020: Sliding Window Maximum (Hard, >= 300)
    elif verniq_id == "VRQ-000020":
        add_case('nums = [1,3,-1,-3,5,3,6,7], k = 3', [3,3,5,5,6,7], True, "sample", "[Sample] k=3")
        add_case('nums = [1], k = 1', [1], True, "sample", "[Sample] Single element")
        add_case('nums = [1,-1], k = 1', [1,-1], False, "edge_case", "[Boundary] k=1 identity")

        iteration = 0
        while len(tests) < 315:
            iteration += 1
            n = rng.randint(5, 50)
            k = rng.randint(1, n)
            nums = [rng.randint(-100, 100) for _ in range(n)]
            add_case(f'nums = {json.dumps(nums)}, k = {k}', ReferenceSolvers.max_sliding_window(nums, k), False, "hidden", f"[Sliding Window] n={n}, k={k} #{iteration}")

    # 9. VRQ-000021: Median of Two Sorted Arrays (Hard, >= 300)
    elif verniq_id == "VRQ-000021":
        add_case('nums1 = [1,3], nums2 = [2]', 2.0, True, "sample", "[Sample] Odd total")
        add_case('nums1 = [1,2], nums2 = [3,4]', 2.5, True, "sample", "[Sample] Even total")
        add_case('nums1 = [], nums2 = [1]', 1.0, False, "edge_case", "[Boundary] One array empty")
        add_case('nums1 = [2], nums2 = []', 2.0, False, "edge_case", "[Boundary] Other array empty")

        iteration = 0
        while len(tests) < 315:
            iteration += 1
            m = rng.randint(0, 30)
            n = rng.randint(1 if m == 0 else 0, 30)
            n1 = sorted(rng.randint(-200, 200) for _ in range(m))
            n2 = sorted(rng.randint(-200, 200) for _ in range(n))
            add_case(f'nums1 = {json.dumps(n1)}, nums2 = {json.dumps(n2)}', ReferenceSolvers.find_median_sorted_arrays(n1, n2), False, "hidden", f"[Median Search] {m}+{n} #{iteration}")

    # 10. VRQ-000022: Course Schedule (Medium, >= 250)
    elif verniq_id == "VRQ-000022":
        add_case('numCourses = 2, prerequisites = [[1,0]]', True, True, "sample", "[Sample] Feasible DAG")
        add_case('numCourses = 2, prerequisites = [[1,0],[0,1]]', False, True, "sample", "[Sample] Direct cycle")
        add_case('numCourses = 1, prerequisites = []', True, False, "edge_case", "[Boundary] No prerequisites")
        add_case('numCourses = 3, prerequisites = [[0,1],[1,2],[2,0]]', False, False, "edge_case", "[Boundary] 3-cycle")

        iteration = 0
        while len(tests) < 265:
            iteration += 1
            nc = rng.randint(3, 20)
            edge_count = rng.randint(0, nc * 2)
            edges = []
            for _ in range(edge_count):
                u, v = rng.randint(0, nc - 1), rng.randint(0, nc - 1)
                if u != v and [u, v] not in edges:
                    edges.append([u, v])
            add_case(f'numCourses = {nc}, prerequisites = {json.dumps(edges)}', ReferenceSolvers.can_finish(nc, edges), False, "hidden", f"[DAG Cycle Test] V={nc} E={len(edges)} #{iteration}")

    # 11. VRQ-000025: Koko Eating Bananas (Medium, >= 250)
    elif verniq_id == "VRQ-000025":
        add_case('piles = [3,6,7,11], h = 8', 4, True, "sample", "[Sample] Standard")
        add_case('piles = [30,11,23,4,20], h = 5', 30, True, "sample", "[Sample] h equals len(piles)")
        add_case('piles = [30,11,23,4,20], h = 6', 23, True, "sample", "[Sample] Standard 2")
        add_case('piles = [1000], h = 1000', 1, False, "edge_case", "[Boundary] Single pile, ample hours")

        iteration = 0
        while len(tests) < 265:
            iteration += 1
            n = rng.randint(2, 25)
            piles = [rng.randint(1, 500) for _ in range(n)]
            h = rng.randint(n, sum(piles) + 10)
            add_case(f'piles = {json.dumps(piles)}, h = {h}', ReferenceSolvers.min_eating_speed(piles, h), False, "hidden", f"[Binary Search Speed] n={n} h={h} #{iteration}")

    # 12. VRQ-000030: Move Zeroes (Easy, >= 200)
    elif verniq_id == "VRQ-000030":
        add_case('nums = [0,1,0,3,12]', [1,3,12,0,0], True, "sample", "[Sample] Standard mixed")
        add_case('nums = [0]', [0], True, "sample", "[Sample] Single zero")
        add_case('nums = [1,2,3]', [1,2,3], False, "edge_case", "[Boundary] No zeroes")
        add_case('nums = [0,0,0]', [0,0,0], False, "edge_case", "[Boundary] All zeroes")

        iteration = 0
        while len(tests) < 215:
            iteration += 1
            n = rng.randint(2, 40)
            zero_prob = rng.uniform(0.1, 0.7)
            nums = [0 if rng.random() < zero_prob else rng.randint(-50, 50) for _ in range(n)]
            add_case(f'nums = {json.dumps(nums)}', ReferenceSolvers.move_zeroes(list(nums)), False, "hidden", f"[Zero Compaction] Len {n} #{iteration}")

    # 13. VRQ-000031: Valid Anagram (Easy, >= 200)
    elif verniq_id == "VRQ-000031":
        add_case('s = "anagram", t = "nagaram"', True, True, "sample", "[Sample] anagram/nagaram")
        add_case('s = "rat", t = "car"', False, True, "sample", "[Sample] rat/car")
        add_case('s = "a", t = "a"', True, False, "edge_case", "[Boundary] Single char match")
        add_case('s = "a", t = "b"', False, False, "edge_case", "[Boundary] Single char mismatch")

        iteration = 0
        while len(tests) < 215:
            iteration += 1
            length = rng.randint(2, 30)
            alphabet = "abcdefghijklmnopqrstuvwxyz"[:rng.randint(2, 26)]
            chars = [rng.choice(alphabet) for _ in range(length)]
            s = "".join(chars)
            if rng.random() < 0.5:
                # Valid anagram
                t_chars = list(chars)
                rng.shuffle(t_chars)
                t = "".join(t_chars)
            else:
                # Altered
                t = "".join(rng.choice(alphabet) for _ in range(length if rng.random() < 0.8 else length + 1))
            add_case(f's = "{s}", t = "{t}"', ReferenceSolvers.is_anagram(s, t), False, "hidden", f"[Anagram Test] #{iteration}")

    # 14. VRQ-000032: Word Ladder (Hard, >= 300)
    elif verniq_id == "VRQ-000032":
        w1 = ["hot","dot","dog","lot","log","cog"]
        add_case('beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', 5, True, "sample", "[Sample] Reachable ladder")
        w2 = ["hot","dot","dog","lot","log"]
        add_case('beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]', 0, True, "sample", "[Sample] Unreachable ladder")
        add_case('beginWord = "a", endWord = "c", wordList = ["a","b","c"]', 2, False, "edge_case", "[Boundary] 1-step ladder")

        # Systematic word ladder generation
        vocab_base = ["cat", "bat", "rat", "hat", "hot", "dot", "dog", "cog", "fog", "fig", "big", "bag", "bog", "log", "lot"]
        iteration = 0
        while len(tests) < 315:
            iteration += 1
            bw = rng.choice(vocab_base)
            ew = rng.choice([w for w in vocab_base if w != bw])
            sub_vocab = list(set([ew] + rng.sample(vocab_base, rng.randint(4, len(vocab_base)))))
            ans = ReferenceSolvers.ladder_length(bw, ew, sub_vocab)
            add_case(f'beginWord = "{bw}", endWord = "{ew}", wordList = {json.dumps(sub_vocab)}', ans, False, "hidden", f"[Word Ladder Graph] #{iteration}")

    # 15. VRQ-000033: Coin Change (Medium, >= 250)
    elif verniq_id == "VRQ-000033":
        add_case('coins = [1,2,5], amount = 11', 3, True, "sample", "[Sample] Classic 11")
        add_case('coins = [2], amount = 3', -1, True, "sample", "[Sample] Unreachable")
        add_case('coins = [1], amount = 0', 0, True, "sample", "[Sample] Zero amount")
        add_case('coins = [1,3,4], amount = 6', 2, False, "edge_case", "[Adversarial] Greedy trap")

        iteration = 0
        while len(tests) < 265:
            iteration += 1
            coin_count = rng.randint(1, 6)
            coins = sorted(list(set(rng.randint(1, 20) for _ in range(coin_count))))
            amount = rng.randint(0, 150)
            ans = ReferenceSolvers.coin_change(coins, amount)
            add_case(f'coins = {json.dumps(coins)}, amount = {amount}', ans, False, "hidden", f"[Coin System] #{iteration}")

    # 16. VRQ-000041: Merge Two Sorted Lists (Easy, >= 200)
    elif verniq_id == "VRQ-000041":
        add_case('list1 = [1,2,4], list2 = [1,3,4]', [1,1,2,3,4,4], True, "sample", "[Sample] Overlapping lists")
        add_case('list1 = [], list2 = []', [], True, "sample", "[Sample] Both empty")
        add_case('list1 = [], list2 = [0]', [0], True, "sample", "[Sample] One empty")

        iteration = 0
        while len(tests) < 215:
            iteration += 1
            s1 = rng.randint(0, 20)
            s2 = rng.randint(0, 20)
            l1 = sorted(rng.randint(-50, 50) for _ in range(s1))
            l2 = sorted(rng.randint(-50, 50) for _ in range(s2))
            add_case(f'list1 = {json.dumps(l1)}, list2 = {json.dumps(l2)}', ReferenceSolvers.merge_two_lists(l1, l2), False, "hidden", f"[Sorted List Merge] #{iteration}")

    # 17. VRQ-000043: Climbing Stairs (Easy, >= 200)
    elif verniq_id == "VRQ-000043":
        add_case('n = 2', 2, True, "sample", "[Sample] n=2")
        add_case('n = 3', 3, True, "sample", "[Sample] n=3")
        add_case('n = 1', 1, False, "edge_case", "[Boundary] n=1")

        for n in range(4, 218):
            add_case(f'n = {n}', ReferenceSolvers.climb_stairs(n), False, "hidden", f"[Fibonacci Step Count] n={n}")

    # 18. VRQ-000056: Jump Game (Medium, >= 250)
    elif verniq_id == "VRQ-000056":
        add_case('nums = [2,3,1,1,4]', True, True, "sample", "[Sample] Feasible jump")
        add_case('nums = [3,2,1,0,4]', False, True, "sample", "[Sample] Trapped by zero")
        add_case('nums = [0]', True, False, "edge_case", "[Boundary] Single zero (already at end)")
        add_case('nums = [0,1]', False, False, "edge_case", "[Boundary] Trapped at start")

        iteration = 0
        while len(tests) < 265:
            iteration += 1
            size = rng.randint(2, 35)
            nums = [rng.randint(0, 5) for _ in range(size)]
            add_case(f'nums = {json.dumps(nums)}', ReferenceSolvers.can_jump(nums), False, "hidden", f"[Jump Reachability] Len {size} #{iteration}")

    # 19. VRQ-000065: Largest Rectangle in Histogram (Hard, >= 300)
    elif verniq_id == "VRQ-000065":
        add_case('heights = [2,1,5,6,2,3]', 10, True, "sample", "[Sample] Standard histogram")
        add_case('heights = [2,4]', 4, True, "sample", "[Sample] Two bars")
        add_case('heights = [1]', 1, False, "edge_case", "[Boundary] Single bar")
        add_case('heights = [0,0,0]', 0, False, "edge_case", "[Boundary] All zero heights")

        iteration = 0
        while len(tests) < 315:
            iteration += 1
            size = rng.randint(2, 40)
            if iteration < 30:
                heights = sorted(rng.randint(1, 50) for _ in range(size))
            elif iteration < 60:
                heights = sorted((rng.randint(1, 50) for _ in range(size)), reverse=True)
            elif iteration < 90:
                val = rng.randint(1, 30)
                heights = [val] * size
            else:
                heights = [rng.randint(0, 100) for _ in range(size)]
            add_case(f'heights = {json.dumps(heights)}', ReferenceSolvers.largest_rectangle_area(heights), False, "hidden", f"[Histogram Stack] #{iteration}")

    # 20. VRQ-000119: Validate Binary Search Tree (Medium, >= 250)
    elif verniq_id == "VRQ-000119":
        add_case('root = [2,1,3]', True, True, "sample", "[Sample] Valid BST")
        add_case('root = [5,1,4,null,null,3,6]', False, True, "sample", "[Sample] Invalid BST")
        add_case('root = [1]', True, False, "edge_case", "[Boundary] Single node")
        add_case('root = [2,2,2]', False, False, "edge_case", "[Boundary] Duplicate values")

        iteration = 0
        while len(tests) < 265:
            iteration += 1
            size = rng.choice([3, 7, 15])
            if rng.random() < 0.5:
                # Valid BST
                vals = sorted(rng.sample(range(-100, 100), size))
                def to_bst(arr):
                    if not arr: return None
                    mid = len(arr) // 2
                    return [arr[mid], to_bst(arr[:mid]), to_bst(arr[mid+1:])]
                
                tree_struct = to_bst(vals)
                level_order = []
                q = deque([tree_struct])
                while q:
                    cur = q.popleft()
                    if cur:
                        level_order.append(cur[0])
                        q.append(cur[1])
                        q.append(cur[2])
                    else:
                        level_order.append(None)
                while level_order and level_order[-1] is None:
                    level_order.pop()
                tree_rep = level_order
            else:
                tree_rep = [rng.randint(-50, 50) if rng.random() < 0.8 else None for _ in range(size)]
                if tree_rep[0] is None:
                    tree_rep[0] = 0
            
            raw_tree = json.dumps(tree_rep).replace('null', 'null')
            ans = ReferenceSolvers.is_valid_bst(tree_rep)
            add_case(f'root = {raw_tree}', ans, False, "hidden", f"[BST Traversal] Size {size} #{iteration}")

    return tests

    return tests
