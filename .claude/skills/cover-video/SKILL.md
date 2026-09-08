---
name: cover-video
description: Record a cover video for a content component, verify it looks right, upload it to Supabase storage, and wire it into meta.json. Use when asked to generate/update a component's cover, preview video, or gallery thumbnail.
---

# Cover Video

Produce the looping cover video shown on the gallery card for a `content/<slug>` component.
Pipeline: stage → record → convert → frame-check → upload → update meta.json → confirm live.

Target spec (matches existing covers + the `aspect-video` gallery card):

- 16:9, 1600×900, 60fps
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

## 2. Stage the recording tab

Requires agent-browser ≥ 0.37 (`agent-browser --version`; upgrade with
`npm i -g agent-browser@latest`) and ffmpeg on PATH (`agent-browser doctor`). Recording
captures the tab you already have open — no new tab, no navigation — so stage everything
first, then arm capture. **Capture size locks when recording begins**, so the viewport must
already be 1600×900 before `record start`.

```bash
agent-browser close                                          # fresh session, window foregrounded
agent-browser open http://localhost:3000/preview-frame/<slug>
agent-browser set viewport 1600 900
sleep 3
agent-browser eval "document.querySelector('nextjs-portal')?.remove(); document.querySelectorAll('[data-nextjs-toast],[data-next-badge-root]').forEach(e => e.remove()); document.visibilityState + ' ' + window.innerWidth + 'x' + window.innerHeight"
# MUST print "visible 1600x900". "hidden" → the window is occluded; rAF freezes and the video
# will record frozen animation even though screenshots look fine. Close and reopen.
agent-browser screenshot <scratch>/stage.png                 # Read it: layout ok, no dev badge,
                                                             # measure your click coordinates HERE
```

Coordinates measured on `stage.png` are the coordinates the recording sees — same tab, same
viewport.

## 3. Record: `--fps 60`, ONE batch call

```bash
agent-browser eval "document.visibilityState"                # final occlusion check
agent-browser record start <scratch>/<slug>.webm --fps 60
agent-browser batch < <scratch>/batch.json
agent-browser record stop
sleep 2
ffprobe -v error -show_entries stream=avg_frame_rate,width,height:format=duration -of default=nw=1 <scratch>/<slug>.webm
# expect 60/1, 1600, 900, duration ≥ 8
```

- **Always pass `--fps 60`.** The default is 30, which visibly stutters springs, drags and
  particle motion on the gallery card. 60 is the ceiling.
- Record `.webm`, not `.mp4`: agent-browser's native mp4 comes out full-range `yuvj420p`
  with `moov` after `mdat` (no faststart), which breaks the cover spec. Convert in step 4.
- A 0-byte or sub-second webm is a known intermittent failure — re-record.

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

- Coordinate clicks are move/down/up triads — `click` only takes selectors/@refs.
- Drags need several intermediate `mouse move` steps with 80–120ms waits or they read as
  teleports. At 60fps every step is visible, so use more, smaller steps rather than fewer.
- The OS cursor is not captured — favor components whose feedback is visible (touch
  indicators, hover states, motion). Verify state-dependent coordinates (buttons that only
  exist mid-flow) from an earlier interactive session on `/ui/<slug>`.

## 4. Convert

```bash
ffmpeg -y -i <slug>.webm -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -an -movflags +faststart <slug>.mp4
```

(Recording is already 1600×900 at 60fps — no scale or fps filter needed; the mp4 keeps 60.
If size is off, you staged wrong; go back to step 2 rather than upscaling.)

## 5. Frame-check (do not skip, do not upload on failure)

```bash
DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 <slug>.mp4)
ffprobe -v quiet -show_entries stream=width,height,codec_name,avg_frame_rate -of csv=p=0 <slug>.mp4
for p in 8 30 55 80 92; do
  ffmpeg -y -v error -ss $(python3 -c "print($DUR*$p/100)") -i <slug>.mp4 -frames:v 1 frame_$p.png
done
```

Read every frame as an image and check ALL of:

1. Component fully rendered — no blank/black frames, no half-loaded UI.
2. Frames DIFFER and match the planned beats. All-identical frames = interactions missed
   (wrong tab/coords) or rAF frozen (occlusion). Fix the cause, rerecord.
3. No dev overlays (Next.js badge bottom-left), no error toasts.
4. Duration 8–15s, 1600×900, h264, 60fps.

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
