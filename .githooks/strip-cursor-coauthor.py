"""Filter git commit messages: drop Cursor attribution trailers (stdin → stdout)."""
from __future__ import annotations

import re
import sys

text = sys.stdin.read()
text = re.sub(
    r"(?im)^[ \t]*(Co-authored-by|Made-with|Generated-by)[ \t]*:[ \t]*Cursor\b.*\r?\n?",
    "",
    text,
)
text = re.sub(r"\n{3,}", "\n\n", text)
sys.stdout.write(text)
