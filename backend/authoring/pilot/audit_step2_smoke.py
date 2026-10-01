"""
Step 2: Smoke test all 20 published pilot problems with canonical correct Java solutions.
Produces audit table before fixes are applied.
"""

import json
import urllib.request
from typing import Dict, Any, List
from backend.importer.importer import ProblemCatalogImporter

# Canonical correct Java solutions for all 20 pilot problems
CANONICAL_JAVA_SOLUTIONS = {
    "VRQ-000002": """
class LRUCache {
    private int capacity;
    private java.util.LinkedHashMap<Integer, Integer> map;
    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new java.util.LinkedHashMap<>(capacity, 0.75f, true);
    }
    public int get(int key) {
        return map.getOrDefault(key, -1);
    }
    public void put(int key, int value) {
        if (!map.containsKey(key) && map.size() >= capacity) {
            java.util.Iterator<Integer> it = map.keySet().iterator();
            it.next();
            it.remove();
        }
        map.put(key, value);
    }
}
""",
    "VRQ-000003": """
class Solution {
    public int[][] merge(int[][] intervals) {
        if (intervals.length <= 1) return intervals;
        java.util.Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        java.util.List<int[]> res = new java.util.ArrayList<>();
        int[] curr = intervals[0];
        res.add(curr);
        for (int[] interval : intervals) {
            if (curr[1] >= interval[0]) {
                curr[1] = Math.max(curr[1], interval[1]);
            } else {
                curr = interval;
                res.add(curr);
            }
        }
        return res.toArray(new int[res.size()][]);
    }
}
""",
    "VRQ-000004": """
class Solution {
    public boolean isValid(String s) {
        java.util.Stack<Character> stack = new java.util.Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}
""",
    "VRQ-000005": """
class Solution {
    public int lengthOfLongestSubstring(String s) {
        int[] map = new int[128];
        int start = 0, maxLen = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            start = Math.max(start, map[c]);
            maxLen = Math.max(maxLen, i - start + 1);
            map[c] = i + 1;
        }
        return maxLen;
    }
}
""",
    "VRQ-000007": """
class Solution {
    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;
        int count = 0;
        for (int i = 0; i < grid.length; i++) {
            for (int j = 0; j < grid[0].length; j++) {
                if (grid[i][j] == '1') {
                    dfs(grid, i, j);
                    count++;
                }
            }
        }
        return count;
    }
    private void dfs(char[][] grid, int i, int j) {
        if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length || grid[i][j] != '1') return;
        grid[i][j] = '0';
        dfs(grid, i + 1, j);
        dfs(grid, i - 1, j);
        dfs(grid, i, j + 1);
        dfs(grid, i, j - 1);
    }
}
""",
    "VRQ-000011": """
class Solution {
    public int maxSubArray(int[] nums) {
        int max = nums[0], cur = nums[0];
        for (int i = 1; i < nums.length; i++) {
            cur = Math.max(nums[i], cur + nums[i]);
            max = Math.max(max, cur);
        }
        return max;
    }
}
""",
    "VRQ-000019": """
class Solution {
    public ListNode mergeKLists(ListNode[] lists) {
        if (lists == null || lists.length == 0) return null;
        java.util.PriorityQueue<ListNode> pq = new java.util.PriorityQueue<>((a, b) -> a.val - b.val);
        for (ListNode node : lists) {
            if (node != null) pq.add(node);
        }
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        while (!pq.isEmpty()) {
            tail.next = pq.poll();
            tail = tail.next;
            if (tail.next != null) pq.add(tail.next);
        }
        return dummy.next;
    }
}
""",
    "VRQ-000020": """
class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        if (nums == null || nums.length == 0) return new int[0];
        int[] res = new int[nums.length - k + 1];
        java.util.Deque<Integer> q = new java.util.ArrayDeque<>();
        for (int i = 0; i < nums.length; i++) {
            while (!q.isEmpty() && q.peekFirst() < i - k + 1) q.pollFirst();
            while (!q.isEmpty() && nums[q.peekLast()] < nums[i]) q.pollLast();
            q.offerLast(i);
            if (i >= k - 1) res[i - k + 1] = nums[q.peekFirst()];
        }
        return res;
    }
}
""",
    "VRQ-000021": """
class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        int m = nums1.length, n = nums2.length;
        int[] merged = new int[m + n];
        int i = 0, j = 0, k = 0;
        while (i < m && j < n) merged[k++] = (nums1[i] < nums2[j]) ? nums1[i++] : nums2[j++];
        while (i < m) merged[k++] = nums1[i++];
        while (j < n) merged[k++] = nums2[j++];
        int total = m + n;
        if (total % 2 == 1) return merged[total / 2];
        return (merged[total / 2 - 1] + merged[total / 2]) / 2.0;
    }
}
""",
    "VRQ-000022": """
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        int[] inDegree = new int[numCourses];
        java.util.List<java.util.List<Integer>> adj = new java.util.ArrayList<>();
        for (int i = 0; i < numCourses; i++) adj.add(new java.util.ArrayList<>());
        for (int[] p : prerequisites) {
            adj.get(p[1]).add(p[0]);
            inDegree[p[0]]++;
        }
        java.util.Queue<Integer> q = new java.util.LinkedList<>();
        for (int i = 0; i < numCourses; i++) if (inDegree[i] == 0) q.add(i);
        int count = 0;
        while (!q.isEmpty()) {
            int c = q.poll();
            count++;
            for (int next : adj.get(c)) {
                if (--inDegree[next] == 0) q.add(next);
            }
        }
        return count == numCourses;
    }
}
""",
    "VRQ-000025": """
class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int low = 1, high = 1;
        for (int p : piles) high = Math.max(high, p);
        while (low < high) {
            int mid = low + (high - low) / 2;
            int hours = 0;
            for (int p : piles) hours += (p + mid - 1) / mid;
            if (hours <= h) high = mid;
            else low = mid + 1;
        }
        return low;
    }
}
""",
    "VRQ-000030": """
class Solution {
    public void moveZeroes(int[] nums) {
        int pos = 0;
        for (int num : nums) {
            if (num != 0) nums[pos++] = num;
        }
        while (pos < nums.length) nums[pos++] = 0;
    }
}
""",
    "VRQ-000031": """
class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] count = new int[26];
        for (char c : s.toCharArray()) count[c - 'a']++;
        for (char c : t.toCharArray()) {
            if (--count[c - 'a'] < 0) return false;
        }
        return true;
    }
}
""",
    "VRQ-000032": """
class Solution {
    public int ladderLength(String beginWord, String endWord, java.util.List<String> wordList) {
        java.util.Set<String> set = new java.util.HashSet<>(wordList);
        if (!set.contains(endWord)) return 0;
        java.util.Queue<String> q = new java.util.LinkedList<>();
        q.add(beginWord);
        int level = 1;
        while (!q.isEmpty()) {
            int size = q.size();
            for (int i = 0; i < size; i++) {
                String cur = q.poll();
                char[] chars = cur.toCharArray();
                for (int j = 0; j < chars.length; j++) {
                    char orig = chars[j];
                    for (char c = 'a'; c <= 'z'; c++) {
                        chars[j] = c;
                        String next = new String(chars);
                        if (next.equals(endWord)) return level + 1;
                        if (set.remove(next)) q.add(next);
                    }
                    chars[j] = orig;
                }
            }
            level++;
        }
        return 0;
    }
}
""",
    "VRQ-000033": """
class Solution {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        java.util.Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int coin : coins) {
            for (int i = coin; i <= amount; i++) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
}
""",
    "VRQ-000041": """
class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        ListNode dummy = new ListNode(0);
        ListNode cur = dummy;
        while (list1 != null && list2 != null) {
            if (list1.val <= list2.val) {
                cur.next = list1;
                list1 = list1.next;
            } else {
                cur.next = list2;
                list2 = list2.next;
            }
            cur = cur.next;
        }
        cur.next = (list1 != null) ? list1 : list2;
        return dummy.next;
    }
}
""",
    "VRQ-000043": """
class Solution {
    public int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
}
""",
    "VRQ-000056": """
class Solution {
    public boolean canJump(int[] nums) {
        int maxReach = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > maxReach) return false;
            maxReach = Math.max(maxReach, i + nums[i]);
        }
        return true;
    }
}
""",
    "VRQ-000065": """
class Solution {
    public int largestRectangleArea(int[] heights) {
        java.util.Stack<Integer> stack = new java.util.Stack<>();
        int maxArea = 0, n = heights.length;
        for (int i = 0; i <= n; i++) {
            int h = (i == n) ? 0 : heights[i];
            while (!stack.isEmpty() && heights[stack.peek()] >= h) {
                int height = heights[stack.pop()];
                int width = stack.isEmpty() ? i : i - 1 - stack.peek();
                maxArea = Math.max(maxArea, height * width);
            }
            stack.push(i);
        }
        return maxArea;
    }
}
""",
    "VRQ-000119": """
class Solution {
    public boolean isValidBST(TreeNode root) {
        return validate(root, null, null);
    }
    private boolean validate(TreeNode node, Integer min, Integer max) {
        if (node == null) return true;
        if ((min != null && node.val <= min) || (max != null && node.val >= max)) return false;
        return validate(node.left, min, node.val) && validate(node.right, node.val, max);
    }
}
"""
}

def run_step2_smoke():
    imp = ProblemCatalogImporter()
    results = []

    print(f"{'Verniq ID':<12} | {'Title':<30} | {'Lang':<6} | {'Test ID':<10} | {'Expected':<12} | {'Actual':<25} | {'Verdict':<12} | {'Status'}")
    print("-" * 125)

    for verniq_id, sol_code in CANONICAL_JAVA_SOLUTIONS.items():
        probs = imp.run_query(f"SELECT id, verniq_id, title FROM public.problems WHERE verniq_id = '{verniq_id}';")
        if not probs:
            continue
        prob = probs[0]
        prob_id = prob["id"]
        sample_tests = imp.run_query(f"""
            SELECT id, input, expected_output, is_sample 
            FROM public.test_cases 
            WHERE problem_id = '{prob_id}' AND is_sample = true 
            ORDER BY order_index 
            LIMIT 1;
        """)
        if not sample_tests:
            continue
        test = sample_tests[0]

        payload = {
            "execution_id": f"step2-smoke-{verniq_id}",
            "language": "java",
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

        actual = (res.get("stdout_output") or "").strip().replace("\n", " ")[:24]
        expected = (test.get("expected_output") or "").strip()[:11]
        verdict = res.get("verdict", "error")
        status = "PASS" if verdict == "accepted" else "FAIL"

        print(f"{verniq_id:<12} | {prob['title'][:30]:<30} | {'java':<6} | {test['id'][:8]:<10} | {expected:<12} | {actual:<25} | {verdict:<12} | {status}")

if __name__ == "__main__":
    run_step2_smoke()
