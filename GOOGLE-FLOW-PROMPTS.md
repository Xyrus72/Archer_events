# Google Flow (Veo) — Archer Events Hero Video

Brand palette locked to the logo: black, golden-yellow, white.

Put the finished export at **`public/hero.mp4`** — the site detects it and
fades it in over the animated fallback automatically.

---

## ★ THE PROMPT (chosen) — Abstract 3D "event universe"

One cinematic 3D shot that represents all of event management, ending on
the brand's arrow. Loops cleanly. Generate 2-3 takes, keep the smoothest.

> Cinematic 3D animation, one continuous slow camera glide through dark
> infinite space, luxury motion-design style. Floating 3D objects made of
> black glass and brushed gold slowly drift and rotate in zero gravity,
> arranged like a premium exhibition: a miniature glowing concert stage
> with tiny sweeping spotlight beams, a shimmering disco mirror ball, an
> elegant gold venetian masquerade mask, a vintage chrome microphone, a
> wedding arch wrapped in warm string lights, floating balloons, glowing
> event tickets and slow-motion golden confetti. Streams of golden light
> particles flow between the objects and each object gently lights up as
> the camera passes it. Everything reflects on a glossy black floor below.
> In the final seconds the golden particles converge and form a sleek
> glowing arrow gliding forward through the darkness. Deep black
> background, golden-yellow rim lighting with clean white highlights,
> volumetric haze, anamorphic lens flares, octane render, ultra-detailed
> 8K, premium luxury brand aesthetic, seamless dreamy slow motion, one
> unbroken camera move. No text, no logos, no people, no camera shake.

**Negative prompt:**

> text, captions, watermark, logo, people, faces, hands, daylight, blue
> neon, pink neon, camera shake, fast cuts, morphing, flicker, cartoon,
> low poly

Want it longer? Generate a second clip with the same prompt plus "camera
glides past a different cluster of the same objects" and stitch the two
with a cross-dissolve.

---

# Older alternatives (real-footage style, not chosen)

## Flow settings

- **Aspect:** 16:9 landscape
- **Model:** highest quality available (Veo 3 Quality)
- **Resolution:** generate at 1080p, use Flow's **Upscale to 4K** on the
  final export if your plan has it
- Audio irrelevant — the site plays muted
- Keep the left third of each shot darker/simpler — the headline sits there
- **No text or logos in the video** — the site overlays the branding

## The style block (paste at the END of every prompt — this is what keeps
## all clips looking like one film in Archer's colors)

> Unified look: deep black background, golden-yellow and warm amber
> lighting with clean white highlights, volumetric haze, anamorphic lens
> flares, photorealistic, cinematic 35mm film look, slow motion, shallow
> depth of field, premium event-brand aesthetic, ultra-detailed 4K. No
> text, no logos, no readable signage, no camera shake.

---

## OPTION A — Single-clip montage (fastest, one generation)

> Cinematic montage of a premium event company's work, elegant match cuts
> every two seconds: a packed concert arena where golden spotlight beams
> sweep over a silhouetted crowd with raised hands — cut to — a festive
> night market mela with warm string lights glowing over stalls of fabrics
> and jewelry as visitors browse in soft bokeh — cut to — an elegant
> masquerade party, guests in black-and-gold venetian masks dancing under
> chandeliers as golden confetti falls in slow motion — cut to — a singer
> silhouetted at a vintage microphone in a moody lounge lit by warm golden
> neon glow — cut to — a wide finale shot of golden fireworks erupting over
> an outdoor stage and cheering crowd. Smooth slow camera glides in every
> scene. + STYLE BLOCK

---

## OPTION B — 5 clips stitched in SceneBuilder (best result)

Generate each 8s clip, assemble in Flow's SceneBuilder in this order with
soft cross-dissolves, export as one MP4.

**Clip 1 — Concert (opener)**
> Slow-motion shot inside a massive dark concert arena. Dozens of
> golden-yellow spotlight beams sweep through hazy air above a huge crowd
> of silhouetted people with raised hands. Golden confetti drifts down,
> catching the light. The camera glides forward slowly at crowd level
> toward the glowing stage. + STYLE BLOCK

**Clip 2 — Mela / night market**
> Slow cinematic dolly through a vibrant festive night market at dusk.
> Strings of warm golden fairy lights zigzag overhead between stalls
> displaying colorful fabrics, handmade jewelry and glowing lanterns.
> Silhouetted visitors browse and laugh softly out of focus, steam rises
> from a food stall, dust particles float in warm light. + STYLE BLOCK

**Clip 3 — Masked party**
> Slow-motion shot inside an opulent dark ballroom. Elegantly dressed
> guests wearing ornate black-and-gold venetian masquerade masks dance
> under a grand chandelier. Golden confetti falls in extreme slow motion,
> candlelight flickers across the masks, a slow smooth camera orbit around
> the dancers. Mysterious and luxurious mood. + STYLE BLOCK

**Clip 4 — Karaoke / live lounge**
> Moody close-up of a silhouetted singer at a vintage chrome microphone in
> a dark intimate lounge, backlit by warm golden neon glow and soft haze.
> Depth-of-field bokeh of a small crowd swaying with drinks and phone
> lights raised. The camera pushes in very slowly. + STYLE BLOCK

**Clip 5 — Finale (loops back to Clip 1's energy)**
> Wide low-angle shot of golden fireworks and sparkler fountains erupting
> against a pitch-black sky above an outdoor festival stage. Embers rain
> down in extreme slow motion over a cheering silhouetted crowd with arms
> raised. + STYLE BLOCK

---

## Negative prompt (paste into the negative field if shown)

> text, captions, watermark, logo, signage, daylight, blue neon, pink
> neon, camera shake, fast cuts, faces in sharp focus, distorted hands,
> morphing, flicker

## Export checklist

1. Order: concert → mela → masked party → karaoke → fireworks.
2. Cross-dissolve ~0.5s between clips.
3. Upscale to 4K if available, else 1080p is fine (the site serves it
   full-bleed either way).
4. Export MP4, rename to `hero.mp4`, drop into `D:\eventweb\public\`.
5. Refresh the site — done.
