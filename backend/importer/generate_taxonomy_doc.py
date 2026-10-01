"""
Generate docs/content/verniq-topic-taxonomy.md
"""

from pathlib import Path
from backend.importer.taxonomy import DOMAINS, TOPIC_TAXONOMY_MAP

def generate():
    lines = [
        "# VERNIQ Topic Taxonomy & Normalization Standards",
        "",
        "> **Version:** 1.0.0  ",
        "> **Status:** Production Content Architecture Standard  ",
        "> **Scope:** Canonical 189-Topic Mapping & Hierarchical Domain Model",
        "",
        "---",
        "",
        "## 1. Top-Level Engineering Domains",
        "",
        "The Verniq problem catalog organizes all challenges under 8 distinct engineering domains:",
        "",
        "| Domain | Slug | Order | Description |",
        "|:---|:---:|:---:|:---|",
    ]

    for dom_k, dom_v in DOMAINS.items():
        name = dom_v["name"]
        slug = dom_v["slug"]
        idx = dom_v["order_index"]
        desc = dom_v["description"]
        lines.append(f"| **{name}** | `{slug}` | {idx} | {desc} |")

    lines.extend([
        "",
        "---",
        "",
        "## 2. Comprehensive 189-Topic Normalization Matrix",
        "",
        "| # | Source Topic (Raw) | Verniq Topic (Normalized) | Domain | Parent Topic | Default Role | Normalization Rule | Confidence |",
        "|:---:|:---|:---|:---:|:---|:---:|:---|:---:|",
    ])

    idx = 1
    for src, meta in sorted(TOPIC_TAXONOMY_MAP.items(), key=lambda x: (x[1][2], x[1][3] or '', x[0])):
        v_name, slug, domain, parent, role, rule, conf = meta
        parent_str = f"`{parent}`" if parent else "*(Root)*"
        lines.append(f"| {idx} | `{src}` | **{v_name}** | `{domain}` | {parent_str} | `{role.upper()}` | {rule} | **{conf}** |")
        idx += 1

    lines.extend([
        "",
        "---",
        "",
        "## 3. Taxonomy Hierarchy Example (DSA Graphs)",
        "",
        "```",
        "DSA",
        "└── Graph Theory",
        "    ├── Breadth-First Search",
        "    │   ├── 0-1 BFS",
        "    │   └── Bidirectional Search",
        "    ├── Depth-First Search",
        "    ├── Shortest Path",
        "    │   ├── Dijkstra's Algorithm",
        "    │   ├── Bellman–Ford Algorithm",
        "    │   ├── Floyd–Warshall Algorithm",
        "    │   └── K Shortest Path",
        "    ├── Minimum Spanning Tree",
        "    │   ├── Prim's Algorithm",
        "    │   ├── Kruskal's Algorithm",
        "    │   └── Borůvka's Algorithm",
        "    ├── Flow Network",
        "    │   ├── Maximum Flow",
        "    │   ├── Minimum Cut",
        "    │   ├── Dinic's Algorithm",
        "    │   └── Minimum-Cost Flow",
        "    └── Strongly Connected Component",
        "        ├── Tarjan's SCC Algorithm",
        "        └── Kosaraju's Algorithm",
        "```",
        "",
        "---",
        "",
        "## 4. Preservation Rule",
        "",
        "The raw source topic is **always preserved verbatim** in `public.topics.source_topic` and `problem_import_staging.raw_topics`. Normalization applies to catalog navigation and relational indexing without altering historical provenance.",
    ])

    out_path = Path("docs/content/verniq-topic-taxonomy.md")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Generated {out_path} ({out_path.stat().st_size:,} bytes)")

if __name__ == "__main__":
    generate()
