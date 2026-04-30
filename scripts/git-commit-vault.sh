#!/bin/bash
# Usage: git-commit-vault.sh <vault-path> <commit-message>
# Stages all changes in the vault and commits with the given message.
set -e
cd "$1"
git add -A
git commit -m "$2"
