#!/usr/bin/env python3
"""Convert the 14 legacy .test.ts files to vitest.

Three patterns:

  Pattern A (2 files: mockHubData, ResidentStatusTemplate)
    Pure for-loop + console.log pattern. No test() helper at all.
    We wrap the whole module body in a single describe() with a
    no-op it() so vitest counts the file as having at least one
    test. The actual asserts run at module-scope inside the
    describe body, which is exactly what the original file did.

  Pattern B (4 files: desktopProductRuntime, statusWindowRuntime,
    systemPerformanceRuntime, tauriRuntime)
    A `const tests = []` array, a `function test(name, run) { ... }`
    helper, and a final `for (const { name, run } of tests) { ... }`
    runner. We strip the helper + runner, drop the assert import, and
    rewrite each `test(name, fn)` to `it(name, fn)` so vitest's
    tracking picks them up.

  Pattern C (1 file: desktopStatusInputRuntime)
    A set of `async function testFoo() { ... }` declarations followed
    by a `await testFoo();` sequence at the bottom. We KEEP the
    async function declarations, and rewrite each
    `await testFoo();` to `it("testFoo", async () => { await testFoo(); });`
    so vitest's tracking picks them up.

The script is idempotent: each replacement is gated on a marker that
gets removed during the conversion.
"""

import os
import re
import sys
import glob


# Pattern A: no test() helper, just a for-loop or top-level asserts.
PATTERN_A_FILES = {
    "src/data/mockHubData.test.ts",
    "src/features/desktop/templates/ResidentStatusTemplate.test.ts",
}


def convert_pattern_a(path):
    with open(path, "r", encoding="utf-8") as fh:
        text = fh.read()
    orig = text

    if 'describe("' in text:
        return False
    if re.search(r"^function\s+test\s*\(", text, re.MULTILINE):
        return False
    if re.search(r"^async\s+function\s+test[A-Z]\w*\s*\(", text, re.MULTILINE):
        return False

    base = os.path.splitext(os.path.basename(path))[0]
    lines = text.split("\n")
    in_import = False
    import_depth = 0
    first_body_idx = None
    for i, line in enumerate(lines):
        stripped = line.strip()
        if in_import:
            import_depth += stripped.count("{") - stripped.count("}")
            if import_depth <= 0:
                in_import = False
                import_depth = 0
            continue
        if stripped.startswith("import ") or stripped.startswith("import\t"):
            in_import = True
            import_depth = stripped.count("{") - stripped.count("}")
            if import_depth <= 0:
                in_import = True
                import_depth = 0
            continue
        if stripped == "":
            continue
        first_body_idx = i
        break
    if first_body_idx is None:
        first_body_idx = len(lines)

    vitest_import = 'import { describe, it } from "vitest";'
    new_lines = (
        lines[:first_body_idx]
        + [vitest_import, 'describe("' + base + '", () => {']
        + lines[first_body_idx:]
        + ["});", ""]
    )
    text = "\n".join(new_lines)
    # Add a no-op it() inside the describe so vitest counts the file.
    text = text.replace(
        'describe("' + base + '", () => {\n',
        'describe("' + base + '", () => {\n  it("runs the file\'s top-level asserts", () => {});\n',
        1,
    )

    if text != orig:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(text)
        return True
    return False


# Pattern B: tests.push queue.
HELPER_B_ARRAY_RE = re.compile(
    r"^const\s+tests\s*:\s*Array<\{[^}]+\}>\s*=\s*\[\]\s*;\s*\n",
    re.MULTILINE,
)
HELPER_B_FN_RE = re.compile(
    r"^function\s+test\s*\(\s*name\s*:\s*string\s*,\s*run\s*:\s*\(\)\s*=>\s*void(?:\s*\|\s*Promise<void>)?\s*\)\s*\{\s*"
    r"tests\.push\(\{[^}]+\}\)\s*;\s*"
    r"\s*\}\s*\n",
    re.MULTILINE,
)
RUNNER_B_RE = re.compile(
    r"^for\s+\(const\s+\{[^}]+\}\s+of\s+tests\)\s*\{[\s\S]*?^\}\s*\n",
    re.MULTILINE,
)


def convert_pattern_b(path):
    with open(path, "r", encoding="utf-8") as fh:
        text = fh.read()
    orig = text

    if 'describe("' in text:
        return False
    if not (HELPER_B_ARRAY_RE.search(text) and HELPER_B_FN_RE.search(text)):
        return False

    text = HELPER_B_ARRAY_RE.sub("", text)
    text = HELPER_B_FN_RE.sub("", text)
    text = RUNNER_B_RE.sub("", text)

    # Drop the now-unused node:assert import.
    text = re.sub(
        r"^import\s+\{[^}]*\}\s+from\s+[\"']node:assert[\"'];?\n",
        "",
        text,
        flags=re.MULTILINE,
    )
    text = re.sub(
        r"^import\s+assert(?:\s*,\s*\{[^}]+\})?\s+from\s+[\"']node:assert(?:/strict)?[\"'];?\n",
        "",
        text,
        flags=re.MULTILINE,
    )

    # Rewrite `test(` → `it(`, but only when `test` is NOT a member
    # access (e.g. `/x/.test(label)` should stay as-is — it's a regex
    # literal's .test() method, not the legacy test() helper).
    text = re.sub(r"(?<![.\w])test\(", "it(", text)

    base = os.path.splitext(os.path.basename(path))[0]
    lines = text.split("\n")
    in_import = False
    import_depth = 0
    first_body_idx = None
    for i, line in enumerate(lines):
        stripped = line.strip()
        if in_import:
            import_depth += stripped.count("{") - stripped.count("}")
            if import_depth <= 0:
                in_import = False
                import_depth = 0
            continue
        if stripped.startswith("import ") or stripped.startswith("import\t"):
            in_import = True
            import_depth = stripped.count("{") - stripped.count("}")
            if import_depth <= 0:
                in_import = True
                import_depth = 0
            continue
        if stripped == "":
            continue
        first_body_idx = i
        break
    if first_body_idx is None:
        first_body_idx = len(lines)

    vitest_import = 'import { describe, it } from "vitest";'
    new_lines = (
        lines[:first_body_idx]
        + [vitest_import, 'describe("' + base + '", () => {']
        + lines[first_body_idx:]
        + ["});", ""]
    )
    text = "\n".join(new_lines)

    if text != orig:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(text)
        return True
    return False


# Pattern C: async function test*() + top-level await.
PATTERN_C_ASYNC_FN_RE = re.compile(
    r"^async\s+function\s+(test[A-Z]\w*)\s*\(",
    re.MULTILINE,
)


def convert_pattern_c(path):
    with open(path, "r", encoding="utf-8") as fh:
        text = fh.read()
    orig = text

    if 'describe("' in text:
        return False
    if not PATTERN_C_ASYNC_FN_RE.search(text):
        return False

    # Drop the node:assert import.
    text = re.sub(
        r"^import\s+assert\s+from\s+[\"']node:assert/strict[\"'];?\n",
        "",
        text,
        flags=re.MULTILINE,
    )

    # KEEP the async function declarations. vitest's it() body can
    # return a promise, so the async test function will be invoked
    # from inside an `async () => { await testFoo(); }` body.

    # Replace `await testFoo();` with `it("testFoo", async () => { await testFoo(); });`
    def replace_await(match):
        name = match.group(1)
        return 'it("' + name + '", async () => { await ' + name + '(); });'

    text = re.sub(
        r"^await\s+(test[A-Z]\w*)\s*\(\s*\)\s*;?\s*$",
        replace_await,
        text,
        flags=re.MULTILINE,
    )

    base = os.path.splitext(os.path.basename(path))[0]
    lines = text.split("\n")
    in_import = False
    import_depth = 0
    first_body_idx = None
    for i, line in enumerate(lines):
        stripped = line.strip()
        if in_import:
            import_depth += stripped.count("{") - stripped.count("}")
            if import_depth <= 0:
                in_import = False
                import_depth = 0
            continue
        if stripped.startswith("import ") or stripped.startswith("import\t"):
            in_import = True
            import_depth = stripped.count("{") - stripped.count("}")
            if import_depth <= 0:
                in_import = True
                import_depth = 0
            continue
        if stripped == "":
            continue
        first_body_idx = i
        break
    if first_body_idx is None:
        first_body_idx = len(lines)

    vitest_import = 'import { describe, it } from "vitest";'
    new_lines = (
        lines[:first_body_idx]
        + [vitest_import, 'describe("' + base + '", () => {']
        + lines[first_body_idx:]
        + ["});", ""]
    )
    text = "\n".join(new_lines)

    if text != orig:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(text)
        return True
    return False


def main():
    files = sorted(glob.glob("src/**/*.test.ts", recursive=True))
    converted = 0
    for f in files:
        for handler in (convert_pattern_a, convert_pattern_b, convert_pattern_c):
            if handler(f):
                converted += 1
                print("  " + f)
                break
    print("\n" + str(converted) + " / " + str(len(files)) + " files converted")
    return 0


if __name__ == "__main__":
    sys.exit(main())
