"""
End-to-End Playwright test for Valid Parentheses (VRQ-000004) live workspace execution.
Verifies real user path: UI -> Editor -> Run Code -> Judge -> Result Console.
"""

import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"

def verify_valid_parentheses_ui():
    print("=" * 70)
    print("PLAYWRIGHT END-TO-END VERIFICATION: VRQ-000004 (Valid Parentheses)")
    print("=" * 70)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # 1. Navigate to problem page
        print("\n[Step 1] Loading /problems/valid-parentheses...")
        page.goto(f"{BASE_URL}/problems/valid-parentheses", wait_until="networkidle", timeout=30000)
        time.sleep(2)

        # 2. Verify title and statement
        header_text = page.locator("h1, h2, [class*='title']").all_inner_texts()
        full_text = " ".join(header_text)
        print(f"  Page Header: {full_text[:60]}")
        assert "Valid Parentheses" in full_text or "valid-parentheses" in page.url, "Problem page should load Valid Parentheses"

        # 3. Select Java language
        print("\n[Step 2] Selecting Java language...")
        # Check current language button or dropdown
        lang_btn = page.locator("button:has-text('Java')").first
        if lang_btn.is_visible():
            lang_btn.click()
            time.sleep(0.5)

        # 4. Insert canonical Java solution
        canonical_code = """class Solution {
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
}"""

        print("\n[Step 3] Injecting canonical Java solution into editor...")
        page.evaluate(f"""() => {{
            const editor = window.monaco?.editor?.getEditors()[0];
            if (editor) {{
                editor.setValue({repr(canonical_code)});
            }}
        }}""")
        time.sleep(1)

        # 5. Click "Run Code"
        print("\n[Step 4] Clicking 'Run Code' button...")
        run_btn = page.locator("button:has-text('Run Code')").first
        run_btn.click()

        # 6. Wait for verdict in TestCaseConsole
        print("\n[Step 5] Waiting for Judge verdict...")
        page.wait_for_selector("text=Testcases Passed", timeout=25000)
        time.sleep(1)

        page_content = page.content()
        assert "Accepted" in page_content, "Expected 'Accepted' in page"
        assert "3/3" in page_content or "3 / 3" in page_content, "Expected '3/3' in page"
        print("\n[SUCCESS] UI verification passed! Real browser UI received ACCEPTED 3/3 Testcases Passed from judge worker!")

        browser.close()

if __name__ == "__main__":
    verify_valid_parentheses_ui()
