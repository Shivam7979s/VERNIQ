"""
Test the 20 pilot problems with Python canonical solutions against live worker.
"""
import json
import urllib.request
from backend.importer.importer import ProblemCatalogImporter
from backend.authoring.pilot.specs import PILOT_SPECS

# Python reference solvers from generators
from backend.authoring.pilot.generators import ReferenceSolvers

CANONICAL_PY_SOLUTIONS = {
    "VRQ-000002": """
class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        from collections import OrderedDict
        self.cache = OrderedDict()
    def get(self, key: int) -> int:
        if key not in self.cache: return -1
        self.cache.move_to_end(key)
        return self.cache[key]
    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)
""",
    "VRQ-000003": """
class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        intervals.sort(key=lambda x: x[0])
        merged = []
        for interval in intervals:
            if not merged or merged[-1][1] < interval[0]:
                merged.append(interval)
            else:
                merged[-1][1] = max(merged[-1][1], interval[1])
        return merged
""",
    "VRQ-000004": """
class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        mapping = {')': '(', '}': '{', ']': '['}
        for ch in s:
            if ch in mapping:
                top = stack.pop() if stack else '#'
                if mapping[ch] != top: return False
            else:
                stack.append(ch)
        return len(stack) == 0
""",
    "VRQ-000005": """
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        char_map = {}
        left = 0
        max_len = 0
        for right, ch in enumerate(s):
            if ch in char_map and char_map[ch] >= left:
                left = char_map[ch] + 1
            char_map[ch] = right
            max_len = max(max_len, right - left + 1)
        return max_len
""",
    "VRQ-000007": """
class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        if not grid or not grid[0]: return 0
        m, n = len(grid), len(grid[0])
        count = 0
        def dfs(i, j):
            if i < 0 or i >= m or j < 0 or j >= n or grid[i][j] != '1': return
            grid[i][j] = '0'
            dfs(i+1, j); dfs(i-1, j); dfs(i, j+1); dfs(i, j-1)
        for i in range(m):
            for j in range(n):
                if grid[i][j] == '1':
                    dfs(i, j)
                    count += 1
        return count
""",
    "VRQ-000011": """
class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        cur = max_sum = nums[0]
        for x in nums[1:]:
            cur = max(x, cur + x)
            max_sum = max(max_sum, cur)
        return max_sum
""",
    "VRQ-000019": """
class Solution:
    def mergeKLists(self, lists: list) -> list:
        import heapq
        h = []
        for i, node in enumerate(lists):
            if node:
                heapq.heappush(h, (node.val, i, node))
        dummy = ListNode(0)
        curr = dummy
        while h:
            val, i, node = heapq.heappop(h)
            curr.next = node
            curr = curr.next
            if node.next:
                heapq.heappush(h, (node.next.val, i, node.next))
        return dummy.next
""",
    "VRQ-000020": """
class Solution:
    def maxSlidingWindow(self, nums: list[int], k: int) -> list[int]:
        from collections import deque
        q = deque()
        res = []
        for i, x in enumerate(nums):
            while q and q[0] < i - k + 1: q.popleft()
            while q and nums[q[-1]] < x: q.pop()
            q.append(i)
            if i >= k - 1: res.append(nums[q[0]])
        return res
""",
    "VRQ-000021": """
class Solution:
    def findMedianSortedArrays(self, nums1: list[int], nums2: list[int]) -> float:
        merged = sorted(nums1 + nums2)
        n = len(merged)
        if n % 2 == 1: return float(merged[n//2])
        return (merged[n//2 - 1] + merged[n//2]) / 2.0
""",
    "VRQ-000022": """
class Solution:
    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:
        from collections import deque
        in_degree = [0] * numCourses
        adj = [[] for _ in range(numCourses)]
        for dest, src in prerequisites:
            adj[src].append(dest)
            in_degree[dest] += 1
        q = deque([i for i in range(numCourses) if in_degree[i] == 0])
        count = 0
        while q:
            node = q.popleft()
            count += 1
            for nxt in adj[node]:
                in_degree[nxt] -= 1
                if in_degree[nxt] == 0: q.append(nxt)
        return count == numCourses
""",
    "VRQ-000025": """
class Solution:
    def minEatingSpeed(self, piles: list[int], h: int) -> int:
        import math
        low, high = 1, max(piles)
        while low < high:
            mid = (low + high) // 2
            hours = sum(math.ceil(p / mid) for p in piles)
            if hours <= h: high = mid
            else: low = mid + 1
        return low
""",
    "VRQ-000030": """
class Solution:
    def moveZeroes(self, nums: list[int]) -> None:
        pos = 0
        for x in nums:
            if x != 0:
                nums[pos] = x
                pos += 1
        for i in range(pos, len(nums)):
            nums[i] = 0
""",
    "VRQ-000031": """
class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        from collections import Counter
        return Counter(s) == Counter(t)
""",
    "VRQ-000032": """
class Solution:
    def ladderLength(self, beginWord: str, endWord: str, wordList: list[str]) -> int:
        from collections import deque
        word_set = set(wordList)
        if endWord not in word_set: return 0
        q = deque([(beginWord, 1)])
        while q:
            word, level = q.popleft()
            if word == endWord: return level
            for i in range(len(word)):
                for c in 'abcdefghijklmnopqrstuvwxyz':
                    next_word = word[:i] + c + word[i+1:]
                    if next_word in word_set:
                        word_set.remove(next_word)
                        q.append((next_word, level + 1))
        return 0
""",
    "VRQ-000033": """
class Solution:
    def coinChange(self, coins: list[int], amount: int) -> int:
        dp = [float('inf')] * (amount + 1)
        dp[0] = 0
        for c in coins:
            for i in range(c, amount + 1):
                dp[i] = min(dp[i], dp[i - c] + 1)
        return dp[amount] if dp[amount] != float('inf') else -1
""",
    "VRQ-000041": """
class Solution:
    def mergeTwoLists(self, list1, list2):
        dummy = ListNode(0)
        cur = dummy
        while list1 and list2:
            if list1.val <= list2.val:
                cur.next = list1
                list1 = list1.next
            else:
                cur.next = list2
                list2 = list2.next
            cur = cur.next
        cur.next = list1 or list2
        return dummy.next
""",
    "VRQ-000043": """
class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 2: return n
        a, b = 1, 2
        for _ in range(3, n + 1):
            a, b = b, a + b
        return b
""",
    "VRQ-000056": """
class Solution:
    def canJump(self, nums: list[int]) -> bool:
        max_reach = 0
        for i, x in enumerate(nums):
            if i > max_reach: return False
            max_reach = max(max_reach, i + x)
        return True
""",
    "VRQ-000065": """
class Solution:
    def largestRectangleArea(self, heights: list[int]) -> int:
        stack = []
        max_area = 0
        for i, h in enumerate(heights + [0]):
            while stack and heights[stack[-1]] >= h:
                height = heights[stack.pop()]
                width = i if not stack else i - stack[-1] - 1
                max_area = max(max_area, height * width)
            stack.append(i)
        return max_area
""",
    "VRQ-000119": """
class Solution:
    def isValidBST(self, root) -> bool:
        def valid(node, low, high):
            if not node: return True
            if not (low < node.val < high): return False
            return valid(node.left, low, node.val) and valid(node.right, node.val, high)
        return valid(root, float('-inf'), float('inf'))
"""
}

def run_py_smoke():
    imp = ProblemCatalogImporter()
    print(f"{'Verniq ID':<12} | {'Title':<30} | {'Lang':<6} | {'Verdict':<12} | {'Output':<30}")
    print("-" * 95)
    for verniq_id, sol_code in CANONICAL_PY_SOLUTIONS.items():
        probs = imp.run_query(f"SELECT id, verniq_id, title FROM public.problems WHERE verniq_id = '{verniq_id}';")
        if not probs: continue
        prob = probs[0]
        tests = imp.run_query(f"SELECT id, input, expected_output FROM public.test_cases WHERE problem_id = '{prob['id']}' AND is_sample = true LIMIT 1;")
        if not tests: continue
        test = tests[0]

        payload = {
            "execution_id": f"smoke-py-{verniq_id}",
            "language": "python",
            "source_code": sol_code,
            "is_custom_run": True,
            "test_cases": [test],
            "mode": "RUN"
        }
        try:
            req = urllib.request.Request(
                "http://127.0.0.1:8080/execute",
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                res = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            res = {"verdict": "error", "stdout_output": str(e)}

        actual = (res.get("stdout_output") or "").strip().replace("\n", " ")[:28]
        print(f"{verniq_id:<12} | {prob['title'][:30]:<30} | {'python':<6} | {res.get('verdict'):<12} | {actual}")

if __name__ == "__main__":
    run_py_smoke()
