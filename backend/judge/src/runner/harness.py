"""Driver Harness Injector for LeetCode-style solution snippets."""
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
    return False

def detect_solution_method(code: str) -> str:
    """Identify the LeetCode method being implemented."""
    if re.search(r"\btwoSum\b", code):
        return "twoSum"
    if re.search(r"\bmaxProfit\b", code):
        return "maxProfit"
    if re.search(r"\bthreeSum\b", code):
        return "threeSum"
    if re.search(r"\bsearch\b", code):
        return "search"
    if re.search(r"\bmaxArea\b", code):
        return "maxArea"
    if re.search(r"\btrap\b", code):
        return "trap"
    return "unknown"

def inject_harness(language: str, code: str) -> str:
    """Wrap or append a test harness to invoke the Solution class method."""
    if has_main_entrypoint(language, code):
        return code

    lang = language.lower()
    method = detect_solution_method(code)
    if method == "unknown" and "class Solution" not in code and "function " not in code:
        return code

    if lang in ("java",):
        # Convert 'public class Solution' to 'class Solution' so Main can be the public class
        sanitized_code = re.sub(r"\bpublic\s+class\s+Solution\b", "class Solution", code)
        
        driver = """

public class Main {
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

    private static int parseIntParam(String s, String paramName) {
        java.util.regex.Matcher m = java.util.regex.Pattern.compile(paramName + "\\\\s*=\\\\s*(-?\\\\d+)").matcher(s);
        if (m.find()) return Integer.parseInt(m.group(1));
        int end = s.lastIndexOf(']');
        String rest = end != -1 ? s.substring(end + 1) : s;
        java.util.regex.Matcher m2 = java.util.regex.Pattern.compile("(-?\\\\d+)").matcher(rest);
        if (m2.find()) return Integer.parseInt(m2.group(1));
        return 0;
    }

    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        StringBuilder sb = new StringBuilder();
        while (sc.hasNextLine()) {
            sb.append(sc.nextLine()).append("\\n");
        }
        String input = sb.toString().trim();
        if (input.isEmpty()) return;
        Solution sol = new Solution();
"""
        if method == "twoSum":
            driver += """
        int[] nums = parseIntArray(input);
        int target = parseIntParam(input, "target");
        int[] res = sol.twoSum(nums, target);
        System.out.println(java.util.Arrays.toString(res).replace(" ", ""));
    }
}
"""
        elif method == "maxProfit":
            driver += """
        int[] prices = parseIntArray(input);
        int res = sol.maxProfit(prices);
        System.out.println(res);
    }
}
"""
        elif method == "threeSum":
            driver += """
        int[] nums = parseIntArray(input);
        java.util.List<java.util.List<Integer>> res = sol.threeSum(nums);
        System.out.println(res.toString().replace(" ", ""));
    }
}
"""
        elif method == "search":
            driver += """
        int[] nums = parseIntArray(input);
        int target = parseIntParam(input, "target");
        int res = sol.search(nums, target);
        System.out.println(res);
    }
}
"""
        elif method == "maxArea":
            driver += """
        int[] height = parseIntArray(input);
        int res = sol.maxArea(height);
        System.out.println(res);
    }
}
"""
        elif method == "trap":
            driver += """
        int[] height = parseIntArray(input);
        int res = sol.trap(height);
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
        return sanitized_code + driver

    elif lang in ("cpp", "c++"):
        driver = """

#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <regex>

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

static int __parseIntParam(const std::string& s, const std::string& name) {
    std::regex r(name + "\\\\s*=\\\\s*(-?\\\\d+)");
    std::smatch m;
    if (std::regex_search(s, m, r)) return std::stoi(m[1].str());
    size_t end = s.rfind(']');
    std::string rest = (end != std::string::npos) ? s.substr(end + 1) : s;
    std::regex r2("(-?\\\\d+)");
    if (std::regex_search(rest, m, r2)) return std::stoi(m[1].str());
    return 0;
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
        else:
            driver += """
    std::cout << "Standby" << std::endl;
    return 0;
}
"""
        return code + driver

    elif lang in ("python", "py", "python3"):
        driver = """

if __name__ == '__main__':
    import sys, re, json
    raw = sys.stdin.read().strip()
    if raw:
        def __parse_array(s):
            m = re.search(r'\[(.*?)\]', s)
            if not m: return []
            content = m.group(1).strip()
            if not content: return []
            return [int(x.strip()) for x in content.split(',') if x.strip()]

        def __parse_target(s, name="target"):
            m = re.search(r'(?:' + name + r')\s*=\s*(-?\d+)', s)
            if m: return int(m.group(1))
            last_bracket = s.rfind(']')
            rest = s[last_bracket + 1:] if last_bracket != -1 else s
            m2 = re.search(r'(-?\d+)', rest)
            if m2: return int(m2.group(1))
            return 0

        sol = Solution()
"""
        if method == "twoSum":
            driver += """
        nums = __parse_array(raw)
        target = __parse_target(raw, "target")
        res = sol.twoSum(nums, target)
        print(json.dumps(res, separators=(',', ':')))
"""
        elif method == "maxProfit":
            driver += """
        prices = __parse_array(raw)
        res = sol.maxProfit(prices)
        print(res)
"""
        elif method == "threeSum":
            driver += """
        nums = __parse_array(raw)
        res = sol.threeSum(nums)
        print(json.dumps(res, separators=(',', ':')))
"""
        elif method == "search":
            driver += """
        nums = __parse_array(raw)
        target = __parse_target(raw, "target")
        res = sol.search(nums, target)
        print(res)
"""
        elif method == "maxArea":
            driver += """
        height = __parse_array(raw)
        res = sol.maxArea(height)
        print(res)
"""
        elif method == "trap":
            driver += """
        height = __parse_array(raw)
        res = sol.trap(height)
        print(res)
"""
        else:
            driver += """
        print("Standby")
"""
        return code + driver

    elif lang in ("typescript", "ts"):
        driver = """

import * as fs from 'fs';

function __parseArray(s: string): number[] {
    const start = s.indexOf('[');
    const end = s.lastIndexOf(']');
    if (start === -1 || end === -1 || start >= end) return [];
    const sub = s.substring(start + 1, end).trim();
    if (!sub) return [];
    return sub.split(',').map(x => parseInt(x.trim(), 10)).filter(x => !isNaN(x));
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

try {
    const __raw = fs.readFileSync(0, 'utf-8').trim();
    if (__raw) {
"""
        if method == "twoSum":
            driver += """
        const nums = __parseArray(__raw);
        const target = __parseIntParam(__raw, "target");
        // Check if defined as function or inside class
        const res = typeof twoSum === 'function' ? twoSum(nums, target) : (new (Solution as any)()).twoSum(nums, target);
        console.log(JSON.stringify(res));
    }
} catch (e) {
    // Standby
}
"""
        elif method == "maxProfit":
            driver += """
        const prices = __parseArray(__raw);
        const res = typeof maxProfit === 'function' ? maxProfit(prices) : (new (Solution as any)()).maxProfit(prices);
        console.log(res);
    }
} catch (e) {
    // Standby
}
"""
        else:
            driver += """
        console.log("Standby");
    }
} catch (e) {
    // Standby
}
"""
        return code + driver

    return code
