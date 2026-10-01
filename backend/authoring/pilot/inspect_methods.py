"""
Inspect all 20 pilot problems: verniq_id, title, method_name, and starter templates across all 5 languages.
"""

from backend.authoring.pilot.specs import PILOT_SPECS

def inspect():
    for vid, spec in PILOT_SPECS.items():
        print(f"\n{'='*70}")
        print(f"{vid}: {spec['title']} (Method: {spec.get('method_name')})")
        print(f"{'='*70}")
        templates = spec.get("starter_templates", {})
        for lang in ("java", "cpp", "python", "typescript", "go"):
            code = templates.get(lang, "")
            first_lines = "\n".join(code.strip().split("\n")[:4])
            print(f"  [{lang}]:\n{first_lines}\n")

if __name__ == "__main__":
    inspect()
