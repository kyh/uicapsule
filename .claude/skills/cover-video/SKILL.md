---
name: cover-video
description: Record a cover video for a content component, verify it looks right, upload it to Supabase storage, and wire it into meta.json. Use when asked to generate/update a component's cover, preview video, or gallery thumbnail.
---

# Cover Video

Produce the looping cover video shown on the gallery card for a `content/<slug>` component.
Pipeline: stage → record → convert → frame-check → upload → update meta.json → confirm live.

Target spec (matches existing covers + the `aspect-video` gallery card):

- 16:9, 1600×900
- 8–15 seconds, h264 mp4, yuv420p, no audio, `-movflags +faststart`
- Shows the component's most flattering interaction loop, ending near the starting state so
  the loop reads cleanly

Use the session scratchpad for all intermediate files (webm, mp4, frames, batch json).

## 1. Preflight

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/preview-frame/<slug>
```

- Not 200? Start `pnpm dev:web` in the background and wait.
- Record `/preview-frame/<slug>` (bare preview) — never `/ui/<slug>` (site chrome).
- Read the component source and script a choreography: 3–5 beats covering the component's
  states, ~10–13s total, ending near idle.

## 2. Stage the recording tab (two agent-browser gotchas live here)

**Gotcha A — `record start` opens a NEW tab** at the default viewport (1280×634). Anything you
set on the current tab (viewport, overlay removal) does NOT apply, and coordinates measured
there will miss. **Gotcha B — capture size locks when recording begins**, so the tab must
already be 1600×900 when the real recording starts. The recipe that handles both:

```bash
agent-browser close                                          # fresh session, window foregrounded
agent-browser record start <scratch>/setup.webm http://localhost:3000/preview-frame/<slug>
agent-browser set viewport 1600 900                          # applies to the recording tab
sleep 3
agent-browser eval "document.querySelector('nextjs-portal')?.remove(); document.querySelectorAll('[data-nextjs-toast],[data-next-badge-root]').forEach(e => e.remove()); document.visibilityState + ' ' + window.innerWidth + 'x' + window.innerHeight"
# MUST print "visible 1600x900". "hidden" → the window is occluded; rAF freezes and the video
# will record frozen animation even though screenshots look fine. Close and reopen.
agent-browser screenshot <scratch>/stage.png                 # Read it: layout ok, no dev badge,
                                                             # measure your click coordinates HERE
```

`setup.webm` is a throwaway. When the stage looks right:

```bash
agent-browser record restart <scratch>/<slug>.webm           # re-arms capture on the SAME tab,
                                                             # now at 1600×900 — discards setup footage
```

## 3. Drive the choreography with ONE batch call

Individual CLI calls cost ~0.4s each — a 20-action take balloons from 12s to 27s. Write the
whole choreography as a batch file instead (timing lives in `wait` entries):

```python
# build <scratch>/batch.json with python: a JSON array of string arrays
[["wait","1500"],
 ["mouse","move","800","520"],["mouse","down"],
 ["mouse","move","740","545"],["wait","90"], ...smooth drag steps...
 ["mouse","up"],["wait","800"],
 ["mouse","move","828","584"],["mouse","down"],["mouse","up"],["wait","120"],  # a click
 ["keyboard","type","hello"], ...]
```

```bash
agent-browser eval "document.visibilityState"    # final occlusion check
agent-browser batch < <scratch>/batch.json
agent-browser record stop
```

- Coordinate clicks are move/down/up triads — `click` only takes selectors/@refs.
- Drags need several intermediate `mouse move` steps with 80–120ms waits or they read as
  teleports.
- The OS cursor is not captured — favor components whose feedback is visible (touch
  indicators, hover states, motion). Verify state-dependent coordinates (buttons that only
  exist mid-flow) from an earlier interactive session on `/ui/<slug>`.

## 4. Convert

```bash
ffmpeg -y -i <slug>.webm -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -an -movflags +faststart <slug>.mp4
```

(Recording is already 1600×900 — no scale filter needed. If size is off, you staged wrong; go
back to step 2 rather than upscaling.)

## 5. Frame-check (do not skip, do not upload on failure)

```bash
DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 <slug>.mp4)
ffprobe -v quiet -show_entries stream=width,height,codec_name -of csv=p=0 <slug>.mp4
for p in 8 30 55 80 92; do
  ffmpeg -y -v error -ss $(python3 -c "print($DUR*$p/100)") -i <slug>.mp4 -frames:v 1 frame_$p.png
done
```

Read every frame as an image and check ALL of:

1. Component fully rendered — no blank/black frames, no half-loaded UI.
2. Frames DIFFER and match the planned beats. All-identical frames = interactions missed
   (wrong tab/coords) or rAF frozen (occlusion). Fix the cause, rerecord.
3. No dev overlays (Next.js badge bottom-left), no error toasts.
4. Duration 8–15s, 1600×900, h264.

## 6. Upload

Supabase CLI is already linked (`supabase/.temp/project-ref`, currently `zmdrwswxugswzmcokvff`):

```bash
supabase storage cp <slug>.mp4 ss:///uicapsule/<slug>/<slug>.mp4 --experimental
curl -s -o /dev/null -w "%{http_code} %{content_type}" \
  "https://<project-ref>.supabase.co/storage/v1/object/public/uicapsule/<slug>/<slug>.mp4"
# expect: 200 video/mp4
```

Storage sits behind a CDN (~1h cache) — replacing an existing cover can serve stale for a
while; mention that when overwriting.

## 7. Wire up + confirm

Add to `content/<slug>/meta.json` (keys before `tags`):

```json
"coverUrl": "https://<project-ref>.supabase.co/storage/v1/object/public/uicapsule/<slug>/<slug>.mp4",
"coverType": "video",
```

Open `http://localhost:3000/`, screenshot, and confirm the component's card is playing the
video (a blank card = bad URL or content-type). Delete scratch webm/mp4/frames/batch files.
