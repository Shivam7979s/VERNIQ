import type { Problem, Roadmap, TestCase } from '@/types';

export const FALLBACK_PROBLEMS: Problem[] = [
  {
    id: 'prob-00000001-0000-0000-0000-000000000001',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'easy',
    acceptance_rate: 82.4,
    description_markdown: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order. Formulate an invariant that proves each complement lookup is safe and guarantees $O(n)$ time complexity.`,
    constraints_markdown: `- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- Only one valid answer exists.`,
    starter_templates: {
      cpp: `#include <vector>
#include <unordered_map>

class Solution {
public:
    std::vector<int> twoSum(std::vector<int>& nums, int target) {
        std::unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); ++i) {
            int complement = target - nums[i];
            if (seen.count(complement)) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []`,
      java: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
    const seen = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement)!, i];
        }
        seen.set(nums[i], i);
    }
    return [];
}`,
    },
    is_premium: false,
    is_published: true,
    tags: ['Arrays', 'Hash Map'],
    status: 'solved',
    revision_due: true,
  },
  {
    id: 'prob-00000002-0000-0000-0000-000000000002',
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    difficulty: 'easy',
    acceptance_rate: 76.5,
    description_markdown: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i-th\` day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.`,
    constraints_markdown: `- \`1 <= prices.length <= 10^5\`
- \`0 <= prices[i] <= 10^4\``,
    starter_templates: {
      cpp: `#include <vector>
#include <algorithm>

class Solution {
public:
    int maxProfit(std::vector<int>& prices) {
        int minPrice = 1e9, maxProfit = 0;
        for (int price : prices) {
            minPrice = std::min(minPrice, price);
            maxProfit = std::max(maxProfit, price - minPrice);
        }
        return maxProfit;
    }
};`,
      python: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        min_price, max_profit = float("inf"), 0
        for p in prices:
            min_price = min(min_price, p)
            max_profit = max(max_profit, p - min_price)
        return max_profit`,
      java: `class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE;
        int maxProfit = 0;
        for (int p : prices) {
            if (p < minPrice) minPrice = p;
            else if (p - minPrice > maxProfit) maxProfit = p - minPrice;
        }
        return maxProfit;
    }
}`,
      typescript: `function maxProfit(prices: number[]): number {
    let minPrice = Infinity;
    let maxProfit = 0;
    for (const p of prices) {
        minPrice = Math.min(minPrice, p);
        maxProfit = Math.max(maxProfit, p - minPrice);
    }
    return maxProfit;
}`,
    },
    is_premium: false,
    is_published: true,
    tags: ['Arrays', 'Greedy'],
    status: 'solved',
    revision_due: false,
  },
  {
    id: 'prob-00000003-0000-0000-0000-000000000003',
    title: '3Sum',
    slug: '3sum',
    difficulty: 'medium',
    acceptance_rate: 58.2,
    description_markdown: `Given an integer array nums, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

Notice that the solution set must not contain duplicate triplets. Formulate two-pointer invariants on sorted arrays.`,
    constraints_markdown: `- \`3 <= nums.length <= 3000\`
- \`-10^5 <= nums[i] <= 10^5\``,
    starter_templates: {
      cpp: `#include <vector>
#include <algorithm>

class Solution {
public:
    std::vector<std::vector<int>> threeSum(std::vector<int>& nums) {
        std::sort(nums.begin(), nums.end());
        std::vector<std::vector<int>> res;
        for (int i = 0; i < nums.size(); ++i) {
            if (i > 0 && nums[i] == nums[i-1]) continue;
            int l = i + 1, r = nums.size() - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum == 0) {
                    res.push_back({nums[i], nums[l], nums[r]});
                    while (l < r && nums[l] == nums[l+1]) l++;
                    while (l < r && nums[r] == nums[r-1]) r--;
                    l++; r--;
                } else if (sum < 0) l++;
                else r--;
            }
        }
        return res;
    }
};`,
      python: `class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        nums.sort()
        res = []
        for i in range(len(nums)):
            if i > 0 and nums[i] == nums[i-1]:
                continue
            l, r = i + 1, len(nums) - 1
            while l < r:
                s = nums[i] + nums[l] + nums[r]
                if s == 0:
                    res.append([nums[i], nums[l], nums[r]])
                    while l < r and nums[l] == nums[l+1]: l += 1
                    while l < r and nums[r] == nums[r-1]: r -= 1
                    l += 1; r -= 1
                elif s < 0:
                    l += 1
                else:
                    r -= 1
        return res`,
      java: `import java.util.*;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = nums.length - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum == 0) {
                    res.add(Arrays.asList(nums[i], nums[l], nums[r]));
                    while (l < r && nums[l] == nums[l + 1]) l++;
                    while (l < r && nums[r] == nums[r - 1]) r--;
                    l++; r--;
                } else if (sum < 0) l++;
                else r--;
            }
        }
        return res;
    }
}`,
      typescript: `function threeSum(nums: number[]): number[][] {
    nums.sort((a, b) => a - b);
    const res: number[][] = [];
    for (let i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        let l = i + 1, r = nums.length - 1;
        while (l < r) {
            const sum = nums[i] + nums[l] + nums[r];
            if (sum === 0) {
                res.push([nums[i], nums[l], nums[r]]);
                while (l < r && nums[l] === nums[l + 1]) l++;
                while (l < r && nums[r] === nums[r - 1]) r--;
                l++; r--;
            } else if (sum < 0) l++;
            else r--;
        }
    }
    return res;
}`,
    },
    is_premium: false,
    is_published: true,
    tags: ['Arrays', 'Two Pointers'],
    status: 'attempted',
    revision_due: false,
  },
  {
    id: 'prob-00000004-0000-0000-0000-000000000004',
    title: 'Search in Rotated Sorted Array',
    slug: 'search-in-rotated-sorted-array',
    difficulty: 'medium',
    acceptance_rate: 51.9,
    description_markdown: `There is an integer array \`nums\` sorted in ascending order (with distinct values).

Prior to being passed to your function, \`nums\` is possibly rotated at an unknown pivot index \`k\` (\`1 <= k < nums.length\`).

Given the array \`nums\` after the possible rotation and an integer \`target\`, return the index of \`target\` if it is in \`nums\`, or \`-1\` if it is not in \`nums\`.

You must write an algorithm with $O(\\log n)$ runtime complexity.`,
    constraints_markdown: `- \`1 <= nums.length <= 5000\`
- \`-10^4 <= nums[i] <= 10^4\`
- All values of \`nums\` are unique.
- \`nums\` is an ascending array that is possibly rotated.
- \`-10^4 <= target <= 10^4\``,
    starter_templates: {
      cpp: `#include <vector>

class Solution {
public:
    int search(std::vector<int>& nums, int target) {
        int l = 0, r = nums.size() - 1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] == target) return mid;
            if (nums[l] <= nums[mid]) {
                if (nums[l] <= target && target < nums[mid]) r = mid - 1;
                else l = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[r]) l = mid + 1;
                else r = mid - 1;
            }
        }
        return -1;
    }
};`,
      python: `class Solution:
    def search(self, nums: list[int], target: int) -> int:
        l, r = 0, len(nums) - 1
        while l <= r:
            mid = (l + r) // 2
            if nums[mid] == target:
                return mid
            if nums[l] <= nums[mid]:
                if nums[l] <= target < nums[mid]:
                    r = mid - 1
                else:
                    l = mid + 1
            else:
                if nums[mid] < target <= nums[r]:
                    l = mid + 1
                else:
                    r = mid - 1
        return -1`,
      java: `class Solution {
    public int search(int[] nums, int target) {
        int l = 0, r = nums.length - 1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] == target) return mid;
            if (nums[l] <= nums[mid]) {
                if (nums[l] <= target && target < nums[mid]) r = mid - 1;
                else l = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[r]) l = mid + 1;
                else r = mid - 1;
            }
        }
        return -1;
    }
}`,
      typescript: `function search(nums: number[], target: number): number {
    let l = 0, r = nums.length - 1;
    while (l <= r) {
        const mid = Math.floor((l + r) / 2);
        if (nums[mid] === target) return mid;
        if (nums[l] <= nums[mid]) {
            if (nums[l] <= target && target < nums[mid]) r = mid - 1;
            else l = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[r]) l = mid + 1;
            else r = mid - 1;
        }
    }
    return -1;
}`,
    },
    is_premium: false,
    is_published: true,
    tags: ['Arrays', 'Binary Search'],
    status: 'todo',
    revision_due: false,
  },
  {
    id: 'prob-00000005-0000-0000-0000-000000000005',
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    difficulty: 'medium',
    acceptance_rate: 67.4,
    description_markdown: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i-th\` line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.`,
    constraints_markdown: `- \`n == height.length\`
- \`2 <= n <= 10^5\`
- \`0 <= height[i] <= 10^4\``,
    starter_templates: {
      cpp: `#include <vector>
#include <algorithm>

class Solution {
public:
    int maxArea(std::vector<int>& height) {
        int l = 0, r = height.size() - 1, maxW = 0;
        while (l < r) {
            maxW = std::max(maxW, (r - l) * std::min(height[l], height[r]));
            if (height[l] < height[r]) l++;
            else r--;
        }
        return maxW;
    }
};`,
      python: `class Solution:
    def maxArea(self, height: list[int]) -> int:
        l, r = 0, len(height) - 1
        max_w = 0
        while l < r:
            max_w = max(max_w, (r - l) * min(height[l], height[r]))
            if height[l] < height[r]:
                l += 1
            else:
                r -= 1
        return max_w`,
      java: `class Solution {
    public int maxArea(int[] height) {
        int l = 0, r = height.length - 1, maxW = 0;
        while (l < r) {
            maxW = Math.max(maxW, (r - l) * Math.min(height[l], height[r]));
            if (height[l] < height[r]) l++;
            else r--;
        }
        return maxW;
    }
}`,
      typescript: `function maxArea(height: number[]): number {
    let l = 0, r = height.length - 1, maxW = 0;
    while (l < r) {
        maxW = Math.max(maxW, (r - l) * Math.min(height[l], height[r]));
        if (height[l] < height[r]) l++;
        else r--;
    }
    return maxW;
}`,
    },
    is_premium: false,
    is_published: true,
    tags: ['Arrays', 'Two Pointers'],
    status: 'todo',
    revision_due: false,
  },
  {
    id: 'prob-00000006-0000-0000-0000-000000000006',
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    difficulty: 'hard',
    acceptance_rate: 42.1,
    description_markdown: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.`,
    constraints_markdown: `- \`n == height.length\`
- \`1 <= n <= 2 * 10^4\`
- \`0 <= height[i] <= 10^5\``,
    starter_templates: {
      cpp: `#include <vector>
#include <algorithm>

class Solution {
public:
    int trap(std::vector<int>& height) {
        int l = 0, r = height.size() - 1, leftMax = 0, rightMax = 0, water = 0;
        while (l < r) {
            if (height[l] <= height[r]) {
                if (height[l] >= leftMax) leftMax = height[l];
                else water += leftMax - height[l];
                l++;
            } else {
                if (height[r] >= rightMax) rightMax = height[r];
                else water += rightMax - height[r];
                r--;
            }
        }
        return water;
    }
};`,
      python: `class Solution:
    def trap(self, height: list[int]) -> int:
        l, r = 0, len(height) - 1
        left_max, right_max = 0, 0
        water = 0
        while l < r:
            if height[l] <= height[r]:
                if height[l] >= left_max:
                    left_max = height[l]
                else:
                    water += left_max - height[l]
                l += 1
            else:
                if height[r] >= right_max:
                    right_max = height[r]
                else:
                    water += right_max - height[r]
                r -= 1
        return water`,
      java: `class Solution {
    public int trap(int[] height) {
        int l = 0, r = height.length - 1, leftMax = 0, rightMax = 0, water = 0;
        while (l < r) {
            if (height[l] <= height[r]) {
                if (height[l] >= leftMax) leftMax = height[l];
                else water += leftMax - height[l];
                l++;
            } else {
                if (height[r] >= rightMax) rightMax = height[r];
                else water += rightMax - height[r];
                r--;
            }
        }
        return water;
    }
}`,
      typescript: `function trap(height: number[]): number {
    let l = 0, r = height.length - 1, leftMax = 0, rightMax = 0, water = 0;
    while (l < r) {
        if (height[l] <= height[r]) {
            if (height[l] >= leftMax) leftMax = height[l];
            else water += leftMax - height[l];
            l++;
        } else {
            if (height[r] >= rightMax) rightMax = height[r];
            else water += rightMax - height[r];
            r--;
        }
    }
    return water;
}`,
    },
    is_premium: false,
    is_published: true,
    tags: ['Arrays', 'Two Pointers', 'Monotonic Stack'],
    status: 'todo',
    revision_due: true,
  },
];

export const FALLBACK_SAMPLE_TEST_CASES: Record<string, TestCase[]> = {
  'two-sum': [
    {
      id: 'tc-1',
      problem_id: 'prob-00000001-0000-0000-0000-000000000001',
      input: 'nums = [2,7,11,15], target = 9',
      expected_output: '[0,1]',
      is_sample: true,
      order_index: 1,
    },
    {
      id: 'tc-2',
      problem_id: 'prob-00000001-0000-0000-0000-000000000001',
      input: 'nums = [3,2,4], target = 6',
      expected_output: '[1,2]',
      is_sample: true,
      order_index: 2,
    },
    {
      id: 'tc-3',
      problem_id: 'prob-00000001-0000-0000-0000-000000000001',
      input: 'nums = [3,3], target = 6',
      expected_output: '[0,1]',
      is_sample: true,
      order_index: 3,
    },
  ],
  'best-time-to-buy-and-sell-stock': [
    {
      id: 'tc-4',
      problem_id: 'prob-00000002-0000-0000-0000-000000000002',
      input: 'prices = [7,1,5,3,6,4]',
      expected_output: '5',
      is_sample: true,
      order_index: 1,
    },
    {
      id: 'tc-5',
      problem_id: 'prob-00000002-0000-0000-0000-000000000002',
      input: 'prices = [7,6,4,3,1]',
      expected_output: '0',
      is_sample: true,
      order_index: 2,
    },
  ],
  '3sum': [
    {
      id: 'tc-6',
      problem_id: 'prob-00000003-0000-0000-0000-000000000003',
      input: 'nums = [-1,0,1,2,-1,-4]',
      expected_output: '[[-1,-1,2],[-1,0,1]]',
      is_sample: true,
      order_index: 1,
    },
    {
      id: 'tc-7',
      problem_id: 'prob-00000003-0000-0000-0000-000000000003',
      input: 'nums = [0,1,1]',
      expected_output: '[]',
      is_sample: true,
      order_index: 2,
    },
    {
      id: 'tc-8',
      problem_id: 'prob-00000003-0000-0000-0000-000000000003',
      input: 'nums = [0,0,0]',
      expected_output: '[[0,0,0]]',
      is_sample: true,
      order_index: 3,
    },
  ],
  'search-in-rotated-sorted-array': [
    {
      id: 'tc-9',
      problem_id: 'prob-00000004-0000-0000-0000-000000000004',
      input: 'nums = [4,5,6,7,0,1,2], target = 0',
      expected_output: '4',
      is_sample: true,
      order_index: 1,
    },
    {
      id: 'tc-10',
      problem_id: 'prob-00000004-0000-0000-0000-000000000004',
      input: 'nums = [4,5,6,7,0,1,2], target = 3',
      expected_output: '-1',
      is_sample: true,
      order_index: 2,
    },
    {
      id: 'tc-11',
      problem_id: 'prob-00000004-0000-0000-0000-000000000004',
      input: 'nums = [1], target = 0',
      expected_output: '-1',
      is_sample: true,
      order_index: 3,
    },
  ],
  'container-with-most-water': [
    {
      id: 'tc-12',
      problem_id: 'prob-00000005-0000-0000-0000-000000000005',
      input: 'height = [1,8,6,2,5,4,8,3,7]',
      expected_output: '49',
      is_sample: true,
      order_index: 1,
    },
    {
      id: 'tc-13',
      problem_id: 'prob-00000005-0000-0000-0000-000000000005',
      input: 'height = [1,1]',
      expected_output: '1',
      is_sample: true,
      order_index: 2,
    },
  ],
  'trapping-rain-water': [
    {
      id: 'tc-14',
      problem_id: 'prob-00000006-0000-0000-0000-000000000006',
      input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
      expected_output: '6',
      is_sample: true,
      order_index: 1,
    },
    {
      id: 'tc-15',
      problem_id: 'prob-00000006-0000-0000-0000-000000000006',
      input: 'height = [4,2,0,3,2,5]',
      expected_output: '9',
      is_sample: true,
      order_index: 2,
    },
  ],
};

export const FALLBACK_ROADMAP: Roadmap = {
  id: 'road-00000001-0000-0000-0000-000000000001',
  title: 'DSA & Problem Solving',
  slug: 'dsa-problem-solving',
  description: 'Canonical structured A-to-Z data structures and algorithms track with formal invariant proofs and complexity bounds.',
  icon_name: 'Terminal',
  order_index: 1,
  is_published: true,
  steps: [
    {
      id: 'step-00000001-0000-0000-0000-000000000001',
      roadmap_id: 'road-00000001-0000-0000-0000-000000000001',
      title: 'Step 1: Learn the Basics',
      order_index: 1,
      topics: [
        {
          id: 'top-00000001-0000-0000-0000-000000000001',
          step_id: 'step-00000001-0000-0000-0000-000000000001',
          title: 'Linear Search & Hash Lookup Invariants',
          order_index: 1,
          problems: [
            FALLBACK_PROBLEMS[0], // Two Sum
            FALLBACK_PROBLEMS[1], // Best Time to Buy and Sell Stock
          ],
        },
      ],
    },
    {
      id: 'step-00000002-0000-0000-0000-000000000002',
      roadmap_id: 'road-00000001-0000-0000-0000-000000000001',
      title: 'Step 2: Arrays & Two Pointers',
      order_index: 2,
      topics: [
        {
          id: 'top-00000002-0000-0000-0000-000000000002',
          step_id: 'step-00000002-0000-0000-0000-000000000002',
          title: 'Two Pointers Technique & Window Bounds',
          order_index: 1,
          problems: [
            FALLBACK_PROBLEMS[2], // 3Sum
            FALLBACK_PROBLEMS[4], // Container With Most Water
            FALLBACK_PROBLEMS[5], // Trapping Rain Water
          ],
        },
      ],
    },
    {
      id: 'step-00000003-0000-0000-0000-000000000003',
      roadmap_id: 'road-00000001-0000-0000-0000-000000000001',
      title: 'Step 3: Binary Search',
      order_index: 3,
      topics: [
        {
          id: 'top-00000003-0000-0000-0000-000000000003',
          step_id: 'step-00000003-0000-0000-0000-000000000003',
          title: 'Binary Search on 1D Arrays & Rotated Spaces',
          order_index: 1,
          problems: [
            FALLBACK_PROBLEMS[3], // Search in Rotated Sorted Array
          ],
        },
      ],
    },
  ],
};
