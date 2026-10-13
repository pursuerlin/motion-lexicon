# Code export and random draw cleanup · v306

The existing paper style stays in place. The code header now separates format selection, copy and instructions; the two choices include short descriptions. The menu supports keyboard arrows, Escape, outside click and focus dismissal. Code scrolls within a bounded area. The random draw no longer adds a flying ticket or animates the replacement stage and description.

Audited all 244 term definitions. Export now accepts only complete supported native timelines: 54 terms, with CSS and WAAPI implementations. Every output is a standalone HTML document with targets, styles, replay and relevant input handlers. These implement the underlying keyframes on neutral targets, not a copy of the website's illustrated visual assets. Unsupported runtime/compound implementations, external asset dependencies and source pseudocode are omitted from detail and Markdown export. Unsupported framework conversions are removed. The original term data remains available internally.

Preserved transform order, all frame offsets, per-segment easing, repeat count, direction, fill, delay and stagger. Two-column timelines export both sides. Duration, stagger and loop changes update copied output. Comparison duration controls now scale the source durations together rather than flattening both to the same value. Cached details refresh language and format when reopened.

Validation:
- `node tests/dialects.test.cjs`: all 244 definitions audited; 108 output scripts parsed; fallback rejection and key timeline semantics checked.
- All 108 generated documents loaded in browser iframes: no runtime errors; expected targets and animation counts; keyframe CSS accepted by the browser.
- UI: 8 consecutive random draws created no `.draw-slip`; copy returned the full HTML; stagger/loop updates reached output; unsupported page-curl omitted both code UI and Markdown code fence; cached detail followed language and format changes.
- Desktop 1280×720 and mobile 390×844 menus inspected, keyboard dismissal and mobile copy checked. Screenshots in `docs/screenshots/code-menu-306-desktop.png` and `code-menu-303-mobile.png` (same menu layout).
- `python3 check.sh` and `git diff --check` passed.

Local refinement self-reviewed; no independent visual review. Cross-browser and third-party framework builds were not tested; those framework export choices are no longer offered.
