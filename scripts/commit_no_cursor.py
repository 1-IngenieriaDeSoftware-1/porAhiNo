"""git add/commit without leaving Cursor co-author trailers on HEAD."""
from __future__ import annotations

import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STRIP = re.compile(
    r"(?im)^[ \t]*(Co-authored-by|Made-with|Generated-by)[ \t]*:[ \t]*Cursor\b.*\r?\n?"
)


def run(args: list[str]) -> str:
    p = subprocess.run(args, cwd=ROOT, capture_output=True, text=True)
    if p.returncode != 0:
        sys.stderr.write(p.stdout + p.stderr)
        raise SystemExit(p.returncode)
    return p.stdout


def clean(msg: str) -> str:
    msg = STRIP.sub("", msg)
    return re.sub(r"\n{3,}", "\n\n", msg).strip() + "\n"


def main() -> None:
    if len(sys.argv) < 2:
        print("usage: commit_no_cursor.py <message> [-- paths...]", file=sys.stderr)
        raise SystemExit(2)
    message = sys.argv[1]
    paths = sys.argv[2:]
    if paths:
        run(["git", "add", "--", *paths])
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, suffix=".msg") as f:
        f.write(clean(message))
        msg_path = f.name
    try:
        run(["git", "commit", "-F", msg_path])
    finally:
        Path(msg_path).unlink(missing_ok=True)

    head = run(["git", "log", "-1", "--format=%B"])
    cleaned = clean(head)
    if cleaned.strip() != head.strip():
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, suffix=".msg") as f:
            f.write(cleaned)
            msg_path = f.name
        try:
            # Solo amienda el commit que acabamos de crear si el trailer se coló
            run(["git", "commit", "--amend", "-F", msg_path])
        finally:
            Path(msg_path).unlink(missing_ok=True)
    print(run(["git", "log", "-1", "--format=%B"]))


if __name__ == "__main__":
    main()
