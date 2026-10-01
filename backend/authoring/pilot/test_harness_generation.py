"""
Unit test for testing harness injection across all 20 pilot + 6 canonical problems.
"""

from backend.judge.src.runner.harness import detect_solution_method, inject_harness

METHODS = [
    "twoSum", "maxProfit", "threeSum", "search", "maxArea", "trap",
    "LRUCache", "merge", "isValid", "lengthOfLongestSubstring", "numIslands",
    "maxSubArray", "mergeKLists", "maxSlidingWindow", "findMedianSortedArrays",
    "canFinish", "minEatingSpeed", "moveZeroes", "isAnagram", "ladderLength",
    "coinChange", "mergeTwoLists", "climbStairs", "canJump", "largestRectangleArea",
    "isValidBST"
]

def test_detection():
    print(f"Testing method detection for {len(METHODS)} methods...")
    for m in METHODS:
        code = f"class Solution {{ public void {m}() {{}} }}"
        detected = detect_solution_method(code)
        assert detected == m, f"Expected {m}, got {detected}"
    print("Method detection: ALL 26 PASSED.")

if __name__ == "__main__":
    test_detection()
