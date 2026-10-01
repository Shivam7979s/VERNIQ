"""
Step 6: Test representative implementations for C++ and TypeScript across pilot problems.
"""
import json
import urllib.request
from backend.importer.importer import ProblemCatalogImporter

CPP_TESTS = {
    "VRQ-000004": """
#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        for (char c : s) {
            if (c == '(') st.push(')');
            else if (c == '{') st.push('}');
            else if (c == '[') st.push(']');
            else if (st.empty() || st.top() != c) return false;
            else st.pop();
        }
        return st.empty();
    }
};
""",
    "VRQ-000005": """
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        vector<int> map(128, -1);
        int left = 0, max_len = 0;
        for (int right = 0; right < s.size(); ++right) {
            if (map[s[right]] >= left) left = map[s[right]] + 1;
            map[s[right]] = right;
            max_len = max(max_len, right - left + 1);
        }
        return max_len;
    }
};
""",
    "VRQ-000011": """
#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int cur = nums[0], max_sum = nums[0];
        for (size_t i = 1; i < nums.size(); ++i) {
            cur = max(nums[i], cur + nums[i]);
            max_sum = max(max_sum, cur);
        }
        return max_sum;
    }
};
"""
}

TS_TESTS = {
    "VRQ-000004": """
function isValid(s: string): boolean {
    const stack: string[] = [];
    for (const c of s) {
        if (c === '(') stack.push(')');
        else if (c === '{') stack.push('}');
        else if (c === '[') stack.push(']');
        else if (stack.length === 0 || stack.pop() !== c) return false;
    }
    return stack.length === 0;
}
""",
    "VRQ-000005": """
function lengthOfLongestSubstring(s: string): number {
    const map = new Map<string, number>();
    let left = 0, maxLen = 0;
    for (let right = 0; right < s.length; right++) {
        const c = s[right];
        if (map.has(c) && map.get(c)! >= left) {
            left = map.get(c)! + 1;
        }
        map.set(c, right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
""",
    "VRQ-000011": """
function maxSubArray(nums: number[]): number {
    let cur = nums[0], max = nums[0];
    for (let i = 1; i < nums.length; i++) {
        cur = Math.max(nums[i], cur + nums[i]);
        max = Math.max(max, cur);
    }
    return max;
}
"""
}

def run_tests():
    imp = ProblemCatalogImporter()
    print("--- C++ VERIFICATIONS ---")
    for vid, code in CPP_TESTS.items():
        prob = imp.run_query(f"SELECT id, verniq_id, title FROM public.problems WHERE verniq_id = '{vid}';")[0]
        test = imp.run_query(f"SELECT id, input, expected_output FROM public.test_cases WHERE problem_id = '{prob['id']}' AND is_sample = true LIMIT 1;")[0]
        payload = {
            "execution_id": f"test-cpp-{vid}",
            "language": "cpp",
            "source_code": code,
            "is_custom_run": True,
            "test_cases": [test],
            "mode": "RUN"
        }
        req = urllib.request.Request("http://127.0.0.1:8080/execute", data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=15.0) as resp:
            res = json.loads(resp.read().decode("utf-8"))
        print(f"[{vid}] C++ Verdict: {res.get('verdict')} | Passed: {res.get('test_cases_passed')}/{res.get('total_test_cases')}")

    print("\n--- TYPESCRIPT VERIFICATIONS ---")
    for vid, code in TS_TESTS.items():
        prob = imp.run_query(f"SELECT id, verniq_id, title FROM public.problems WHERE verniq_id = '{vid}';")[0]
        test = imp.run_query(f"SELECT id, input, expected_output FROM public.test_cases WHERE problem_id = '{prob['id']}' AND is_sample = true LIMIT 1;")[0]
        payload = {
            "execution_id": f"test-ts-{vid}",
            "language": "typescript",
            "source_code": code,
            "is_custom_run": True,
            "test_cases": [test],
            "mode": "RUN"
        }
        req = urllib.request.Request("http://127.0.0.1:8080/execute", data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=15.0) as resp:
            res = json.loads(resp.read().decode("utf-8"))
        print(f"[{vid}] TypeScript Verdict: {res.get('verdict')} | Passed: {res.get('test_cases_passed')}/{res.get('total_test_cases')}")

if __name__ == "__main__":
    run_tests()
