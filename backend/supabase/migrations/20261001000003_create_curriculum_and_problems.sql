-- ==============================================================================
-- VERNIQ Phase 2 Migration: Curriculum Architecture & Problem Management Engine
-- Migration: 20261001000003_create_curriculum_and_problems.sql
-- ==============================================================================

-- 1. DOMAIN ENUMS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
    CREATE TYPE public.difficulty_level AS ENUM ('easy', 'medium', 'hard');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'problem_status') THEN
    CREATE TYPE public.problem_status AS ENUM ('todo', 'attempted', 'solved');
  END IF;
END $$;

-- 2. CURRICULUM TABLES

-- 2.1 Roadmaps
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title CITEXT NOT NULL,
  slug CITEXT UNIQUE NOT NULL,
  description TEXT,
  icon_name TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Roadmap Steps
CREATE TABLE IF NOT EXISTS public.roadmap_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Roadmap Topics
CREATE TABLE IF NOT EXISTS public.roadmap_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.roadmap_steps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROBLEM ENGINE TABLES

-- 3.1 Problems
CREATE TABLE IF NOT EXISTS public.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug CITEXT UNIQUE NOT NULL,
  difficulty public.difficulty_level NOT NULL DEFAULT 'medium',
  acceptance_rate NUMERIC(5,2) DEFAULT 0.00,
  description_markdown TEXT NOT NULL,
  constraints_markdown TEXT NOT NULL,
  starter_templates JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for problems updated_at
DROP TRIGGER IF EXISTS trg_problems_updated_at ON public.problems;
CREATE TRIGGER trg_problems_updated_at
  BEFORE UPDATE ON public.problems
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3.2 Tags
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name CITEXT UNIQUE NOT NULL,
  slug CITEXT UNIQUE NOT NULL
);

-- 3.3 Problem Tags Mapping
CREATE TABLE IF NOT EXISTS public.problem_tags (
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (problem_id, tag_id)
);

-- 3.4 Topic Problems Mapping (Curriculum Tree -> Problem Nodes)
CREATE TABLE IF NOT EXISTS public.topic_problems (
  topic_id UUID NOT NULL REFERENCES public.roadmap_topics(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (topic_id, problem_id)
);

-- 3.5 Test Cases
CREATE TABLE IF NOT EXISTS public.test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- 4. USER PROGRESS & REVISION ENGINE

-- 4.1 User Problem Progress
CREATE TABLE IF NOT EXISTS public.user_problem_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  status public.problem_status NOT NULL DEFAULT 'todo',
  solved_at TIMESTAMPTZ,
  notes TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, problem_id)
);

-- 4.2 User Revision Queue (Ebbinghaus 1-3-7-21 Decay Curve)
CREATE TABLE IF NOT EXISTS public.user_revision_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  interval_days INTEGER NOT NULL DEFAULT 1,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, problem_id)
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_roadmap_steps_roadmap ON public.roadmap_steps(roadmap_id, order_index);
CREATE INDEX IF NOT EXISTS idx_roadmap_topics_step ON public.roadmap_topics(step_id, order_index);
CREATE INDEX IF NOT EXISTS idx_topic_problems_topic ON public.topic_problems(topic_id, order_index);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON public.problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_slug ON public.problems(slug);
CREATE INDEX IF NOT EXISTS idx_test_cases_problem ON public.test_cases(problem_id, is_sample);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_problem_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_revision_queue_user ON public.user_revision_queue(user_id, is_reviewed, next_review_at);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_problem_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_revision_queue ENABLE ROW LEVEL SECURITY;

-- 6.1 Public Read-Only for Curriculum & Catalog
CREATE POLICY "Public read-only roadmaps" ON public.roadmaps
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public read-only roadmap_steps" ON public.roadmap_steps
  FOR SELECT USING (true);

CREATE POLICY "Public read-only roadmap_topics" ON public.roadmap_topics
  FOR SELECT USING (true);

CREATE POLICY "Public read-only problems" ON public.problems
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public read-only tags" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "Public read-only problem_tags" ON public.problem_tags
  FOR SELECT USING (true);

CREATE POLICY "Public read-only topic_problems" ON public.topic_problems
  FOR SELECT USING (true);

-- 6.2 Test Cases: Read ONLY sample test cases publicly
CREATE POLICY "Public read sample test_cases only" ON public.test_cases
  FOR SELECT USING (is_sample = true);

-- 6.3 User Problem Progress: User-scoped CRUD
CREATE POLICY "Users can manage own progress" ON public.user_problem_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6.4 User Revision Queue: User-scoped CRUD
CREATE POLICY "Users can manage own revision queue" ON public.user_revision_queue
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 7. SEED DATA (Curriculum, Roadmaps, Canonical Problems & Test Cases)
-- Valid Deterministic Hexadecimal UUIDs strictly adhering to [0-9a-fA-F]
-- ==============================================================================

-- 7.1 Seed Tags
INSERT INTO public.tags (id, name, slug) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Arrays', 'arrays'),
  ('00000000-0000-0000-0000-000000000102', 'Hash Map', 'hash-map'),
  ('00000000-0000-0000-0000-000000000103', 'Two Pointers', 'two-pointers'),
  ('00000000-0000-0000-0000-000000000104', 'Binary Search', 'binary-search'),
  ('00000000-0000-0000-0000-000000000105', 'Monotonic Stack', 'monotonic-stack'),
  ('00000000-0000-0000-0000-000000000106', 'Greedy', 'greedy'),
  ('00000000-0000-0000-0000-000000000107', 'Dynamic Programming', 'dynamic-programming')
ON CONFLICT (slug) DO NOTHING;

-- 7.2 Seed Roadmap
INSERT INTO public.roadmaps (id, title, slug, description, icon_name, order_index, is_published) VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    'DSA & Problem Solving',
    'dsa-problem-solving',
    'Canonical structured A-to-Z data structures and algorithms track with formal invariant proofs and complexity bounds.',
    'Terminal',
    1,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- 7.3 Seed Roadmap Steps
INSERT INTO public.roadmap_steps (id, roadmap_id, title, order_index) VALUES
  ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000201', 'Step 1: Learn the Basics', 1),
  ('00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000201', 'Step 2: Arrays & Two Pointers', 2),
  ('00000000-0000-0000-0000-000000000213', '00000000-0000-0000-0000-000000000201', 'Step 3: Binary Search', 3)
ON CONFLICT (id) DO NOTHING;

-- 7.4 Seed Roadmap Topics
INSERT INTO public.roadmap_topics (id, step_id, title, order_index) VALUES
  ('00000000-0000-0000-0000-000000000221', '00000000-0000-0000-0000-000000000211', 'Linear Search & Hash Lookup Invariants', 1),
  ('00000000-0000-0000-0000-000000000222', '00000000-0000-0000-0000-000000000212', 'Two Pointers Technique & Window Bounds', 1),
  ('00000000-0000-0000-0000-000000000223', '00000000-0000-0000-0000-000000000213', 'Binary Search on 1D Arrays & Rotated Spaces', 1)
ON CONFLICT (id) DO NOTHING;

-- 7.5 Seed Canonical Problems
INSERT INTO public.problems (
  id, title, slug, difficulty, acceptance_rate, description_markdown, constraints_markdown, starter_templates, is_published
) VALUES
  (
    '00000000-0000-0000-0000-000000000301',
    'Two Sum',
    'two-sum',
    'easy',
    82.40,
    'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.',
    '- `2 <= nums.length <= 10^4`
- `-10^9 <= nums[i] <= 10^9`
- `-10^9 <= target <= 10^9`
- Only one valid answer exists.',
    '{
      "cpp": "#include <vector>\n#include <unordered_map>\n\nclass Solution {\npublic:\n    std::vector<int> twoSum(std::vector<int>& nums, int target) {\n        std::unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); ++i) {\n            int complement = target - nums[i];\n            if (seen.count(complement)) {\n                return {seen[complement], i};\n            }\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};",
      "python": "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            complement = target - num\n            if complement in seen:\n                return [seen[complement], i]\n            seen[num] = i\n        return []",
      "java": "import java.util.HashMap;\nimport java.util.Map;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (seen.containsKey(complement)) {\n                return new int[] { seen.get(complement), i };\n            }\n            seen.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}",
      "typescript": "function twoSum(nums: number[], target: number): number[] {\n    const seen = new Map<number, number>();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (seen.has(complement)) {\n            return [seen.get(complement)!, i];\n        }\n        seen.set(nums[i], i);\n    }\n    return [];\n}"
    }'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    'Best Time to Buy and Sell Stock',
    'best-time-to-buy-and-sell-stock',
    'easy',
    76.50,
    'You are given an array `prices` where `prices[i]` is the price of a given stock on the `i-th` day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.',
    '- `1 <= prices.length <= 10^5`
- `0 <= prices[i] <= 10^4`',
    '{
      "cpp": "#include <vector>\n#include <algorithm>\n\nclass Solution {\npublic:\n    int maxProfit(std::vector<int>& prices) {\n        int minPrice = 1e9, maxProfit = 0;\n        for (int price : prices) {\n            minPrice = std::min(minPrice, price);\n            maxProfit = std::max(maxProfit, price - minPrice);\n        }\n        return maxProfit;\n    }\n};",
      "python": "class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        min_price, max_profit = float(\"inf\"), 0\n        for p in prices:\n            min_price = min(min_price, p)\n            max_profit = max(max_profit, p - min_price)\n        return max_profit",
      "java": "class Solution {\n    public int maxProfit(int[] prices) {\n        int minPrice = Integer.MAX_VALUE;\n        int maxProfit = 0;\n        for (int p : prices) {\n            if (p < minPrice) minPrice = p;\n            else if (p - minPrice > maxProfit) maxProfit = p - minPrice;\n        }\n        return maxProfit;\n    }\n}",
      "typescript": "function maxProfit(prices: number[]): number {\n    let minPrice = Infinity;\n    let maxProfit = 0;\n    for (const p of prices) {\n        minPrice = Math.min(minPrice, p);\n        maxProfit = Math.max(maxProfit, p - minPrice);\n    }\n    return maxProfit;\n}"
    }'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    '3Sum',
    '3sum',
    'medium',
    58.20,
    'Given an integer array nums, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.

Notice that the solution set must not contain duplicate triplets.',
    '- `3 <= nums.length <= 3000`
- `-10^5 <= nums[i] <= 10^5`',
    '{
      "cpp": "#include <vector>\n#include <algorithm>\n\nclass Solution {\npublic:\n    std::vector<std::vector<int>> threeSum(std::vector<int>& nums) {\n        std::sort(nums.begin(), nums.end());\n        std::vector<std::vector<int>> res;\n        for (int i = 0; i < nums.size(); ++i) {\n            if (i > 0 && nums[i] == nums[i-1]) continue;\n            int l = i + 1, r = nums.size() - 1;\n            while (l < r) {\n                int sum = nums[i] + nums[l] + nums[r];\n                if (sum == 0) {\n                    res.push_back({nums[i], nums[l], nums[r]});\n                    while (l < r && nums[l] == nums[l+1]) l++;\n                    while (l < r && nums[r] == nums[r-1]) r--;\n                    l++; r--;\n                } else if (sum < 0) l++;\n                else r--;\n            }\n        }\n        return res;\n    }\n};",
      "python": "class Solution:\n    def threeSum(self, nums: list[int]) -> list[list[int]]:\n        nums.sort()\n        res = []\n        for i in range(len(nums)):\n            if i > 0 and nums[i] == nums[i-1]:\n                continue\n            l, r = i + 1, len(nums) - 1\n            while l < r:\n                s = nums[i] + nums[l] + nums[r]\n                if s == 0:\n                    res.append([nums[i], nums[l], nums[r]])\n                    while l < r and nums[l] == nums[l+1]: l += 1\n                    while l < r and nums[r] == nums[r-1]: r -= 1\n                    l += 1; r -= 1\n                elif s < 0:\n                    l += 1\n                else:\n                    r -= 1\n        return res",
      "java": "import java.util.*;\n\nclass Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        Arrays.sort(nums);\n        List<List<Integer>> res = new ArrayList<>();\n        for (int i = 0; i < nums.length - 2; i++) {\n            if (i > 0 && nums[i] == nums[i - 1]) continue;\n            int l = i + 1, r = nums.length - 1;\n            while (l < r) {\n                int sum = nums[i] + nums[l] + nums[r];\n                if (sum == 0) {\n                    res.add(Arrays.asList(nums[i], nums[l], nums[r]));\n                    while (l < r && nums[l] == nums[l + 1]) l++;\n                    while (l < r && nums[r] == nums[r - 1]) r--;\n                    l++; r--;\n                } else if (sum < 0) l++;\n                else r--;\n            }\n        }\n        return res;\n    }\n}",
      "typescript": "function threeSum(nums: number[]): number[][] {\n    nums.sort((a, b) => a - b);\n    const res: number[][] = [];\n    for (let i = 0; i < nums.length - 2; i++) {\n        if (i > 0 && nums[i] === nums[i - 1]) continue;\n        let l = i + 1, r = nums.length - 1;\n        while (l < r) {\n            const sum = nums[i] + nums[l] + nums[r];\n            if (sum === 0) {\n                res.push([nums[i], nums[l], nums[r]]);\n                while (l < r && nums[l] === nums[l + 1]) l++;\n                while (l < r && nums[r] === nums[r - 1]) r--;\n                l++; r--;\n            } else if (sum < 0) l++;\n            else r--;\n        }\n    }\n    return res;\n}"
    }'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000304',
    'Search in Rotated Sorted Array',
    'search-in-rotated-sorted-array',
    'medium',
    51.90,
    'There is an integer array `nums` sorted in ascending order (with distinct values).

Prior to being passed to your function, `nums` is possibly rotated at an unknown pivot index `k` (`1 <= k < nums.length`).

Given the array `nums` after the possible rotation and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not in `nums`.

You must write an algorithm with $O(\\log n)$ runtime complexity.',
    '- `1 <= nums.length <= 5000`
- `-10^4 <= nums[i] <= 10^4`
- All values of `nums` are unique.
- `nums` is an ascending array that is possibly rotated.
- `-10^4 <= target <= 10^4`',
    '{
      "cpp": "#include <vector>\n\nclass Solution {\npublic:\n    int search(std::vector<int>& nums, int target) {\n        int l = 0, r = nums.size() - 1;\n        while (l <= r) {\n            int mid = l + (r - l) / 2;\n            if (nums[mid] == target) return mid;\n            if (nums[l] <= nums[mid]) {\n                if (nums[l] <= target && target < nums[mid]) r = mid - 1;\n                else l = mid + 1;\n            } else {\n                if (nums[mid] < target && target <= nums[r]) l = mid + 1;\n                else r = mid - 1;\n            }\n        }\n        return -1;\n    }\n};",
      "python": "class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        l, r = 0, len(nums) - 1\n        while l <= r:\n            mid = (l + r) // 2\n            if nums[mid] == target:\n                return mid\n            if nums[l] <= nums[mid]:\n                if nums[l] <= target < nums[mid]:\n                    r = mid - 1\n                else:\n                    l = mid + 1\n            else:\n                if nums[mid] < target <= nums[r]:\n                    l = mid + 1\n                else:\n                    r = mid - 1\n        return -1",
      "java": "class Solution {\n    public int search(int[] nums, int target) {\n        int l = 0, r = nums.length - 1;\n        while (l <= r) {\n            int mid = l + (r - l) / 2;\n            if (nums[mid] == target) return mid;\n            if (nums[l] <= nums[mid]) {\n                if (nums[l] <= target && target < nums[mid]) r = mid - 1;\n                else l = mid + 1;\n            } else {\n                if (nums[mid] < target && target <= nums[r]) l = mid + 1;\n                else r = mid - 1;\n            }\n        }\n        return -1;\n    }\n}",
      "typescript": "function search(nums: number[], target: number): number {\n    let l = 0, r = nums.length - 1;\n    while (l <= r) {\n        const mid = Math.floor((l + r) / 2);\n        if (nums[mid] === target) return mid;\n        if (nums[l] <= nums[mid]) {\n            if (nums[l] <= target && target < nums[mid]) r = mid - 1;\n            else l = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[r]) l = mid + 1;\n            else r = mid - 1;\n        }\n    }\n    return -1;\n}"
    }'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000305',
    'Container With Most Water',
    'container-with-most-water',
    'medium',
    67.40,
    'You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i-th` line are `(i, 0)` and `(i, height[i])`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.',
    '- `n == height.length`
- `2 <= n <= 10^5`
- `0 <= height[i] <= 10^4`',
    '{
      "cpp": "#include <vector>\n#include <algorithm>\n\nclass Solution {\npublic:\n    int maxArea(std::vector<int>& height) {\n        int l = 0, r = height.size() - 1, maxW = 0;\n        while (l < r) {\n            maxW = std::max(maxW, (r - l) * std::min(height[l], height[r]));\n            if (height[l] < height[r]) l++;\n            else r--;\n        }\n        return maxW;\n    }\n};",
      "python": "class Solution:\n    def maxArea(self, height: list[int]) -> int:\n        l, r = 0, len(height) - 1\n        max_w = 0\n        while l < r:\n            max_w = max(max_w, (r - l) * min(height[l], height[r]))\n            if height[l] < height[r]:\n                l += 1\n            else:\n                r -= 1\n        return max_w",
      "java": "class Solution {\n    public int maxArea(int[] height) {\n        int l = 0, r = height.length - 1, maxW = 0;\n        while (l < r) {\n            maxW = Math.max(maxW, (r - l) * Math.min(height[l], height[r]));\n            if (height[l] < height[r]) l++;\n            else r--;\n        }\n        return maxW;\n    }\n}",
      "typescript": "function maxArea(height: number[]): number {\n    let l = 0, r = height.length - 1, maxW = 0;\n    while (l < r) {\n        maxW = Math.max(maxW, (r - l) * Math.min(height[l], height[r]));\n        if (height[l] < height[r]) l++;\n        else r--;\n    }\n    return maxW;\n}"
    }'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000306',
    'Trapping Rain Water',
    'trapping-rain-water',
    'hard',
    42.10,
    'Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    '- `n == height.length`
- `1 <= n <= 2 * 10^4`
- `0 <= height[i] <= 10^5`',
    '{
      "cpp": "#include <vector>\n#include <algorithm>\n\nclass Solution {\npublic:\n    int trap(std::vector<int>& height) {\n        int l = 0, r = height.size() - 1, leftMax = 0, rightMax = 0, water = 0;\n        while (l < r) {\n            if (height[l] <= height[r]) {\n                if (height[l] >= leftMax) leftMax = height[l];\n                else water += leftMax - height[l];\n                l++;\n            } else {\n                if (height[r] >= rightMax) rightMax = height[r];\n                else water += rightMax - height[r];\n                r--;\n            }\n        }\n        return water;\n    }\n};",
      "python": "class Solution:\n    def trap(self, height: list[int]) -> int:\n        l, r = 0, len(height) - 1\n        left_max, right_max = 0, 0\n        water = 0\n        while l < r:\n            if height[l] <= height[r]:\n                if height[l] >= left_max:\n                    left_max = height[l]\n                else:\n                    water += left_max - height[l]\n                l += 1\n            else:\n                if height[r] >= right_max:\n                    right_max = height[r]\n                else:\n                    water += right_max - height[r]\n                r -= 1\n        return water",
      "java": "class Solution {\n    public int trap(int[] height) {\n        int l = 0, r = height.length - 1, leftMax = 0, rightMax = 0, water = 0;\n        while (l < r) {\n            if (height[l] <= height[r]) {\n                if (height[l] >= leftMax) leftMax = height[l];\n                else water += leftMax - height[l];\n                l++;\n            } else {\n                if (height[r] >= rightMax) rightMax = height[r];\n                else water += rightMax - height[r];\n                r--;\n            }\n        }\n        return water;\n    }\n}",
      "typescript": "function trap(height: number[]): number {\n    let l = 0, r = height.length - 1, leftMax = 0, rightMax = 0, water = 0;\n    while (l < r) {\n        if (height[l] <= height[r]) {\n            if (height[l] >= leftMax) leftMax = height[l];\n            else water += leftMax - height[l];\n            l++;\n        } else {\n            if (height[r] >= rightMax) rightMax = height[r];\n            else water += rightMax - height[r];\n            r--;\n        }\n    }\n    return water;\n}"
    }'::jsonb,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- 7.6 Seed Problem Tags
INSERT INTO public.problem_tags (problem_id, tag_id) VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101'), -- Two Sum -> Arrays
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000102'), -- Two Sum -> Hash Map
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000101'), -- Stock -> Arrays
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000106'), -- Stock -> Greedy
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000101'), -- 3Sum -> Arrays
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000103'), -- 3Sum -> Two Pointers
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000101'), -- Search Rotated -> Arrays
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000104'), -- Search Rotated -> Binary Search
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000101'), -- Container Water -> Arrays
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000103'), -- Container Water -> Two Pointers
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000101'), -- Trapping Rain -> Arrays
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000103'), -- Trapping Rain -> Two Pointers
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000105')  -- Trapping Rain -> Monotonic Stack
ON CONFLICT (problem_id, tag_id) DO NOTHING;

-- 7.7 Seed Topic Problems
INSERT INTO public.topic_problems (topic_id, problem_id, order_index) VALUES
  ('00000000-0000-0000-0000-000000000221', '00000000-0000-0000-0000-000000000301', 1), -- Linear/Hash -> Two Sum
  ('00000000-0000-0000-0000-000000000221', '00000000-0000-0000-0000-000000000302', 2), -- Linear/Hash -> Stock
  ('00000000-0000-0000-0000-000000000222', '00000000-0000-0000-0000-000000000303', 1), -- Two Pointers -> 3Sum
  ('00000000-0000-0000-0000-000000000222', '00000000-0000-0000-0000-000000000305', 2), -- Two Pointers -> Container Water
  ('00000000-0000-0000-0000-000000000222', '00000000-0000-0000-0000-000000000306', 3), -- Two Pointers -> Trapping Rain Water
  ('00000000-0000-0000-0000-000000000223', '00000000-0000-0000-0000-000000000304', 1)  -- Binary Search -> Search Rotated
ON CONFLICT (topic_id, problem_id) DO NOTHING;

-- 7.8 Seed Sample & Judge Test Cases
INSERT INTO public.test_cases (problem_id, input, expected_output, is_sample, order_index) VALUES
  -- Two Sum
  ('00000000-0000-0000-0000-000000000301', 'nums = [2,7,11,15], target = 9', '[0,1]', true, 1),
  ('00000000-0000-0000-0000-000000000301', 'nums = [3,2,4], target = 6', '[1,2]', true, 2),
  ('00000000-0000-0000-0000-000000000301', 'nums = [3,3], target = 6', '[0,1]', true, 3),
  ('00000000-0000-0000-0000-000000000301', 'nums = [1,5,8,10,14], target = 19', '[1,4]', false, 4),

  -- Stock
  ('00000000-0000-0000-0000-000000000302', 'prices = [7,1,5,3,6,4]', '5', true, 1),
  ('00000000-0000-0000-0000-000000000302', 'prices = [7,6,4,3,1]', '0', true, 2),
  ('00000000-0000-0000-0000-000000000302', 'prices = [2,4,1]', '2', false, 3),

  -- 3Sum
  ('00000000-0000-0000-0000-000000000303', 'nums = [-1,0,1,2,-1,-4]', '[[-1,-1,2],[-1,0,1]]', true, 1),
  ('00000000-0000-0000-0000-000000000303', 'nums = [0,1,1]', '[]', true, 2),
  ('00000000-0000-0000-0000-000000000303', 'nums = [0,0,0]', '[[0,0,0]]', true, 3),

  -- Search Rotated
  ('00000000-0000-0000-0000-000000000304', 'nums = [4,5,6,7,0,1,2], target = 0', '4', true, 1),
  ('00000000-0000-0000-0000-000000000304', 'nums = [4,5,6,7,0,1,2], target = 3', '-1', true, 2),
  ('00000000-0000-0000-0000-000000000304', 'nums = [1], target = 0', '-1', true, 3),

  -- Container Water
  ('00000000-0000-0000-0000-000000000305', 'height = [1,8,6,2,5,4,8,3,7]', '49', true, 1),
  ('00000000-0000-0000-0000-000000000305', 'height = [1,1]', '1', true, 2),
  ('00000000-0000-0000-0000-000000000305', 'height = [4,3,2,1,4]', '16', false, 3),

  -- Trapping Rain Water
  ('00000000-0000-0000-0000-000000000306', 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', '6', true, 1),
  ('00000000-0000-0000-0000-000000000306', 'height = [4,2,0,3,2,5]', '9', true, 2),
  ('00000000-0000-0000-0000-000000000306', 'height = [3,0,2,0,4]', '7', false, 3)
ON CONFLICT DO NOTHING;
