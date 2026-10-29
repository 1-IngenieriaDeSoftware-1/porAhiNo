#!/bin/sh
# Usado por git filter-branch --msg-filter
exec "/c/Users/danie/Desktop/porAhiNo-src/backend/.venv/Scripts/python.exe" \
  "/c/Users/danie/Desktop/porAhiNo-src/.githooks/strip-cursor-coauthor.py"
