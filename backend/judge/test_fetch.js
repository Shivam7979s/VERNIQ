async function run() {
  const code = `class Solution {
    public int maxArea(int[] height) {
        int l = 0, r = height.length - 1, ans = 0;
        while (l < r) {
            ans = Math.max(ans, (r - l) * Math.min(height[l], height[r]));
            if (height[l] < height[r]) l++; else r--;
        }
        return ans;
    }
}`;

  console.log("Sending fetch request...");
  const t0 = performance.now();
  const resp = await fetch('http://127.0.0.1:8080/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'java',
      source_code: code,
      is_custom_run: true,
      test_cases: [{ input: 'height = [1,8,6,2,5,4,8,3,7]', expected_output: '49', is_sample: true }]
    })
  });

  console.log('STATUS:', resp.status);
  console.log('CONTENT-LENGTH:', resp.headers.get('content-length'));
  console.log('CONNECTION:', resp.headers.get('connection'));

  const json = await resp.json();
  const dur = performance.now() - t0;

  console.log('FETCH DURATION:', dur.toFixed(1) + 'ms');
  console.log('VERDICT:', json.verdict);
  console.log('RUNTIME:', json.runtime_ms + 'ms');
  console.log('TELEMETRY:', JSON.stringify(json.telemetry));
}

run().catch(console.error);
