# Feeding Uncertainty — project notes

- All animations render and export at 4K UHD: 3840 × 2160. Design in 1920 × 1080 coordinates and scale the whole composition up 2x (vectors stay sharp); the CompositionStage is 3840 × 2160.
- Background RGB 14/14/14 (#0e0e0e).
- No film grain (added in post). Line boil at 8 fps with an amplitude tweak.
- Group colours: withdrawal #46647a, open #5fa69a, curators #e0a165, radicalization #a32e11.
- Timing comes from the user's SRT files; assume 25 fps.
- Render with `node tools/render.mjs "<shot>.dc.html"` (see README.md); it writes 4K PNG sequences to renders/.
- New session? Read ANIMATION-GUIDE.md: workflow, techniques, rendering checks, and what is approved in each shot.
