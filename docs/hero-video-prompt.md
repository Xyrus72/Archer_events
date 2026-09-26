# Hero background video — generation prompt

The hero is a printed poster: cream paper, a flat burnt-orange sun, and the evening drawn
along the bottom edge. The film is multiplied into the sky at ~22% opacity, so it must be
**light, warm, flat and *moving***. Not a still with a breeze — a travelling shot through
one night, told in five inks.

**Five inks, nothing else:** cream `#F2E3C0` · dark brown `#2A1D12` · terracotta `#B8501F`
· burnt orange `#DE7A2E` · sage olive `#7E8A6A`.

---

## Prompt

> Retro 1970s screen-printed poster, animated as one continuous travelling shot across a
> night of live events. Flat vector illustration, hard edges, five flat inks only: cream
> paper, dark brown silhouettes, terracotta, burnt orange, sage olive. No shading, no
> gradients — only broad flat colour blocks.
>
> The camera glides slowly right along a long strip of dark-brown silhouettes standing on a
> cream sky. It begins at a night-market stall: a striped awning, strings of bulbs flicking
> alight one after another, small figures leaning in to browse. The camera keeps moving and
> passes a reception hall — pitched roof, columns, a warm amber chandelier blooming to life,
> festoon lights swinging gently, silhouetted guests drifting between the pillars. The
> camera arrives at a concert stage: a lighting truss snaps on, six amber beams sweep and
> cross in rhythm, speaker cones pulse with the bass, a lone figure raises one arm behind
> the decks, and a crowd of silhouettes throws their hands up as terracotta confetti bursts
> and drifts down.
>
> Behind everything: a huge flat burnt-orange sun sinking slowly toward the horizon, cut by
> thin horizontal stripe rays; a wide fan of orange light radiating from behind the stage,
> breathing wider as the music builds; scalloped sage-olive and terracotta cloud banks
> sliding past at different speeds — clouds slowest, buildings mid, crowd fastest, a clean
> parallax.
>
> As the sun touches the horizon the camera eases back out to the full wide poster and the
> sky settles to where it began, so the loop is seamless.
>
> Characters and lights animate on twos, like cel animation; the camera glide is perfectly
> smooth. Confident, warm, unhurried. Wide 16:9, 12 seconds, seamless loop.

---

## Beat sheet — if the tool takes a shot list

| Time | What moves |
| --- | --- |
| 0–3 s | Wide on the market stall. Bulbs pop on one by one, left to right. Clouds begin sliding. Camera starts its glide right. |
| 3–6 s | Past the hall. Chandelier blooms amber, festoons sway, guests drift between columns. The sun has visibly dropped. |
| 6–9 s | The stage. Truss snaps on, beams sweep and cross, speakers pulse, crowd arms shoot up, confetti bursts. The ray fan opens wide. |
| 9–12 s | Camera eases back to the full poster. Sun touches the horizon, rays settle, confetti finishes falling. Frame matches 0 s. |

---

## Must NOT have

Paste as a negative prompt, or state plainly if there is no negative field:

> No film grain, no dust, no scratches, no VHS or CRT artefacts, no chromatic aberration,
> no paper crumple or fold texture, no sepia photograph look, no distressed, aged, worn or
> damaged effects, no vignette, no lens flare, no light leaks, no live-action footage, no
> photorealism, no 3D render, no text, no logos, no readable signage, no faces or facial
> features, no camera shake, no whip pans, no hard cuts.

Retro vintage here means the **printing**, not the wear — a poster pulled yesterday.

---

## Delivery

- 16:9, 1920×1080 or better, H.264 `.mp4`
- 12 s, seamless loop, **no audio**
- Under ~4 MB (the current file is 3 MB) so the hero stays fast
- Save it as `public/hero.mp4`, replacing the existing file — nothing else to change

## Notes for whichever generator you use

- **If it comes back too still:** push the motion words — "continuous camera glide", "beams
  sweeping", "crowd raising arms", "confetti falling" — and cut the cloud and sun lines,
  which bias models toward landscape stillness.
- **If the loop seams badly:** ask for "first and last frame identical" explicitly, or
  generate 14 s and trim to the matching frames.
- **If it adds grain anyway:** regenerate. The film is multiplied into the paper, so grain
  reads as dirt on the poster rather than texture.
- **If it drifts off palette:** name the five hex values again in the same sentence as
  "flat vector, no gradients".
