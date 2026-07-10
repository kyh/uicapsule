#!/bin/bash
# publish-recording.sh <slug> <webm-path>
# webm -> 800px/12fps GIF -> kyh/pr-preview-assets orphan branch -> print raw embed URL
set -euo pipefail

SLUG="${1:?usage: publish-recording.sh <slug> <webm-path>}"
WEBM="${2:?usage: publish-recording.sh <slug> <webm-path>}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
ASSETS_BRANCH="kyh/pr-preview-assets"
GIF="$(dirname "$WEBM")/$SLUG.gif"
WT="$(mktemp -d)/assets"

[ -s "$WEBM" ] || { echo "ERROR: $WEBM is missing or empty" >&2; exit 1; }
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$WEBM")
python3 -c "exit(0 if float('$DUR') >= 8 else 1)" || {
  echo "ERROR: recording is only ${DUR}s (<8s) — re-record" >&2; exit 1; }

ffmpeg -y -v error -i "$WEBM" \
  -vf "fps=12,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" \
  "$GIF"
echo "gif: $GIF ($(stat -f%z "$GIF") bytes, ${DUR}s source)"

cd "$REPO_ROOT"
git fetch -q origin "$ASSETS_BRANCH"
git worktree add -q --detach "$WT" "origin/$ASSETS_BRANCH"
trap 'git -C "$REPO_ROOT" worktree remove --force "$WT" 2>/dev/null || true' EXIT
cp "$GIF" "$WT/$SLUG.gif"
git -C "$WT" add "$SLUG.gif"
git -C "$WT" commit -qm "chore: preview recording for $SLUG

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git -C "$WT" -c http.postBuffer=157286400 push -q origin "HEAD:$ASSETS_BRANCH"

URL="https://raw.githubusercontent.com/kyh/uicapsule/$ASSETS_BRANCH/$SLUG.gif"
CODE_TYPE=$(curl -s -o /dev/null -w "%{http_code} %{content_type}" "$URL")
[ "$CODE_TYPE" = "200 image/gif" ] || { echo "ERROR: $URL -> $CODE_TYPE" >&2; exit 1; }
echo "embed: $URL"
