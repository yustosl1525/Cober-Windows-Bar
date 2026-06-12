#!/usr/bin/env python3
"""Strip the local `function test(name, run) { ... }` helper from each
legacy .test.ts file. After this strip, the global test() registered
in src/test/legacy-test-shim.ts takes over (it delegates to vitest's it()).

The legacy test() helper is exactly three lines:
    function test(name: string, run: () => void) {
      run();
      console.log(`ok ${name}`);
    }

We match this shape and remove it. Any other function named `test*`
(e.g. testLoadsFixtureEventsFromTauriInvoke) is left alone — those are
test cases, not helpers.

The script is idempotent: running it twice is a no-op.
"""

import re
import sys
import glob


# Match the exact 3-line legacy test() helper. Use re.MULTILINE so
# ^/$ work per-line. The body is two statements; we tolerate any
# whitespace between them.
HELPER_RE = re.compile(
    r"^function\s+test\s*\(\s*name\s*:\s*string\s*,\s*run\s*:\s*\(\)\s*=>\s*void\s*\)\s*\{\s*"
    r"run\(\)\s*;\s*"
    r"console\.log\(`ok\s+\$\{name\}`\)\s*;"
    r"\s*\}\s*\n",
    re.MULTILINE,
)


def convert_file(path: str) -> bool:
    with open(path, "r", encoding="utf-8") as fh:
        text = fh.read()
    orig = text
    text = HELPER_RE.sub("", text)
    if text != orig:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(text)
        return True
    return False


def main() -> int:
    files = sorted(glob.glob("src/**/*.test.ts", recursive=True))
    converted = 0
    for f in files:
        if convert_file(f):
            converted += 1
            print(f"  {f}")
    print(f"\n{converted} / {len(files)} files updated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
