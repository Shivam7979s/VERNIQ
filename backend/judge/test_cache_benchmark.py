import urllib.request
import json
import time

def run_test(lang, code, tc, mode='RUN'):
    payload = json.dumps({
        'language': lang,
        'source_code': code,
        'is_custom_run': mode == 'RUN',
        'test_cases': tc,
        'mode': mode
    }).encode()
    req = urllib.request.Request('http://127.0.0.1:8080/execute', data=payload, headers={'Content-Type': 'application/json'})
    t0 = time.perf_counter()
    with urllib.request.urlopen(req) as r:
        res = json.loads(r.read().decode())
    dur = (time.perf_counter() - t0) * 1000
    tel = res.get('telemetry') or {}
    print(f"[{lang.upper()} {mode}] Total: {dur:.1f}ms | Program: {res.get('runtime_ms')}ms | Compile: {tel.get('compile_ms')}ms | Cached: {tel.get('cached_compilation')} | Verdict: {res.get('verdict')}")
    return res

java_code = '''import java.util.HashMap;
import java.util.Map;
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) return new int[] { map.get(complement), i };
            map.put(nums[i], i);
        }
        return new int[0];
    }
}'''

cpp_code = '''#include <vector>
#include <unordered_map>
class Solution {
public:
    std::vector<int> twoSum(std::vector<int>& nums, int target) {
        std::unordered_map<int, int> map;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int complement = target - nums[i];
            if (map.find(complement) != map.end()) return {map[complement], i};
            map[nums[i]] = i;
        }
        return {};
    }
};'''

python_code = '''class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        lookup = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in lookup: return [lookup[diff], i]
            lookup[num] = i
        return []'''

sample_tc = [{'input': 'nums = [2,7,11,15], target = 9', 'expected_output': '[0,1]', 'is_sample': True}]

print("=== TESTING JAVA ===")
run_test('java', java_code, sample_tc, 'RUN')
run_test('java', java_code, sample_tc, 'RUN')

print("\n=== TESTING C++ ===")
run_test('cpp', cpp_code, sample_tc, 'RUN')
run_test('cpp', cpp_code, sample_tc, 'RUN')

print("\n=== TESTING PYTHON ===")
run_test('python', python_code, sample_tc, 'RUN')
run_test('python', python_code, sample_tc, 'RUN')
