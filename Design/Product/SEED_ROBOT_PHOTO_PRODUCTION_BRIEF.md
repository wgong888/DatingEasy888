# Seed And Robot Photo Production Brief

Status: production-safe direction for creating original profile media.

## Goal

Create original, commercially usable, non-explicit profile photos for
DatingEasy888 seed and robot customers without copying people, usernames,
biographies, or photos from reference products.

## Hard Rules

- Do not use `ScreenCopy/docphotos/` or `ScreenCopy/docphotos-reference/` as
  profile photos.
- Do not use those files as image-to-image, face-reference, body-reference, or
  lookalike inputs.
- Do not reproduce reference usernames, ages, poses, rooms, clothing, captions,
  or distinctive identity combinations.
- Profile and discovery photos should be non-explicit.
- Every generated or licensed identity must have provenance, usage rights, and
  human approval before activation.

## What The References May Inform

- Grid density and card crop ratios
- Need for varied portrait distance: close portrait, waist-up, lifestyle
- Need for varied settings: home, city, cafe, outdoors, travel, hobby
- Need for age diversity and style diversity
- How overlays affect readability

## Initial Pilot Batch

Produce 12 fictional adults:

- 6 women and 6 men
- Ages 25-55
- Locations: Los Angeles, New York, Chicago, Houston, Miami, Seattle
- Three photos per identity:
  - primary portrait
  - everyday activity
  - different setting/clothing
- Non-explicit wardrobe and pose
- Natural, realistic lighting
- No logos, watermarks, readable documents, license plates, or children

## Example Prompt Pattern

Use this as a provider prompt template, not with any reference image attached:

```text
Create an original photorealistic profile photo of a fictional adult for a
social conversation website. The person is clearly age 30-45, dressed in
everyday non-explicit clothing, natural expression, realistic skin texture,
natural lighting, candid but polished. Use a simple home, cafe, park, or city
background with no readable text, no brand logos, no children, no documents,
no license plates, no watermark. Do not resemble any real person or celebrity.
Do not use sexual nudity or explicit posing.
```

For each identity, generate all three photos from the same original character
specification and retain the prompt, provider, model version, timestamp, and
review result.

## Approval Checklist

- Appears adult and consistent with stated age
- Same identity across the three-photo set
- No explicit nudity in profile/discovery images
- No accidental real-person, celebrity, or public-figure resemblance
- No copied reference-product identity detail
- No unsafe background details
- JPG or PNG derivative approved for publication
