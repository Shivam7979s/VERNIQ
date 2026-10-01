"""Output comparator for online judge verdicts."""

def normalize_output(text: str) -> str:
    """Normalize output by converting line endings and trimming trailing whitespace."""
    if text is None:
        return ""
    # Normalize Windows CRLF to standard LF
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    # Trim trailing whitespace from each line
    trimmed_lines = [line.rstrip() for line in lines]
    # Remove trailing empty lines
    while trimmed_lines and trimmed_lines[-1] == "":
        trimmed_lines.pop()
    return "\n".join(trimmed_lines)

import json

def compare_outputs(actual: str, expected: str) -> bool:
    """Compare normalized actual output against expected output."""
    norm_actual = normalize_output(actual)
    norm_expected = normalize_output(expected)
    if norm_actual == norm_expected:
        return True

    # Check without any spaces
    if norm_actual.replace(" ", "") == norm_expected.replace(" ", ""):
        return True

    # Boolean case-insensitivity: "true" vs "True", "false" vs "False"
    if norm_actual.lower() == norm_expected.lower() and norm_expected.lower() in ("true", "false"):
        return True

    # Floating point comparison with tolerance (e.g. 2.0 vs 2.00000)
    try:
        f_act = float(norm_actual)
        f_exp = float(norm_expected)
        if abs(f_act - f_exp) < 1e-5:
            return True
    except Exception:
        pass

    # Try parsing as JSON to compare semantic equality (e.g. [0, 1] vs [0,1])
    try:
        if json.loads(norm_actual) == json.loads(norm_expected):
            return True
    except Exception:
        pass

    # Compare strings with or without wrapping quotes (e.g. "fl" vs fl)
    if norm_actual.strip('"') == norm_expected.strip('"'):
        return True

    return False
