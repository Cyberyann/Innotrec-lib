#!/usr/bin/env bash
# Bump a library version, update its CHANGELOG, commit and tag.
#   ./scripts/release.sh backend  patch|minor|major
#   ./scripts/release.sh frontend patch|minor|major
# Then: git push && git push --tags   (the release workflow publishes the package)
set -euo pipefail

LIB="${1:-}"
PART="${2:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! "$LIB" =~ ^(backend|frontend)$ || ! "$PART" =~ ^(patch|minor|major)$ ]]; then
  echo "usage: $0 backend|frontend patch|minor|major" >&2
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "error: working tree is not clean" >&2
  exit 1
fi

if [[ "$LIB" == "backend" ]]; then
  VERSION_FILE="backend_lib/innotrec_auth/__init__.py"
  CHANGELOG="backend_lib/CHANGELOG.md"
  CURRENT="$(sed -nE 's/^__version__: str = "([^"]+)"/\1/p' "$VERSION_FILE")"
else
  VERSION_FILE="frontend_lib/package.json"
  CHANGELOG="frontend_lib/CHANGELOG.md"
  CURRENT="$(node -p "require('./$VERSION_FILE').version")"
fi

IFS=. read -r MAJOR MINOR PATCH <<<"$CURRENT"
case "$PART" in
  major) NEXT="$((MAJOR + 1)).0.0" ;;
  minor) NEXT="$MAJOR.$((MINOR + 1)).0" ;;
  patch) NEXT="$MAJOR.$MINOR.$((PATCH + 1))" ;;
esac

if [[ "$LIB" == "backend" ]]; then
  sed -i.bak -E "s/^__version__: str = \"[^\"]+\"/__version__: str = \"$NEXT\"/" "$VERSION_FILE" && rm "$VERSION_FILE.bak"
else
  # edit package.json + package-lock.json directly (no npm install side effect)
  NEXT="$NEXT" node -e '
    const fs = require("fs");
    const write = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + "\n");
    const pkg = JSON.parse(fs.readFileSync("frontend_lib/package.json", "utf8"));
    pkg.version = process.env.NEXT;
    write("frontend_lib/package.json", pkg);
    if (fs.existsSync("package-lock.json")) {
      const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
      if (lock.packages && lock.packages.frontend_lib) lock.packages.frontend_lib.version = process.env.NEXT;
      write("package-lock.json", lock);
    }'
fi

# "## [Unreleased]" -> "## [Unreleased]\n\n## [NEXT] - YYYY-MM-DD"
TODAY="$(date +%Y-%m-%d)"
sed -i.bak -E "s/^## \[Unreleased\]/## [Unreleased]\n\n## [$NEXT] - $TODAY/" "$CHANGELOG" && rm "$CHANGELOG.bak"

TAG="$LIB-v$NEXT"
git add "$VERSION_FILE" "$CHANGELOG"
[[ "$LIB" == "frontend" && -f package-lock.json ]] && git add package-lock.json
git commit -m "release($LIB): $NEXT"
git tag -a "$TAG" -m "$LIB library $NEXT"
echo "Released $LIB $CURRENT -> $NEXT (tag $TAG). Now run: git push && git push --tags"
