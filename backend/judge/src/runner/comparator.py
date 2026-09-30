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

def compare_outputs(actual: str, expected: str) -> bool:
    """Compare normalized actual output against expected output."""
    norm_actual = normalize_output(actual)
    norm_expected = normalize_output(expected)
    return norm_actual == norm_expected
