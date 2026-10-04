"""Driver Harness Injector for LeetCode-style solution snippets across all supported languages."""
import re

def has_main_entrypoint(language: str, code: str) -> bool:
    """Check if the user code already contains an entrypoint."""
    lang = language.lower()
    if lang in ("java",):
        return "public static void main" in code or "static void main" in code
    elif lang in ("cpp", "c++"):
        return bool(re.search(r"\bint\s+main\s*\(", code)) or "main(" in code
    elif lang in ("python", "py", "python3"):
        return "__main__" in code
    elif lang in ("typescript", "ts"):
        return "process.stdin" in code or "fs.readFileSync" in code
    elif lang == "go":
        return "func main(" in code
    return False

def detect_solution_method(code: str) -> str:
    """Identify the method or class being implemented."""
    methods = [
        # Design / Class first
        "LRUCache",
        # Phase 4.2.2 Easy Methods (Pilot + 15 remaining)
        "longestCommonPrefix", "isPalindrome", "romanToInt", "mergeSortedArray", "majorityElement",
        "removeDuplicates", "firstUniqChar", "containsDuplicate", "sortedSquares", "reverseString",
        "validPalindrome", "isIsomorphic", "isSubsequence", "containsNearbyDuplicate", "canConstruct",
        "findMaxConsecutiveOnes", "reverseVowels", "summaryRanges", "intersect", "wordPattern",
        # Phase 4.2.3 Medium Methods
        "groupAnagrams", "longestPalindrome", "topKFrequent", "spiralOrder", "subarraySum",
        "minMeetingRooms", "findKthLargest", "longestConsecutive", "sortColors", "compress",
        "productExceptSelf", "rotate", "reverseWords", "findDuplicate", "characterReplacement",
        "numSubarrayProductLessThanK", "longestOnes", "findClosestElements", "minSubArrayLen", "checkInclusion",
        # 20 Pilot Methods
        "mergeKLists", "mergeTwoLists", "addTwoNumbers", "findMedianSortedArrays", "maxSlidingWindow",
        "lengthOfLongestSubstring", "largestRectangleArea", "minEatingSpeed", "ladderLength",
        "isValidBST", "numIslands", "maxSubArray", "canFinish", "moveZeroes", "isAnagram",
        "coinChange", "climbStairs", "canJump", "isValid", "merge",
        # 6 Canonical Original Methods
        "twoSum", "maxProfit", "threeSum", "search", "maxArea", "trap"
    ]
    for m in methods:
        if re.search(r"\b" + m + r"\b", code):
            return m
    return "unknown"

def inject_harness(language: str, code: str) -> str:
    """Wrap or append a test harness to invoke the Solution class method."""
    if has_main_entrypoint(language, code):
        return code

    lang = language.lower()
    method = detect_solution_method(code)
    if method == "unknown" and "class Solution" not in code and "function " not in code and "class LRUCache" not in code:
        return code

    # =========================================================================
    # JAVA HARNESS
    # =========================================================================
    if lang in ("java",):
        sanitized_code = re.sub(r"\bpublic\s+class\s+Solution\b", "class Solution", code)
        sanitized_code = re.sub(r"\bpublic\s+class\s+LRUCache\b", "class LRUCache", sanitized_code)
        sanitized_code = re.sub(r"\bpublic\s+class\s+ListNode\b", "class ListNode", sanitized_code)

        user_imports = []
        non_import_lines = []
        for line in sanitized_code.splitlines():
            if line.strip().startswith("import "):
                user_imports.append(line.strip())
            else:
                non_import_lines.append(line)
        cleaned_user_code = "\n".join(non_import_lines)
        all_imports = "import java.util.*;\nimport java.util.regex.*;\n"
        if user_imports:
            all_imports += "\n".join(user_imports) + "\n"
        all_imports += "\n"

        helpers = ""
        code_no_comments = re.sub(r"/\*.*?\*/", "", sanitized_code, flags=re.DOTALL)
        code_no_comments = re.sub(r"//.*", "", code_no_comments)
        if not re.search(r"\bclass\s+ListNode\b", code_no_comments):
            helpers += """
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
"""
        if not re.search(r"\bclass\s+TreeNode\b", code_no_comments):
            helpers += """
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}
"""

        driver = """
public class Main {
    private static String parseStringParam(String input, String name) {
        Matcher m = Pattern.compile(name + "\\\\s*=\\\\s*\\\"([^\\\"]*)\\\"").matcher(input);
        if (m.find()) return m.group(1);
        Matcher m2 = Pattern.compile("\\\"([^\\\"]*)\\\"").matcher(input);
        if (m2.find()) return m2.group(1);
        return "";
    }

    private static int parseIntParam(String input, String name) {
        Matcher m = Pattern.compile(name + "\\\\s*=\\\\s*(-?\\\\d+)").matcher(input);
        if (m.find()) return Integer.parseInt(m.group(1));
        Matcher m2 = Pattern.compile("(-?\\\\d+)").matcher(input);
        if (m2.find()) return Integer.parseInt(m2.group(1));
        return 0;
    }

    private static int[] parseIntArray(String s) {
        int start = s.indexOf('[');
        int end = s.lastIndexOf(']');
        if (start == -1 || end == -1 || start >= end) return new int[0];
        String content = s.substring(start + 1, end).trim();
        if (content.isEmpty()) return new int[0];
        String[] parts = content.split(",");
        int[] arr = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            arr[i] = Integer.parseInt(parts[i].trim());
        }
        return arr;
    }

    private static int[] parseIntArrayParam(String s, String name) {
        int pos = s.indexOf(name);
        if (pos != -1) {
            int start = s.indexOf('[', pos);
            if (start != -1) {
                int end = s.indexOf(']', start);
                if (end != -1) {
                    return parseIntArray(s.substring(start, end + 1));
                }
            }
        }
        return parseIntArray(s);
    }

    private static int[][] parse2DIntArray(String s) {
        List<int[]> list = new ArrayList<>();
        int i = 0;
        while (i < s.length()) {
            int start = s.indexOf('[', i);
            if (start == -1) break;
            int nextOpen = s.indexOf('[', start + 1);
            int nextClose = s.indexOf(']', start + 1);
            if (nextClose == -1) break;
            if (nextOpen != -1 && nextOpen < nextClose) {
                i = start + 1;
                continue;
            }
            String sub = s.substring(start + 1, nextClose).trim();
            if (sub.isEmpty()) {
                list.add(new int[0]);
            } else {
                String[] parts = sub.split(",");
                int[] row = new int[parts.length];
                for (int p = 0; p < parts.length; p++) row[p] = Integer.parseInt(parts[p].trim());
                list.add(row);
            }
            i = nextClose + 1;
        }
        return list.toArray(new int[list.size()][]);
    }

    private static char[][] parse2DCharArray(String s) {
        List<char[]> list = new ArrayList<>();
        int i = 0;
        while (i < s.length()) {
            int start = s.indexOf('[', i);
            if (start == -1) break;
            int nextOpen = s.indexOf('[', start + 1);
            int nextClose = s.indexOf(']', start + 1);
            if (nextClose == -1) break;
            if (nextOpen != -1 && nextOpen < nextClose) {
                i = start + 1;
                continue;
            }
            String sub = s.substring(start + 1, nextClose).trim();
            if (sub.isEmpty()) {
                list.add(new char[0]);
            } else {
                Matcher m = Pattern.compile("\\\"([^\\\"]*)\\\"").matcher(sub);
                List<Character> rowList = new ArrayList<>();
                while (m.find()) {
                    String str = m.group(1);
                    if (!str.isEmpty()) rowList.add(str.charAt(0));
                }
                char[] row = new char[rowList.size()];
                for (int r = 0; r < rowList.size(); r++) row[r] = rowList.get(r);
                list.add(row);
            }
            i = nextClose + 1;
        }
        return list.toArray(new char[list.size()][]);
    }

    private static List<String> parseStringList(String s, String name) {
        List<String> res = new ArrayList<>();
        int nameIdx = s.indexOf(name);
        String target = nameIdx != -1 ? s.substring(nameIdx) : s;
        int start = target.indexOf('[');
        int end = target.indexOf(']', start != -1 ? start : 0);
        if (start != -1 && end != -1) {
            Matcher m = Pattern.compile("\\\"([^\\\"]*)\\\"").matcher(target.substring(start, end + 1));
            while (m.find()) res.add(m.group(1));
        }
        return res;
    }

    private static ListNode toListNode(int[] arr) {
        ListNode dummy = new ListNode(0);
        ListNode cur = dummy;
        for (int v : arr) {
            cur.next = new ListNode(v);
            cur = cur.next;
        }
        return dummy.next;
    }

    private static String listNodeToString(ListNode head) {
        StringBuilder sb = new StringBuilder("[");
        while (head != null) {
            sb.append(head.val);
            if (head.next != null) sb.append(",");
            head = head.next;
        }
        sb.append("]");
        return sb.toString();
    }

    private static TreeNode parseTreeNode(String s) {
        int start = s.indexOf('[');
        int end = s.lastIndexOf(']');
        if (start == -1 || end == -1 || start >= end) return null;
        String content = s.substring(start + 1, end).trim();
        if (content.isEmpty()) return null;
        String[] parts = content.split(",");
        if (parts.length == 0 || parts[0].trim().equals("null")) return null;
        TreeNode root = new TreeNode(Integer.parseInt(parts[0].trim()));
        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        int idx = 1;
        while (!q.isEmpty() && idx < parts.length) {
            TreeNode node = q.poll();
            String leftVal = parts[idx++].trim();
            if (!leftVal.equals("null") && !leftVal.isEmpty()) {
                node.left = new TreeNode(Integer.parseInt(leftVal));
                q.add(node.left);
            }
            if (idx < parts.length) {
                String rightVal = parts[idx++].trim();
                if (!rightVal.equals("null") && !rightVal.isEmpty()) {
                    node.right = new TreeNode(Integer.parseInt(rightVal));
                    q.add(node.right);
                }
            }
        }
        return root;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        StringBuilder sb = new StringBuilder();
        while (sc.hasNextLine()) {
            sb.append(sc.nextLine()).append("\\n");
        }
        String input = sb.toString().trim();
        if (input.isEmpty()) return;
"""
        if method == "twoSum":
            driver += """
        Solution sol = new Solution();
        int[] nums = parseIntArrayParam(input, "nums");
        int target = parseIntParam(input, "target");
        int[] res = sol.twoSum(nums, target);
        System.out.println(Arrays.toString(res).replace(" ", ""));
    }
}
"""
        elif method == "maxProfit":
            driver += """
        Solution sol = new Solution();
        int[] prices = parseIntArray(input);
        int res = sol.maxProfit(prices);
        System.out.println(res);
    }
}
"""
        elif method == "threeSum":
            driver += """
        Solution sol = new Solution();
        int[] nums = parseIntArray(input);
        List<List<Integer>> res = sol.threeSum(nums);
        System.out.println(res.toString().replace(" ", ""));
    }
}
"""
        elif method == "search":
            driver += """
        Solution sol = new Solution();
        int[] nums = parseIntArrayParam(input, "nums");
        int target = parseIntParam(input, "target");
        int res = sol.search(nums, target);
        System.out.println(res);
    }
}
"""
        elif method == "maxArea":
            driver += """
        Solution sol = new Solution();
        int[] height = parseIntArray(input);
        int res = sol.maxArea(height);
        System.out.println(res);
    }
}
"""
        elif method == "trap":
            driver += """
        Solution sol = new Solution();
        int[] height = parseIntArray(input);
        int res = sol.trap(height);
        System.out.println(res);
    }
}
"""
        elif method == "LRUCache":
            driver += """
        String[] lines = input.split("\\\\n");
        String cmdLine = lines[0];
        String argLine = lines.length > 1 ? lines[1] : "[]";
        List<String> cmds = new ArrayList<>();
        Matcher m = Pattern.compile("\\\"([^\\\"]*)\\\"").matcher(cmdLine);
        while (m.find()) cmds.add(m.group(1));
        int[][] argLists = parse2DIntArray(argLine);
        LRUCache cache = null;
        List<String> out = new ArrayList<>();
        for (int i = 0; i < cmds.size(); i++) {
            String c = cmds.get(i);
            int[] a = (i < argLists.length) ? argLists[i] : new int[0];
            if (c.equals("LRUCache")) {
                cache = new LRUCache(a[0]);
                out.add("null");
            } else if (c.equals("put")) {
                cache.put(a[0], a[1]);
                out.add("null");
            } else if (c.equals("get")) {
                out.add(String.valueOf(cache.get(a[0])));
            }
        }
        System.out.println("[" + String.join(",", out) + "]");
    }
}
"""
        elif method == "merge":
            driver += """
        Solution sol = new Solution();
        int[][] intervals = parse2DIntArray(input);
        int[][] res = sol.merge(intervals);
        System.out.println(Arrays.deepToString(res).replace(" ", ""));
    }
}
"""
        elif method == "isValid":
            driver += """
        Solution sol = new Solution();
        String s = parseStringParam(input, "s");
        boolean res = sol.isValid(s);
        System.out.println(res);
    }
}
"""
        elif method == "lengthOfLongestSubstring":
            driver += """
        Solution sol = new Solution();
        String s = parseStringParam(input, "s");
        int res = sol.lengthOfLongestSubstring(s);
        System.out.println(res);
    }
}
"""
        elif method == "numIslands":
            driver += """
        Solution sol = new Solution();
        char[][] grid = parse2DCharArray(input);
        int res = sol.numIslands(grid);
        System.out.println(res);
    }
}
"""
        elif method == "maxSubArray":
            driver += """
        Solution sol = new Solution();
        int[] nums = parseIntArray(input);
        int res = sol.maxSubArray(nums);
        System.out.println(res);
    }
}
"""
        elif method == "mergeKLists":
            driver += """
        Solution sol = new Solution();
        int[][] listsData = parse2DIntArray(input);
        ListNode[] lists = new ListNode[listsData.length];
        for (int i = 0; i < listsData.length; i++) lists[i] = toListNode(listsData[i]);
        ListNode res = sol.mergeKLists(lists);
        System.out.println(listNodeToString(res));
    }
}
"""
        elif method == "maxSlidingWindow":
            driver += """
        Solution sol = new Solution();
        int[] nums = parseIntArrayParam(input, "nums");
        int k = parseIntParam(input, "k");
        int[] res = sol.maxSlidingWindow(nums, k);
        System.out.println(Arrays.toString(res).replace(" ", ""));
    }
}
"""
        elif method == "findMedianSortedArrays":
            driver += """
        Solution sol = new Solution();
        int[] nums1 = parseIntArrayParam(input, "nums1");
        int[] nums2 = parseIntArrayParam(input, "nums2");
        double res = sol.findMedianSortedArrays(nums1, nums2);
        System.out.println(String.format(Locale.US, "%.5f", res));
    }
}
"""
        elif method == "canFinish":
            driver += """
        Solution sol = new Solution();
        int numCourses = parseIntParam(input, "numCourses");
        int[][] prereqs = parse2DIntArray(input.substring(input.indexOf('[')));
        boolean res = sol.canFinish(numCourses, prereqs);
        System.out.println(res);
    }
}
"""
        elif method == "minEatingSpeed":
            driver += """
        Solution sol = new Solution();
        int[] piles = parseIntArrayParam(input, "piles");
        int h = parseIntParam(input, "h");
        int res = sol.minEatingSpeed(piles, h);
        System.out.println(res);
    }
}
"""
        elif method == "moveZeroes":
            driver += """
        Solution sol = new Solution();
        int[] nums = parseIntArray(input);
        sol.moveZeroes(nums);
        System.out.println(Arrays.toString(nums).replace(" ", ""));
    }
}
"""
        elif method == "isAnagram":
            driver += """
        Solution sol = new Solution();
        String s = parseStringParam(input, "s");
        String t = parseStringParam(input, "t");
        boolean res = sol.isAnagram(s, t);
        System.out.println(res);
    }
}
"""
        elif method == "ladderLength":
            driver += """
        Solution sol = new Solution();
        String beginWord = parseStringParam(input, "beginWord");
        String endWord = parseStringParam(input, "endWord");
        List<String> wordList = parseStringList(input, "wordList");
        int res = sol.ladderLength(beginWord, endWord, wordList);
        System.out.println(res);
    }
}
"""
        elif method == "coinChange":
            driver += """
        Solution sol = new Solution();
        int[] coins = parseIntArrayParam(input, "coins");
        int amount = parseIntParam(input, "amount");
        int res = sol.coinChange(coins, amount);
        System.out.println(res);
    }
}
"""
        elif method == "mergeTwoLists":
            driver += """
        Solution sol = new Solution();
        int[] l1Data = parseIntArrayParam(input, "list1");
        int[] l2Data = parseIntArrayParam(input, "list2");
        ListNode res = sol.mergeTwoLists(toListNode(l1Data), toListNode(l2Data));
        System.out.println(listNodeToString(res));
    }
}
"""
        elif method == "addTwoNumbers":
            driver += """
        Solution sol = new Solution();
        int[] l1Data = parseIntArrayParam(input, "l1");
        int[] l2Data = parseIntArrayParam(input, "l2");
        ListNode res = sol.addTwoNumbers(toListNode(l1Data), toListNode(l2Data));
        System.out.println(listNodeToString(res));
    }
}
"""
        elif method == "climbStairs":
            driver += """
        Solution sol = new Solution();
        int n = parseIntParam(input, "n");
        int res = sol.climbStairs(n);
        System.out.println(res);
    }
}
"""
        elif method == "canJump":
            driver += """
        Solution sol = new Solution();
        int[] nums = parseIntArray(input);
        boolean res = sol.canJump(nums);
        System.out.println(res);
    }
}
"""
        elif method == "largestRectangleArea":
            driver += """
        Solution sol = new Solution();
        int[] heights = parseIntArray(input);
        int res = sol.largestRectangleArea(heights);
        System.out.println(res);
    }
}
"""
        elif method == "isValidBST":
            driver += """
        Solution sol = new Solution();
        TreeNode root = parseTreeNode(input);
        boolean res = sol.isValidBST(root);
        System.out.println(res);
    }
}
"""
        elif method == "longestCommonPrefix":
            driver += """
        Solution sol = new Solution();
        List<String> list = parseStringList(input, "strs");
        String[] strs = list.toArray(new String[0]);
        String res = sol.longestCommonPrefix(strs);
        System.out.println(res);
    }
}
"""
        elif method == "isPalindrome":
            driver += """
        Solution sol = new Solution();
        String s = parseStringParam(input, "s");
        boolean res = sol.isPalindrome(s);
        System.out.println(res);
    }
}
"""
        elif method == "romanToInt":
            driver += """
        Solution sol = new Solution();
        String s = parseStringParam(input, "s");
        int res = sol.romanToInt(s);
        System.out.println(res);
    }
}
"""
        elif method == "mergeSortedArray":
            driver += """
        Solution sol = new Solution();
        int[] nums1 = parseIntArrayParam(input, "nums1");
        int m = parseIntParam(input, "m");
        int[] nums2 = parseIntArrayParam(input, "nums2");
        int n = parseIntParam(input, "n");
        sol.mergeSortedArray(nums1, m, nums2, n);
        System.out.println(Arrays.toString(nums1).replace(" ", ""));
    }
}
"""
        elif method == "majorityElement":
            driver += """
        Solution sol = new Solution();
        int[] nums = parseIntArray(input);
        int res = sol.majorityElement(nums);
        System.out.println(res);
    }
}
"""
        elif method == "removeDuplicates":
            driver += """
        Solution sol = new Solution();
        int[] nums = parseIntArray(input);
        int res = sol.removeDuplicates(nums);
        System.out.println(res);
    }
}
"""
        elif method == "firstUniqChar":
            driver += """
        Solution sol = new Solution();
        String s = parseStringParam(input, "s");
        int res = sol.firstUniqChar(s);
        System.out.println(res);
    }
}
"""
        elif method == "containsDuplicate":
            driver += """
        Solution sol = new Solution();
        int[] nums = parseIntArray(input);
        boolean res = sol.containsDuplicate(nums);
        System.out.println(res);
    }
}
"""
        elif method == "sortedSquares":
            driver += """
        Solution sol = new Solution();
        int[] nums = parseIntArray(input);
        int[] res = sol.sortedSquares(nums);
        System.out.println(Arrays.toString(res).replace(" ", ""));
    }
}
"""
        elif method == "reverseString":
            driver += """
        Solution sol = new Solution();
        List<String> list = parseStringList(input, "s");
        char[] s = new char[list.size()];
        for (int i = 0; i < list.size(); i++) s[i] = list.get(i).charAt(0);
        sol.reverseString(s);
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < s.length; i++) {
            sb.append("\\"").append(s[i]).append("\\"");
            if (i + 1 < s.length) sb.append(",");
        }
        sb.append("]");
        System.out.println(sb.toString());
    }
}
"""
        elif method == "validPalindrome":
            driver += """
        Solution sol = new Solution();
        String s = parseStringParam(input, "s");
        boolean res = sol.validPalindrome(s);
        System.out.println(res);
    }
}
"""
        elif method == "isIsomorphic":
            driver += """
        Solution sol = new Solution();
        String s = parseStringParam(input, "s");
        String t = parseStringParam(input, "t");
        boolean res = sol.isIsomorphic(s, t);
        System.out.println(res);
    }
}
"""
        elif method == "isSubsequence":
            driver += """
        Solution sol = new Solution();
        String s = parseStringParam(input, "s");
        String t = parseStringParam(input, "t");
        boolean res = sol.isSubsequence(s, t);
        System.out.println(res);
    }
}
"""
        elif method == "containsNearbyDuplicate":
            driver += """
        Solution sol = new Solution();
        int[] nums = parseIntArray(input);
        int k = parseIntParam(input, "k");
        boolean res = sol.containsNearbyDuplicate(nums, k);
        System.out.println(res);
    }
}
"""
        elif method == "canConstruct":
            driver += """
        Solution sol = new Solution();
        String ransomNote = parseStringParam(input, "ransomNote");
        String magazine = parseStringParam(input, "magazine");
        boolean res = sol.canConstruct(ransomNote, magazine);
        System.out.println(res);
    }
}
"""
        elif method == "findMaxConsecutiveOnes":
            driver += """
        Solution sol = new Solution();
        int[] nums = parseIntArray(input);
        int res = sol.findMaxConsecutiveOnes(nums);
        System.out.println(res);
    }
}
"""
        elif method == "reverseVowels":
            driver += """
        Solution sol = new Solution();
        String s = parseStringParam(input, "s");
        String res = sol.reverseVowels(s);
        System.out.println(res);
    }
}
"""
        elif method == "summaryRanges":
            driver += """
        Solution sol = new Solution();
        int[] nums = parseIntArray(input);
        List<String> res = sol.summaryRanges(nums);
        System.out.println(res.toString().replace(" ", ""));
    }
}
"""
        elif method == "intersect":
            driver += """
        Solution sol = new Solution();
        int[] nums1 = parseIntArrayParam(input, "nums1");
        int[] nums2 = parseIntArrayParam(input, "nums2");
        int[] res = sol.intersect(nums1, nums2);
        Arrays.sort(res);
        System.out.println(Arrays.toString(res).replace(" ", ""));
    }
}
"""
        elif method == "wordPattern":
            driver += """
        Solution sol = new Solution();
        String pattern = parseStringParam(input, "pattern");
        String s = parseStringParam(input, "s");
        boolean res = sol.wordPattern(pattern, s);
        System.out.println(res);
    }
}
"""
        else:
            driver += """
        System.out.println("Execution harness standby: method signature not indexed.");
    }
}
"""
        return all_imports + helpers + cleaned_user_code + driver

    # =========================================================================
    # PYTHON HARNESS
    # =========================================================================
    elif lang in ("python", "py", "python3"):
        driver = """

if __name__ == '__main__':
    import sys, re, json, ast
    raw = sys.stdin.read().strip()
    if raw:
        def __parse_params(s):
            pattern = r'([a-zA-Z_][a-zA-Z0-9_]*)\s*='
            matches = list(re.finditer(pattern, s))
            if matches:
                vals = []
                for i in range(len(matches)):
                    start_val = matches[i].end()
                    end_val = matches[i+1].start() if i + 1 < len(matches) else len(s)
                    val_str = s[start_val:end_val].strip().rstrip(',')
                    try:
                        cleaned = val_str.replace('true', 'True').replace('false', 'False').replace('null', 'None')
                        vals.append(ast.literal_eval(cleaned))
                    except Exception:
                        vals.append(val_str)
                return vals
            try:
                cleaned = s.replace('true', 'True').replace('false', 'False').replace('null', 'None')
                return [ast.literal_eval(cleaned)]
            except Exception:
                return [s]

        try:
            _ = ListNode
        except NameError:
            class ListNode:
                def __init__(self, val=0, next=None):
                    self.val = val
                    self.next = next

        try:
            _ = TreeNode
        except NameError:
            class TreeNode:
                def __init__(self, val=0, left=None, right=None):
                    self.val = val
                    self.left = left
                    self.right = right

        try:
            sol = Solution()
        except Exception:
            sol = None
"""
        if method == "twoSum":
            driver += """
        params = __parse_params(raw)
        res = sol.twoSum(*params)
        print(json.dumps(res, separators=(',', ':')))
"""
        elif method == "maxProfit":
            driver += """
        params = __parse_params(raw)
        res = sol.maxProfit(*params)
        print(res)
"""
        elif method == "threeSum":
            driver += """
        params = __parse_params(raw)
        res = sol.threeSum(*params)
        print(json.dumps(res, separators=(',', ':')))
"""
        elif method == "search":
            driver += """
        params = __parse_params(raw)
        res = sol.search(*params)
        print(res)
"""
        elif method == "maxArea":
            driver += """
        params = __parse_params(raw)
        res = sol.maxArea(*params)
        print(res)
"""
        elif method == "trap":
            driver += """
        params = __parse_params(raw)
        res = sol.trap(*params)
        print(res)
"""
        elif method == "LRUCache":
            driver += """
        lines = [l.strip() for l in raw.split('\\n') if l.strip()]
        cmds = __parse_params(lines[0])[0]
        args = __parse_params(lines[1])[0]
        cache = None
        out = []
        for c, a in zip(cmds, args):
            if c == "LRUCache":
                cache = LRUCache(*a)
                out.append(None)
            elif c == "put":
                cache.put(*a)
                out.append(None)
            elif c == "get":
                out.append(cache.get(*a))
        print(json.dumps(out, separators=(',', ':')))
"""
        elif method == "merge":
            driver += """
        params = __parse_params(raw)
        res = sol.merge(*params)
        print(json.dumps(res, separators=(',', ':')))
"""
        elif method == "isValid":
            driver += """
        params = __parse_params(raw)
        res = sol.isValid(*params)
        print(json.dumps(res))
"""
        elif method == "lengthOfLongestSubstring":
            driver += """
        params = __parse_params(raw)
        res = sol.lengthOfLongestSubstring(*params)
        print(res)
"""
        elif method == "numIslands":
            driver += """
        params = __parse_params(raw)
        res = sol.numIslands(*params)
        print(res)
"""
        elif method == "maxSubArray":
            driver += """
        params = __parse_params(raw)
        res = sol.maxSubArray(*params)
        print(res)
"""
        elif method == "mergeKLists":
            driver += """
        params = __parse_params(raw)
        def to_node(arr):
            dummy = ListNode(0)
            cur = dummy
            for v in arr:
                cur.next = ListNode(v)
                cur = cur.next
            return dummy.next
        def from_node(head):
            res = []
            while head:
                res.append(head.val)
                head = head.next
            return res
        list_nodes = [to_node(sub) for sub in params[0]]
        merged_head = sol.mergeKLists(list_nodes)
        print(json.dumps(from_node(merged_head), separators=(',', ':')))
"""
        elif method == "maxSlidingWindow":
            driver += """
        params = __parse_params(raw)
        res = sol.maxSlidingWindow(*params)
        print(json.dumps(res, separators=(',', ':')))
"""
        elif method == "findMedianSortedArrays":
            driver += """
        params = __parse_params(raw)
        res = sol.findMedianSortedArrays(*params)
        print(f"{float(res):.5f}" if float(res) != int(float(res)) else f"{float(res):.1f}")
"""
        elif method == "canFinish":
            driver += """
        params = __parse_params(raw)
        res = sol.canFinish(*params)
        print(json.dumps(res))
"""
        elif method == "minEatingSpeed":
            driver += """
        params = __parse_params(raw)
        res = sol.minEatingSpeed(*params)
        print(res)
"""
        elif method == "moveZeroes":
            driver += """
        params = __parse_params(raw)
        nums = params[0]
        sol.moveZeroes(nums)
        print(json.dumps(nums, separators=(',', ':')))
"""
        elif method == "isAnagram":
            driver += """
        params = __parse_params(raw)
        res = sol.isAnagram(*params)
        print(json.dumps(res))
"""
        elif method == "ladderLength":
            driver += """
        params = __parse_params(raw)
        res = sol.ladderLength(*params)
        print(res)
"""
        elif method == "coinChange":
            driver += """
        params = __parse_params(raw)
        res = sol.coinChange(*params)
        print(res)
"""
        elif method == "mergeTwoLists":
            driver += """
        params = __parse_params(raw)
        def to_node(arr):
            dummy = ListNode(0)
            cur = dummy
            for v in arr:
                cur.next = ListNode(v)
                cur = cur.next
            return dummy.next
        def from_node(head):
            res = []
            while head:
                res.append(head.val)
                head = head.next
            return res
        l1 = to_node(params[0])
        l2 = to_node(params[1])
        res_head = sol.mergeTwoLists(l1, l2)
        print(json.dumps(from_node(res_head), separators=(',', ':')))
"""
        elif method == "addTwoNumbers":
            driver += """
        params = __parse_params(raw)
        def to_node(arr):
            dummy = ListNode(0)
            cur = dummy
            for v in arr:
                cur.next = ListNode(v)
                cur = cur.next
            return dummy.next
        def from_node(head):
            res = []
            while head:
                res.append(head.val)
                head = head.next
            return res
        l1 = to_node(params[0])
        l2 = to_node(params[1])
        res_head = sol.addTwoNumbers(l1, l2)
        print(json.dumps(from_node(res_head), separators=(',', ':')))
"""
        elif method == "climbStairs":
            driver += """
        params = __parse_params(raw)
        res = sol.climbStairs(*params)
        print(res)
"""
        elif method == "canJump":
            driver += """
        params = __parse_params(raw)
        res = sol.canJump(*params)
        print(json.dumps(res))
"""
        elif method == "largestRectangleArea":
            driver += """
        params = __parse_params(raw)
        res = sol.largestRectangleArea(*params)
        print(res)
"""
        elif method == "isValidBST":
            driver += """
        params = __parse_params(raw)
        arr = params[0]
        def to_tree(nodes):
            if not nodes or nodes[0] is None:
                return None
            root = TreeNode(nodes[0])
            q = [root]
            idx = 1
            while q and idx < len(nodes):
                cur = q.pop(0)
                if idx < len(nodes) and nodes[idx] is not None:
                    cur.left = TreeNode(nodes[idx])
                    q.append(cur.left)
                idx += 1
                if idx < len(nodes) and nodes[idx] is not None:
                    cur.right = TreeNode(nodes[idx])
                    q.append(cur.right)
                idx += 1
            return root
        tree_root = to_tree(arr)
        res = sol.isValidBST(tree_root)
        print(json.dumps(res))
"""
        elif method == "longestCommonPrefix":
            driver += """
        params = __parse_params(raw)
        res = sol.longestCommonPrefix(*params)
        print(res)
"""
        elif method == "isPalindrome":
            driver += """
        params = __parse_params(raw)
        res = sol.isPalindrome(*params)
        print(str(res).lower())
"""
        elif method == "romanToInt":
            driver += """
        params = __parse_params(raw)
        res = sol.romanToInt(*params)
        print(res)
"""
        elif method == "mergeSortedArray":
            driver += """
        params = __parse_params(raw)
        nums1 = params[0]
        sol.mergeSortedArray(*params)
        print(json.dumps(nums1, separators=(',', ':')))
"""
        elif method == "majorityElement":
            driver += """
        params = __parse_params(raw)
        res = sol.majorityElement(*params)
        print(res)
"""
        elif method == "removeDuplicates":
            driver += """
        params = __parse_params(raw)
        res = sol.removeDuplicates(*params)
        print(res)
"""
        elif method == "firstUniqChar":
            driver += """
        params = __parse_params(raw)
        res = sol.firstUniqChar(*params)
        print(res)
"""
        elif method == "containsDuplicate":
            driver += """
        params = __parse_params(raw)
        res = sol.containsDuplicate(*params)
        print(str(res).lower())
"""
        elif method == "sortedSquares":
            driver += """
        params = __parse_params(raw)
        res = sol.sortedSquares(*params)
        print(json.dumps(res, separators=(',', ':')))
"""
        elif method == "reverseString":
            driver += """
        params = __parse_params(raw)
        s = params[0]
        sol.reverseString(s)
        print(json.dumps(s, separators=(',', ':')))
"""
        elif method == "validPalindrome":
            driver += """
        params = __parse_params(raw)
        res = sol.validPalindrome(*params)
        print(str(res).lower())
"""
        elif method == "isIsomorphic":
            driver += """
        params = __parse_params(raw)
        res = sol.isIsomorphic(*params)
        print(str(res).lower())
"""
        elif method == "isSubsequence":
            driver += """
        params = __parse_params(raw)
        res = sol.isSubsequence(*params)
        print(str(res).lower())
"""
        elif method == "containsNearbyDuplicate":
            driver += """
        params = __parse_params(raw)
        res = sol.containsNearbyDuplicate(*params)
        print(str(res).lower())
"""
        elif method == "canConstruct":
            driver += """
        params = __parse_params(raw)
        res = sol.canConstruct(*params)
        print(str(res).lower())
"""
        elif method == "findMaxConsecutiveOnes":
            driver += """
        params = __parse_params(raw)
        res = sol.findMaxConsecutiveOnes(*params)
        print(res)
"""
        elif method == "reverseVowels":
            driver += """
        params = __parse_params(raw)
        res = sol.reverseVowels(*params)
        print(res)
"""
        elif method == "summaryRanges":
            driver += """
        params = __parse_params(raw)
        res = sol.summaryRanges(*params)
        print(json.dumps(res, separators=(',', ':')))
"""
        elif method == "intersect":
            driver += """
        params = __parse_params(raw)
        res = sol.intersect(*params)
        print(json.dumps(sorted(res), separators=(',', ':')))
"""
        elif method == "wordPattern":
            driver += """
        params = __parse_params(raw)
        res = sol.wordPattern(*params)
        print(str(res).lower())
"""
        elif method == "groupAnagrams":
            driver += """
        params = __parse_params(raw)
        res = sol.groupAnagrams(*params)
        sorted_res = sorted([sorted(g) for g in res])
        print(json.dumps(sorted_res, separators=(',', ':')))
"""
        elif method == "longestPalindrome":
            driver += """
        params = __parse_params(raw)
        res = sol.longestPalindrome(*params)
        print(res)
"""
        elif method == "topKFrequent":
            driver += """
        params = __parse_params(raw)
        res = sol.topKFrequent(*params)
        print(json.dumps(sorted(res), separators=(',', ':')))
"""
        elif method == "spiralOrder":
            driver += """
        params = __parse_params(raw)
        res = sol.spiralOrder(*params)
        print(json.dumps(res, separators=(',', ':')))
"""
        elif method == "subarraySum":
            driver += """
        params = __parse_params(raw)
        res = sol.subarraySum(*params)
        print(res)
"""
        elif method == "minMeetingRooms":
            driver += """
        params = __parse_params(raw)
        res = sol.minMeetingRooms(*params)
        print(res)
"""
        elif method == "findKthLargest":
            driver += """
        params = __parse_params(raw)
        res = sol.findKthLargest(*params)
        print(res)
"""
        elif method == "longestConsecutive":
            driver += """
        params = __parse_params(raw)
        res = sol.longestConsecutive(*params)
        print(res)
"""
        elif method == "sortColors":
            driver += """
        params = __parse_params(raw)
        nums = params[0]
        sol.sortColors(nums)
        print(json.dumps(nums, separators=(',', ':')))
"""
        elif method == "compress":
            driver += """
        params = __parse_params(raw)
        chars = params[0]
        res = sol.compress(chars)
        print(res)
"""
        elif method == "productExceptSelf":
            driver += """
        params = __parse_params(raw)
        res = sol.productExceptSelf(*params)
        print(json.dumps(res, separators=(',', ':')))
"""
        elif method == "rotate":
            driver += """
        params = __parse_params(raw)
        nums, k = params[0], params[1]
        sol.rotate(nums, k)
        print(json.dumps(nums, separators=(',', ':')))
"""
        elif method == "reverseWords":
            driver += """
        params = __parse_params(raw)
        res = sol.reverseWords(*params)
        print(res)
"""
        elif method == "findDuplicate":
            driver += """
        params = __parse_params(raw)
        res = sol.findDuplicate(*params)
        print(res)
"""
        elif method == "characterReplacement":
            driver += """
        params = __parse_params(raw)
        res = sol.characterReplacement(*params)
        print(res)
"""
        elif method == "numSubarrayProductLessThanK":
            driver += """
        params = __parse_params(raw)
        res = sol.numSubarrayProductLessThanK(*params)
        print(res)
"""
        elif method == "longestOnes":
            driver += """
        params = __parse_params(raw)
        res = sol.longestOnes(*params)
        print(res)
"""
        elif method == "findClosestElements":
            driver += """
        params = __parse_params(raw)
        res = sol.findClosestElements(*params)
        print(json.dumps(res, separators=(',', ':')))
"""
        elif method == "minSubArrayLen":
            driver += """
        params = __parse_params(raw)
        res = sol.minSubArrayLen(*params)
        print(res)
"""
        elif method == "checkInclusion":
            driver += """
        params = __parse_params(raw)
        res = sol.checkInclusion(*params)
        print(str(res).lower())
"""
        else:
            driver += """
        print("Standby")
"""
        return code + driver

    # =========================================================================
    # TYPESCRIPT HARNESS
    # =========================================================================
    elif lang in ("typescript", "ts"):
        helpers = ""
        ts_no_comments = re.sub(r"/\*.*?\*/", "", code, flags=re.DOTALL)
        ts_no_comments = re.sub(r"//.*", "", ts_no_comments)
        if not re.search(r"\bclass\s+ListNode\b", ts_no_comments):
            helpers += """
class ListNode {
    val: number;
    next: ListNode | null;
    constructor(val?: number, next?: ListNode | null) {
        this.val = (val === undefined ? 0 : val);
        this.next = (next === undefined ? null : next);
    }
}
"""
        if not re.search(r"\bclass\s+TreeNode\b", ts_no_comments):
            helpers += """
class TreeNode {
    val: number;
    left: TreeNode | null;
    right: TreeNode | null;
    constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
        this.val = (val === undefined ? 0 : val);
        this.left = (left === undefined ? null : left);
        this.right = (right === undefined ? null : right);
    }
}
"""
        driver = """
import * as fs from 'fs';

function __parseArray(s: string): any[] {
    const start = s.indexOf('[');
    const end = s.lastIndexOf(']');
    if (start === -1 || end === -1 || start >= end) return [];
    try {
        return JSON.parse(s.substring(start, end + 1));
    } catch {
        const sub = s.substring(start + 1, end).trim();
        if (!sub) return [];
        return sub.split(',').map(x => {
            const t = x.trim();
            const n = Number(t);
            return isNaN(n) ? t : n;
        });
    }
}

function __parseIntParam(s: string, name: string): number {
    const match = s.match(new RegExp(`${name}\\\\s*=\\\\s*(-?\\\\d+)`));
    if (match) return parseInt(match[1], 10);
    const end = s.lastIndexOf(']');
    const rest = end !== -1 ? s.substring(end + 1) : s;
    const match2 = rest.match(/(-?\\\\d+)/);
    if (match2) return parseInt(match2[1], 10);
    return 0;
}

function __parseStringParam(s: string, name: string): string {
    const match = s.match(new RegExp(`${name}\\\\s*=\\\\s*\\\"([^\\\"]*)\\\"`));
    if (match) return match[1];
    const match2 = s.match(/\\\"([^\\\"]*)\\\"/);
    if (match2) return match2[1];
    return "";
}

try {
    const __raw = fs.readFileSync(0, 'utf-8').trim();
    if (__raw) {
        const sol: any = typeof Solution !== 'undefined' ? new (Solution as any)() : null;
"""
        if method == "twoSum":
            driver += """
        const nums = __parseArray(__raw);
        const target = __parseIntParam(__raw, "target");
        const res = typeof twoSum === 'function' ? twoSum(nums, target) : sol.twoSum(nums, target);
        console.log(JSON.stringify(res));
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "maxProfit":
            driver += """
        const prices = __parseArray(__raw);
        const res = typeof maxProfit === 'function' ? maxProfit(prices) : sol.maxProfit(prices);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "threeSum":
            driver += """
        const nums = __parseArray(__raw);
        const res = typeof threeSum === 'function' ? threeSum(nums) : sol.threeSum(nums);
        console.log(JSON.stringify(res));
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "search":
            driver += """
        const nums = __parseArray(__raw);
        const target = __parseIntParam(__raw, "target");
        const res = typeof search === 'function' ? search(nums, target) : sol.search(nums, target);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "maxArea":
            driver += """
        const height = __parseArray(__raw);
        const res = typeof maxArea === 'function' ? maxArea(height) : sol.maxArea(height);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "trap":
            driver += """
        const height = __parseArray(__raw);
        const res = typeof trap === 'function' ? trap(height) : sol.trap(height);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "isValid":
            driver += """
        const s = __parseStringParam(__raw, "s");
        const res = typeof isValid === 'function' ? isValid(s) : sol.isValid(s);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "lengthOfLongestSubstring":
            driver += """
        const s = __parseStringParam(__raw, "s");
        const res = typeof lengthOfLongestSubstring === 'function' ? lengthOfLongestSubstring(s) : sol.lengthOfLongestSubstring(s);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "maxSubArray":
            driver += """
        const nums = __parseArray(__raw);
        const res = typeof maxSubArray === 'function' ? maxSubArray(nums) : sol.maxSubArray(nums);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "merge":
            driver += """
        const intervals = __parseArray(__raw);
        const res = typeof merge === 'function' ? merge(intervals) : sol.merge(intervals);
        console.log(JSON.stringify(res));
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "canJump":
            driver += """
        const nums = __parseArray(__raw);
        const res = typeof canJump === 'function' ? canJump(nums) : sol.canJump(nums);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "climbStairs":
            driver += """
        const n = __parseIntParam(__raw, "n");
        const res = typeof climbStairs === 'function' ? climbStairs(n) : sol.climbStairs(n);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "coinChange":
            driver += """
        const coins = __parseArray(__raw);
        const amount = __parseIntParam(__raw, "amount");
        const res = typeof coinChange === 'function' ? coinChange(coins, amount) : sol.coinChange(coins, amount);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "isAnagram":
            driver += """
        const s = __parseStringParam(__raw, "s");
        const t = __parseStringParam(__raw, "t");
        const res = typeof isAnagram === 'function' ? isAnagram(s, t) : sol.isAnagram(s, t);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "moveZeroes":
            driver += """
        const nums = __parseArray(__raw);
        if (typeof moveZeroes === 'function') moveZeroes(nums);
        else sol.moveZeroes(nums);
        console.log(JSON.stringify(nums));
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "minEatingSpeed":
            driver += """
        const piles = __parseArray(__raw);
        const h = __parseIntParam(__raw, "h");
        const res = typeof minEatingSpeed === 'function' ? minEatingSpeed(piles, h) : sol.minEatingSpeed(piles, h);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "largestRectangleArea":
            driver += """
        const heights = __parseArray(__raw);
        const res = typeof largestRectangleArea === 'function' ? largestRectangleArea(heights) : sol.largestRectangleArea(heights);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "numIslands":
            driver += """
        const grid = __parseArray(__raw);
        const res = typeof numIslands === 'function' ? numIslands(grid) : sol.numIslands(grid);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "maxSlidingWindow":
            driver += """
        const nums = __parseArray(__raw);
        const k = __parseIntParam(__raw, "k");
        const res = typeof maxSlidingWindow === 'function' ? maxSlidingWindow(nums, k) : sol.maxSlidingWindow(nums, k);
        console.log(JSON.stringify(res));
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "canFinish":
            driver += """
        const numCourses = __parseIntParam(__raw, "numCourses");
        const prereqs = __parseArray(__raw);
        const res = typeof canFinish === 'function' ? canFinish(numCourses, prereqs) : sol.canFinish(numCourses, prereqs);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "findMedianSortedArrays":
            driver += """
        const nums1 = __parseArray(__raw);
        const match = __raw.match(/nums2\\\\s*=\\\\s*(\\\\[[^\\\\]]*\\\\])/);
        const nums2 = match ? JSON.parse(match[1]) : [];
        const res = typeof findMedianSortedArrays === 'function' ? findMedianSortedArrays(nums1, nums2) : sol.findMedianSortedArrays(nums1, nums2);
        console.log(Number(res).toFixed(5));
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "ladderLength":
            driver += """
        const bw = __parseStringParam(__raw, "beginWord");
        const ew = __parseStringParam(__raw, "endWord");
        const wl = __parseArray(__raw);
        const res = typeof ladderLength === 'function' ? ladderLength(bw, ew, wl) : sol.ladderLength(bw, ew, wl);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "LRUCache":
            driver += """
        const lines = __raw.split('\\n').filter((l: string) => l.trim().length > 0);
        const cmds = JSON.parse(lines[0].substring(lines[0].indexOf('[')));
        const args = JSON.parse(lines[1].substring(lines[1].indexOf('[')));
        let cache: any = null;
        const out: any[] = [];
        for (let i = 0; i < cmds.length; i++) {
            const c = cmds[i];
            const a = args[i];
            if (c === "LRUCache") {
                cache = new (LRUCache as any)(a[0]);
                out.push(null);
            } else if (c === "put") {
                cache.put(a[0], a[1]);
                out.push(null);
            } else if (c === "get") {
                out.push(cache.get(a[0]));
            }
        }
        console.log(JSON.stringify(out));
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "longestCommonPrefix":
            driver += """
        const strs = __parseArray(__raw);
        const res = typeof longestCommonPrefix === 'function' ? longestCommonPrefix(strs) : sol.longestCommonPrefix(strs);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "isPalindrome":
            driver += """
        const s = __parseStringParam(__raw, "s");
        const res = typeof isPalindrome === 'function' ? isPalindrome(s) : sol.isPalindrome(s);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "romanToInt":
            driver += """
        const s = __parseStringParam(__raw, "s");
        const res = typeof romanToInt === 'function' ? romanToInt(s) : sol.romanToInt(s);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "mergeSortedArray":
            driver += """
        const nums1 = __parseArray(__raw.substring(0, __raw.indexOf("m =") !== -1 ? __raw.indexOf("m =") : __raw.length));
        const m = __parseIntParam(__raw, "m");
        const nums2Part = __raw.indexOf("nums2") !== -1 ? __raw.substring(__raw.indexOf("nums2")) : "";
        const nums2 = __parseArray(nums2Part);
        const n = __parseIntParam(__raw, "n");
        if (typeof mergeSortedArray === 'function') {
            mergeSortedArray(nums1, m, nums2, n);
        } else {
            sol.mergeSortedArray(nums1, m, nums2, n);
        }
        console.log(JSON.stringify(nums1));
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "majorityElement":
            driver += """
        const nums = __parseArray(__raw);
        const res = typeof majorityElement === 'function' ? majorityElement(nums) : sol.majorityElement(nums);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "removeDuplicates":
            driver += """
        const nums = __parseArray(__raw);
        const res = typeof removeDuplicates === 'function' ? removeDuplicates(nums) : sol.removeDuplicates(nums);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "firstUniqChar":
            driver += """
        const s = __parseStringParam(__raw, "s");
        const res = typeof firstUniqChar === 'function' ? firstUniqChar(s) : sol.firstUniqChar(s);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "containsDuplicate":
            driver += """
        const nums = __parseArray(__raw);
        const res = typeof containsDuplicate === 'function' ? containsDuplicate(nums) : sol.containsDuplicate(nums);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "sortedSquares":
            driver += """
        const nums = __parseArray(__raw);
        const res = typeof sortedSquares === 'function' ? sortedSquares(nums) : sol.sortedSquares(nums);
        console.log(JSON.stringify(res));
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "reverseString":
            driver += """
        const s = __parseArray(__raw);
        if (typeof reverseString === 'function') reverseString(s);
        else sol.reverseString(s);
        console.log(JSON.stringify(s));
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "validPalindrome":
            driver += """
        const s = __parseStringParam(__raw, "s");
        const res = typeof validPalindrome === 'function' ? validPalindrome(s) : sol.validPalindrome(s);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "isIsomorphic":
            driver += """
        const s = __parseStringParam(__raw, "s");
        const t = __parseStringParam(__raw, "t");
        const res = typeof isIsomorphic === 'function' ? isIsomorphic(s, t) : sol.isIsomorphic(s, t);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "isSubsequence":
            driver += """
        const s = __parseStringParam(__raw, "s");
        const t = __parseStringParam(__raw, "t");
        const res = typeof isSubsequence === 'function' ? isSubsequence(s, t) : sol.isSubsequence(s, t);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "containsNearbyDuplicate":
            driver += """
        const nums = __parseArray(__raw);
        const k = __parseIntParam(__raw, "k");
        const res = typeof containsNearbyDuplicate === 'function' ? containsNearbyDuplicate(nums, k) : sol.containsNearbyDuplicate(nums, k);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "canConstruct":
            driver += """
        const ransomNote = __parseStringParam(__raw, "ransomNote");
        const magazine = __parseStringParam(__raw, "magazine");
        const res = typeof canConstruct === 'function' ? canConstruct(ransomNote, magazine) : sol.canConstruct(ransomNote, magazine);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "findMaxConsecutiveOnes":
            driver += """
        const nums = __parseArray(__raw);
        const res = typeof findMaxConsecutiveOnes === 'function' ? findMaxConsecutiveOnes(nums) : sol.findMaxConsecutiveOnes(nums);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "reverseVowels":
            driver += """
        const s = __parseStringParam(__raw, "s");
        const res = typeof reverseVowels === 'function' ? reverseVowels(s) : sol.reverseVowels(s);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "summaryRanges":
            driver += """
        const nums = __parseArray(__raw);
        const res = typeof summaryRanges === 'function' ? summaryRanges(nums) : sol.summaryRanges(nums);
        console.log(JSON.stringify(res));
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "intersect":
            driver += """
        const n2pos = __raw.indexOf("nums2");
        const p1 = n2pos !== -1 ? __raw.substring(0, n2pos) : __raw;
        const p2 = n2pos !== -1 ? __raw.substring(n2pos) : "";
        const nums1 = __parseArray(p1);
        const nums2 = __parseArray(p2);
        const res = typeof intersect === 'function' ? intersect(nums1, nums2) : sol.intersect(nums1, nums2);
        res.sort((a: number, b: number) => a - b);
        console.log(JSON.stringify(res));
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "wordPattern":
            driver += """
        const pattern = __parseStringParam(__raw, "pattern");
        const s = __parseStringParam(__raw, "s");
        const res = typeof wordPattern === 'function' ? wordPattern(pattern, s) : sol.wordPattern(pattern, s);
        console.log(res);
    }
} catch (e) {
    console.log("Standby");
}
"""
        elif method == "addTwoNumbers":
            driver += """
        function toListNode(arr: number[]): ListNode | null {
            const dummy = new ListNode(0);
            let cur = dummy;
            for (const v of arr) {
                cur.next = new ListNode(v);
                cur = cur.next;
            }
            return dummy.next;
        }
        function listNodeToArray(head: ListNode | null): number[] {
            const res: number[] = [];
            while (head !== null) {
                res.push(head.val);
                head = head.next;
            }
            return res;
        }
        const p1 = __raw.indexOf("l1");
        const p2 = __raw.indexOf("l2");
        let l1Arr: number[] = [];
        let l2Arr: number[] = [];
        if (p1 !== -1 && p2 !== -1) {
            const part1 = __raw.substring(p1, p2);
            const part2 = __raw.substring(p2);
            l1Arr = __parseArray(part1);
            l2Arr = __parseArray(part2);
        } else {
            l1Arr = __parseArray(__raw);
        }
        const l1 = toListNode(l1Arr);
        const l2 = toListNode(l2Arr);
        const res = typeof addTwoNumbers === 'function' ? addTwoNumbers(l1, l2) : sol.addTwoNumbers(l1, l2);
        console.log(JSON.stringify(listNodeToArray(res)));
    }
} catch (e) {
    console.log("Standby");
}
"""
        else:
            driver += """
        console.log("Standby");
    }
} catch (e) {
    console.log("Standby");
}
"""
        return helpers + code + driver

    # =========================================================================
    # C++ HARNESS
    # =========================================================================
    elif lang in ("cpp", "c++"):
        helpers = ""
        cpp_no_comments = re.sub(r"/\*.*?\*/", "", code, flags=re.DOTALL)
        cpp_no_comments = re.sub(r"//.*", "", cpp_no_comments)
        if not re.search(r"\b(?:struct|class)\s+ListNode\b", cpp_no_comments):
            helpers += """
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};
"""
        if not re.search(r"\b(?:struct|class)\s+TreeNode\b", cpp_no_comments):
            helpers += """
struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};
"""
        driver = """
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <cctype>
#include <algorithm>
#include <iomanip>

static std::vector<int> __parseVector(const std::string& s) {
    std::vector<int> res;
    size_t start = s.find('[');
    size_t end = s.rfind(']');
    if (start == std::string::npos || end == std::string::npos || start >= end) return res;
    std::string sub = s.substr(start + 1, end - start - 1);
    std::stringstream ss(sub);
    std::string token;
    while (std::getline(ss, token, ',')) {
        std::stringstream ts(token);
        int val;
        if (ts >> val) res.push_back(val);
    }
    return res;
}

static ListNode* __toListNode(const std::vector<int>& arr) {
    ListNode dummy(0);
    ListNode* cur = &dummy;
    for (int v : arr) {
        cur->next = new ListNode(v);
        cur = cur->next;
    }
    return dummy.next;
}

static void __printListNode(ListNode* head) {
    std::cout << "[";
    bool first = true;
    while (head != nullptr) {
        if (!first) std::cout << ",";
        std::cout << head->val;
        first = false;
        head = head->next;
    }
    std::cout << "]" << std::endl;
}

static std::vector<int> __parseVectorParam(const std::string& s, const std::string& name) {
    size_t pos = s.find(name);
    if (pos != std::string::npos) {
        size_t start = s.find('[', pos);
        if (start != std::string::npos) {
            size_t end = s.find(']', start);
            if (end != std::string::npos) {
                return __parseVector(s.substr(start, end - start + 1));
            }
        }
    }
    return __parseVector(s);
}

static int __parseIntParam(const std::string& s, const std::string& name) {
    size_t pos = s.find(name);
    if (pos != std::string::npos) {
        size_t eq = s.find('=', pos);
        if (eq != std::string::npos) {
            size_t start = eq + 1;
            while (start < s.size() && (s[start] == ' ' || s[start] == '\\t')) start++;
            size_t end = start;
            if (end < s.size() && (s[end] == '-' || s[end] == '+')) end++;
            while (end < s.size() && isdigit(s[end])) end++;
            if (end > start) {
                try { return std::stoi(s.substr(start, end - start)); } catch (...) {}
            }
        }
    }
    size_t end = s.rfind(']');
    std::string rest = (end != std::string::npos) ? s.substr(end + 1) : s;
    for (size_t i = 0; i < rest.size(); ++i) {
        if (isdigit(rest[i]) || (rest[i] == '-' && i + 1 < rest.size() && isdigit(rest[i+1]))) {
            size_t j = (rest[i] == '-') ? i + 1 : i;
            while (j < rest.size() && isdigit(rest[j])) j++;
            try { return std::stoi(rest.substr(i, j - i)); } catch (...) {}
        }
    }
    return 0;
}

static std::string __parseStringParam(const std::string& s, const std::string& name) {
    size_t pos = s.find(name);
    size_t startQuote = (pos != std::string::npos) ? s.find('\"', pos) : s.find('\"');
    if (startQuote != std::string::npos) {
        size_t endQuote = s.find('\"', startQuote + 1);
        if (endQuote != std::string::npos) {
            return s.substr(startQuote + 1, endQuote - startQuote - 1);
        }
    }
    return "";
}

static std::vector<std::string> __parseStringVector(const std::string& s) {
    std::vector<std::string> res;
    size_t start = s.find('[');
    size_t end = s.rfind(']');
    if (start == std::string::npos || end == std::string::npos || start >= end) return res;
    size_t i = start + 1;
    while (i < end) {
        size_t q1 = s.find('\"', i);
        if (q1 == std::string::npos || q1 >= end) break;
        size_t q2 = s.find('\"', q1 + 1);
        if (q2 == std::string::npos || q2 > end) break;
        res.push_back(s.substr(q1 + 1, q2 - q1 - 1));
        i = q2 + 1;
    }
    return res;
}

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    std::string input, line;
    while (std::getline(std::cin, line)) {
        input += line + "\\n";
    }
    if (input.empty()) return 0;
    Solution sol;
"""
        if method == "twoSum":
            driver += """
    std::vector<int> nums = __parseVector(input);
    int target = __parseIntParam(input, "target");
    auto res = sol.twoSum(nums, target);
    std::cout << "[";
    for (size_t i = 0; i < res.size(); ++i) {
        std::cout << res[i] << (i + 1 < res.size() ? "," : "");
    }
    std::cout << "]" << std::endl;
    return 0;
}
"""
        elif method == "maxProfit":
            driver += """
    std::vector<int> prices = __parseVector(input);
    int res = sol.maxProfit(prices);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "threeSum":
            driver += """
    std::vector<int> nums = __parseVector(input);
    auto res = sol.threeSum(nums);
    std::cout << "[";
    for (size_t i = 0; i < res.size(); ++i) {
        std::cout << "[";
        for (size_t j = 0; j < res[i].size(); ++j) {
            std::cout << res[i][j] << (j + 1 < res[i].size() ? "," : "");
        }
        std::cout << "]" << (i + 1 < res.size() ? "," : "");
    }
    std::cout << "]" << std::endl;
    return 0;
}
"""
        elif method == "search":
            driver += """
    std::vector<int> nums = __parseVector(input);
    int target = __parseIntParam(input, "target");
    int res = sol.search(nums, target);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "maxArea":
            driver += """
    std::vector<int> height = __parseVector(input);
    int res = sol.maxArea(height);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "trap":
            driver += """
    std::vector<int> height = __parseVector(input);
    int res = sol.trap(height);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "isValid":
            driver += """
    std::string s = __parseStringParam(input, "s");
    bool res = sol.isValid(s);
    std::cout << (res ? "true" : "false") << std::endl;
    return 0;
}
"""
        elif method == "lengthOfLongestSubstring":
            driver += """
    std::string s = __parseStringParam(input, "s");
    int res = sol.lengthOfLongestSubstring(s);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "maxSubArray":
            driver += """
    std::vector<int> nums = __parseVector(input);
    int res = sol.maxSubArray(nums);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "canJump":
            driver += """
    std::vector<int> nums = __parseVector(input);
    bool res = sol.canJump(nums);
    std::cout << (res ? "true" : "false") << std::endl;
    return 0;
}
"""
        elif method == "climbStairs":
            driver += """
    int n = __parseIntParam(input, "n");
    int res = sol.climbStairs(n);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "coinChange":
            driver += """
    std::vector<int> coins = __parseVector(input);
    int amount = __parseIntParam(input, "amount");
    int res = sol.coinChange(coins, amount);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "isAnagram":
            driver += """
    std::string s = __parseStringParam(input, "s");
    std::string t = __parseStringParam(input, "t");
    bool res = sol.isAnagram(s, t);
    std::cout << (res ? "true" : "false") << std::endl;
    return 0;
}
"""
        elif method == "minEatingSpeed":
            driver += """
    std::vector<int> piles = __parseVector(input);
    int h = __parseIntParam(input, "h");
    int res = sol.minEatingSpeed(piles, h);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "largestRectangleArea":
            driver += """
    std::vector<int> heights = __parseVector(input);
    int res = sol.largestRectangleArea(heights);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "longestCommonPrefix":
            driver += """
    std::vector<std::string> strs = __parseStringVector(input);
    std::string res = sol.longestCommonPrefix(strs);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "isPalindrome":
            driver += """
    std::string s = __parseStringParam(input, "s");
    bool res = sol.isPalindrome(s);
    std::cout << (res ? "true" : "false") << std::endl;
    return 0;
}
"""
        elif method == "romanToInt":
            driver += """
    std::string s = __parseStringParam(input, "s");
    int res = sol.romanToInt(s);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "mergeSortedArray":
            driver += """
    std::vector<int> nums1 = __parseVector(input);
    int m = __parseIntParam(input, "m");
    size_t p2 = input.find("nums2");
    std::string s2 = (p2 != std::string::npos) ? input.substr(p2) : input;
    std::vector<int> nums2 = __parseVector(s2);
    int n = __parseIntParam(input, "n");
    sol.mergeSortedArray(nums1, m, nums2, n);
    std::cout << "[";
    for (size_t i = 0; i < nums1.size(); ++i) {
        std::cout << nums1[i] << (i + 1 < nums1.size() ? "," : "");
    }
    std::cout << "]" << std::endl;
    return 0;
}
"""
        elif method == "majorityElement":
            driver += """
    std::vector<int> nums = __parseVector(input);
    int res = sol.majorityElement(nums);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "removeDuplicates":
            driver += """
    std::vector<int> nums = __parseVector(input);
    int res = sol.removeDuplicates(nums);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "firstUniqChar":
            driver += """
    std::string s = __parseStringParam(input, "s");
    int res = sol.firstUniqChar(s);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "containsDuplicate":
            driver += """
    std::vector<int> nums = __parseVector(input);
    bool res = sol.containsDuplicate(nums);
    std::cout << (res ? "true" : "false") << std::endl;
    return 0;
}
"""
        elif method == "sortedSquares":
            driver += """
    std::vector<int> nums = __parseVector(input);
    std::vector<int> res = sol.sortedSquares(nums);
    std::cout << "[";
    for (size_t i = 0; i < res.size(); ++i) std::cout << res[i] << (i + 1 < res.size() ? "," : "");
    std::cout << "]" << std::endl;
    return 0;
}
"""
        elif method == "reverseString":
            driver += """
    std::vector<std::string> raw = __parseStringVector(input);
    std::vector<char> s;
    for (const auto& str : raw) if (!str.empty()) s.push_back(str[0]);
    sol.reverseString(s);
    std::cout << "[";
    for (size_t i = 0; i < s.size(); ++i) std::cout << "\\"" << s[i] << "\\"" << (i + 1 < s.size() ? "," : "");
    std::cout << "]" << std::endl;
    return 0;
}
"""
        elif method == "validPalindrome":
            driver += """
    std::string s = __parseStringParam(input, "s");
    bool res = sol.validPalindrome(s);
    std::cout << (res ? "true" : "false") << std::endl;
    return 0;
}
"""
        elif method == "isIsomorphic":
            driver += """
    std::string s = __parseStringParam(input, "s");
    std::string t = __parseStringParam(input, "t");
    bool res = sol.isIsomorphic(s, t);
    std::cout << (res ? "true" : "false") << std::endl;
    return 0;
}
"""
        elif method == "isSubsequence":
            driver += """
    std::string s = __parseStringParam(input, "s");
    std::string t = __parseStringParam(input, "t");
    bool res = sol.isSubsequence(s, t);
    std::cout << (res ? "true" : "false") << std::endl;
    return 0;
}
"""
        elif method == "containsNearbyDuplicate":
            driver += """
    std::vector<int> nums = __parseVector(input);
    int k = __parseIntParam(input, "k");
    bool res = sol.containsNearbyDuplicate(nums, k);
    std::cout << (res ? "true" : "false") << std::endl;
    return 0;
}
"""
        elif method == "canConstruct":
            driver += """
    std::string ransomNote = __parseStringParam(input, "ransomNote");
    std::string magazine = __parseStringParam(input, "magazine");
    bool res = sol.canConstruct(ransomNote, magazine);
    std::cout << (res ? "true" : "false") << std::endl;
    return 0;
}
"""
        elif method == "findMaxConsecutiveOnes":
            driver += """
    std::vector<int> nums = __parseVector(input);
    int res = sol.findMaxConsecutiveOnes(nums);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "reverseVowels":
            driver += """
    std::string s = __parseStringParam(input, "s");
    std::string res = sol.reverseVowels(s);
    std::cout << res << std::endl;
    return 0;
}
"""
        elif method == "summaryRanges":
            driver += """
    std::vector<int> nums = __parseVector(input);
    std::vector<std::string> res = sol.summaryRanges(nums);
    std::cout << "[";
    for (size_t i = 0; i < res.size(); ++i) std::cout << "\\"" << res[i] << "\\"" << (i + 1 < res.size() ? "," : "");
    std::cout << "]" << std::endl;
    return 0;
}
"""
        elif method == "intersect":
            driver += """
    size_t n2pos = input.find("nums2");
    std::string p1 = (n2pos != std::string::npos) ? input.substr(0, n2pos) : input;
    std::string p2 = (n2pos != std::string::npos) ? input.substr(n2pos) : "";
    std::vector<int> nums1 = __parseVector(p1);
    std::vector<int> nums2 = __parseVector(p2);
    std::vector<int> res = sol.intersect(nums1, nums2);
    std::sort(res.begin(), res.end());
    std::cout << "[";
    for (size_t i = 0; i < res.size(); ++i) std::cout << res[i] << (i + 1 < res.size() ? "," : "");
    std::cout << "]" << std::endl;
    return 0;
}
"""
        elif method == "wordPattern":
            driver += """
    std::string pattern = __parseStringParam(input, "pattern");
    std::string s = __parseStringParam(input, "s");
    bool res = sol.wordPattern(pattern, s);
    std::cout << (res ? "true" : "false") << std::endl;
    return 0;
}
"""
        elif method == "addTwoNumbers":
            driver += """
    std::vector<int> l1Data = __parseVectorParam(input, "l1");
    std::vector<int> l2Data = __parseVectorParam(input, "l2");
    ListNode* res = sol.addTwoNumbers(__toListNode(l1Data), __toListNode(l2Data));
    __printListNode(res);
    return 0;
}
"""
        else:
            driver += """
    std::cout << "Standby" << std::endl;
    return 0;
}
"""
        return helpers + code + driver

    # =========================================================================
    # GO HARNESS
    # =========================================================================
    elif lang == "go":
        # If user code does not have func main, we leave as-is or append if needed
        return code

    return code
