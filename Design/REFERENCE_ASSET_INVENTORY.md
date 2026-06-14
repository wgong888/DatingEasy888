# Reference Asset Inventory

Date reviewed: June 11, 2026

Updated: June 13, 2026

## Purpose

`ScreenCopy/` contains third-party product captures used to understand dating
site layouts, workflows, visual density, navigation, profile presentation, and
chat-list behavior. These files are research evidence only.

DatingEasy888 must create its own interface, copy, icons, profile identities,
photos, and visual system. A reference capture does not grant permission to
republish the depicted UI, text, branding, or people.

## Existing Versioned References

The repository already tracks 26 files under `ScreenCopy/`, primarily the
original Horizon Singles and Best Dates flow references used by the frontend
design documents.

## June 11 Local Reference Set

### Chat List

Location: `ScreenCopy/chats/`

- 8 PNG screenshots
- Each screenshot is 2048 x 1280
- Approximate directory size: 5.1 MB
- Depicts BestDates chat-list behavior across recent and older conversations

Useful patterns:

- All chats, Active, and Requests tabs
- Unread counters and recent-message previews
- Presence indicators
- Message, mail, newsfeed, people, and search navigation
- Text, photo, audio, sticker, and promotional preview states

### Profile Gallery

Location: `ScreenCopy/photos/`

- 46 PNG screenshots
- Each screenshot is 2040 x 774
- 1 QuickTime screen recording, 2040 x 888, approximately 6 minutes 35 seconds
- Approximate directory size: 184 MB
- Depicts two-column profile/gallery cards, favorites, photo counts, portrait
  crops, and scrolling behavior

### Additional Horizon Singles Captures

Locations:

- `ScreenCopy/Screenshot 2026-06-11 at 10.08.51 AM.png`
- `ScreenCopy/Screenshot 2026-06-11 at 10.22.56 AM.png`

The actual filenames include macOS narrow no-break spaces before `AM`.

These captures show:

- Personal-information field layout
- Profile gallery presentation
- Footer links and age/site-description language

## June 13 DocPhotos Reference Set

Source document:

- `/Users/weizhonggong/Downloads/DocPhotos.docx`

Extracted location:

- `ScreenCopy/docphotos/`
- Reduced internal viewer: `ScreenCopy/docphotos-reference/index.html`

Contents:

- 27 PNG screenshots extracted from the DOCX
- Each screenshot is 1920 x 1080
- Approximate extracted directory size: 36 MB
- 27 reduced reference derivatives were created at 640px maximum dimension
  for internal review, approximately 6.6 MB total
- The screenshots show Horizon Singles member-gallery pages and adult profile
  imagery, including nude or sexually suggestive profile photos

Useful patterns:

- Desktop gallery card density
- Profile-card crop ratios
- Age and display-name overlays
- Grid spacing and sticky header behavior
- Range of portrait, selfie, lifestyle, and explicit-content presentation used
  by a reference competitor

Use limits:

- These files may inform high-level product and UI research only.
- Do not use them as seed or robot customer photos.
- Do not crop, clean, upscale, redraw, or otherwise transform depicted people
  into DatingEasy888 profiles.
- Do not use them as image-to-image generation inputs for lookalike people.
- Do not use their usernames, ages, poses, locations, or distinctive identity
  details as generated-profile prompts.
- DatingEasy888 seed and robot publication photos should be non-explicit unless
  a later legally approved adult-media policy permits a different class of
  private media.

## Handling Rules

- Do not copy third-party branding, text, or distinctive visual expression.
- Do not extract, crop, or reuse depicted people as DatingEasy888 profiles.
- Do not use the captures for seed-profile training or identity generation.
- Do not use the captures to generate lookalike robot or seed customers.
- Do not place these files in a production build, public media bucket, demo
  database, marketing package, or application download.
- Keep source/provenance labels when a reference is retained.
- Use the captures to derive requirements and generic interaction patterns only.
- Use original, licensed, or properly generated DatingEasy888 media for all
  runnable product content.

## Version-Control Note

The June 11 gallery directory is approximately 184 MB, including a 96 MB
recording. It is currently local and untracked. Do not add this set to ordinary
Git history until the project chooses approved large-file storage and confirms
that retaining the captures is legally appropriate.
