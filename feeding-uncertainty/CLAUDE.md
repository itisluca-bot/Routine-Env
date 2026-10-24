# Feeding Uncertainty — project notes

- All animations render and export at 4K UHD: 3840 × 2160. Design in 1920 × 1080 coordinates and scale the whole composition up 2x (vectors stay sharp); the CompositionStage is 3840 × 2160.
- Background: black is not a rule. The first shots used #0e0e0e; the toned look puts scenes in a group's ramp, whose tinted dark replaces black.
- No film grain (added in post). Line boil at 8 fps with an amplitude tweak.
- Group colours: withdrawal #46647a, open #5fa69a, curators #e0a165, radicalization #a32e11.
- Timing comes from the user's SRT files; assume 25 fps.
- Render with `node tools/render.mjs "<shot>.dc.html"` (see README.md); it writes 4K PNG sequences to renders/.
- New session? Read ANIMATION-GUIDE.md: workflow, techniques, rendering checks, and what is approved in each shot.
- The toned look (agreed October 2026, see LOOK.md): people are the Bean toned into flat bands of their group's ramp (`ToneBean` in `rigs/fu-look.jsx`). No contour rings. Eyes always sharp. Bands come from the scene's own lights (`lights` prop), so dynamic lights (streetlights, swinging lamps, phones) move them. Hair per character: none, beanie or long. Backgrounds out of focus, in the ramp. Red comes in through the posts, and possibly through some story beats.
