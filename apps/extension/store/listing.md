# Chrome Web Store listing

Item ID: `gnmicdmjhhjjpfjmfliegaeondebgick`. Every field the dashboard asks for, tab by tab. Images are in this folder.

## Before you submit

- [ ] Vercel production: `EXTENSION_ORIGINS=chrome-extension://gnmicdmjhhjjpfjmfliegaeondebgick,chrome-extension://gndnanbepebpjjifhogmdlabbpddfgml`, then redeploy. Without it, every request from the store build fails with a 403.
- [ ] Push main, so /privacy goes live with the Limited Use line.
- [ ] Package tab: upload a new zip. The draft holds the zip built before the dialog copy changed. Run `pnpm -F @repo/extension zip`, then upload `apps/extension/.output/repoextension-0.1.0-chrome-store.zip`.
- [ ] Account tab: verify the contact email, fill in the trader declaration, and pay the one-time fee if you haven't.

## Store listing

| Field              | Value                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Description        | The block below                                                                                                            |
| Category           | Developer Tools                                                                                                            |
| Language           | English                                                                                                                    |
| Store icon         | `store-icon-128.png`                                                                                                       |
| Screenshots        | `screenshot-1-snap.png`, `screenshot-2-annotate.png`, `screenshot-3-describe.png`, `screenshot-4-filed.png`, in that order |
| Small promo tile   | `promo-small-440x280.png`                                                                                                  |
| Marquee promo tile | `promo-marquee-1400x560.png`                                                                                               |
| Global promo video | Leave empty                                                                                                                |
| Official URL       | None, unless uicapsule.com is verified in Search Console under the same Google account                                     |
| Homepage URL       | `https://www.uicapsule.com/install/extension`                                                                              |
| Support URL        | `https://github.com/kyh/uicapsule/issues`                                                                                  |
| Mature content     | Off                                                                                                                        |

Name and summary come from the manifest: "UICapsule" and "Select part of any page and request it as a UICapsule component."

Description:

```text
See an interaction you want built? UICapsule lets you select it on any web page and file it as a component request for the UICapsule gallery, with a screenshot and a link back to where you saw it.

HOW IT WORKS
• Click the toolbar icon (or press Alt+Shift+R, Option+Shift+R on Mac) to open the inspect bar at the bottom of the page.
• Hover to highlight an element and click to snap to it, or drag a box and move or resize it. Or press V (Alt+Shift+V from anywhere) to take the whole visible area.
• Switch to Annotate to draw arrows, sketch, or pin notes on top. The screenshot grows to include what you draw.
• Press Request (or Enter) when it's ready.
• Right-click any image or video and choose "Request from this image" or "Request from this video".
• Name the component, describe what it does, add a credit name and link if you want one, and press File request.

VIDEO KEEPS THE MOTION
A picked video is attached as its file when it's small enough, as a few seconds' recording when it isn't, and as a link when the page allows neither. To attach video files served from other sites, allow it once in Settings.

ONLY WHAT YOU CAPTURE
• Nothing on a page is read until you start a capture, and only in the tab you start it in.
• Nothing is sent until you press File request.
• A request includes your screenshot, the page address, the name and description you write, any credit you add and, for a snapped element, its CSS selector and HTML with scripts removed. You can turn off HTML and video in Settings.
• Requests are posted as public issues in the UICapsule GitHub repository, so don't capture anything private.
• No account, no sign-in, no analytics.

Accepted requests are built into components in the UICapsule gallery, credited to you if you asked. The extension is open source: https://github.com/kyh/uicapsule

Privacy Policy: https://www.uicapsule.com/privacy
```

## Privacy practices

Single purpose:

```text
UICapsule lets the user capture part of the web page they are on (an element, a dragged region, the visible area, or a picked image or video) and file it as a component request to UICapsule (uicapsule.com). Every feature serves that one flow: starting a capture, selecting what to capture, filling in the request, and filing it.
```

activeTab:

```text
Grants temporary access to the current tab only when the user starts a capture from the toolbar button, a keyboard shortcut or the right-click menu. It is needed to inject the capture overlay into that tab and to take the screenshot with tabs.captureVisibleTab. The extension has no standing access to any site.
```

scripting:

```text
Used with activeTab to inject the extension's own bundled capture overlay (overlay.js) into the tab where the user started a capture, with scripting.executeScript. The overlay draws the selection box and the request form. Nothing is injected into any other page, or without a user action.
```

contextMenus:

```text
Adds four right-click items: Capture region, Capture visible area, Request from this image and Request from this video. Each starts a capture in the current tab.
```

storage:

```text
Saves the user's settings in chrome.storage.local: the service address requests are filed to, whether to attach video and include element HTML, and the optional credit name and link so the user doesn't retype them. Nothing is synced.
```

Host permissions (https://www.uicapsule.com/* and the optional <all_urls>):

```text
https://www.uicapsule.com/*: the background service worker sends a filed request and its screenshot or video to the UICapsule API. It is called only when the user presses File request, and without cookies.

<all_urls> (optional, off by default): requested only when the user presses Allow under "Videos from other sites" in Settings. Picked videos are often served from another domain than the page; with this access the extension downloads the picked video file (4 MB at most) to attach it. Without it, the extension records a few seconds of the video instead. The user can revoke it in Settings.
```

Remote code: **No, I am not using remote code.**

Data usage, tick only these:

| Data type                           | Tick                                                               |
| ----------------------------------- | ------------------------------------------------------------------ |
| Personally identifiable information | Yes (the optional credit name and link)                            |
| Web history                         | Yes (the address of the page a request is captured from)           |
| Website content                     | Yes (screenshot, element selector and HTML, picked image or video) |
| Everything else                     | No                                                                 |

Tick all three certifications.

Privacy policy URL: `https://www.uicapsule.com/privacy`

## Distribution

| Field      | Value          |
| ---------- | -------------- |
| Payments   | Free of charge |
| Visibility | Public         |
| Regions    | All regions    |

## Test instructions (if the dashboard has this tab)

```text
No account or sign-in. Open any web page, click the toolbar icon (or press Alt+Shift+R, Option+Shift+R on Mac) to open the inspect bar at the bottom of the page. Click an element, press Enter, fill in a name and description, and press File request. The request is posted as a public issue at https://github.com/kyh/uicapsule/issues?q=label%3Arequest. Please file test requests with "Chrome review" in the name so we can close them.
```
