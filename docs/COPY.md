# One Timeline v7 · copy (single source)

Components read this file at build time through `src/lib/copy.ts`. Keep the format:
one `## <chapter id>` per chapter, then `key: value` lines. A `line` is one English
sentence or two, 15 words at most. `code` lines may repeat. Do not add keys the
parser does not know (`title`, `word`, `word2`, `line`, `code`, `marks`, `number`, `unit`, `replay`, `playhead`, `nojs`, `toggle`, `pause`, `play`, `reverse`, `copy`, `top`, `link`, `colophon`).

## hero
title: One Timeline
word: Sequence, overlap, ease, stagger, scrub, reverse.
marks: 0:00.00, 0:00.90, 0:01.60, 0:02.30, 0:03.10, 0:03.90
line: One timeline, six moves. Each word performs the move it names, then sits down.
replay: Replay

## position
title: Position
word: SEQUENCE
word2: OVERLAP
playhead: Playhead
line: Position is where a tween starts. Next in line, or cutting in six hundredths early.
code: tl.to(".seq", { y: -80 }, "+=0")
code: tl.to(".ovl", { y: -80 }, "<0.06")

## ease
title: Ease
word: EASE
playhead: Playhead
line: Twelve copies of one word. The gaps between them are the curve. Mind the gap.

## stagger
title: Stagger
word: STAGGER
playhead: Playhead
line: One tween, 112 letters. The offset decides who goes first. Nobody argues.

## scrub
title: Scrub
word: SCRUB
playhead: Playhead
line: The only chapter on the scroll. Your finger is the playhead. Yes, that one.

## reverse
title: Reverse
word: REVERSE
word2: REVERSE
playhead: Playhead
line: Backwards, an ease-out crawls like a snail. easeReverse keeps the exit honest.
code: tl.reverse()
code: tl.to(b, { yPercent: 0, ease: "expo.out", easeReverse: true })

## cost
title: Cost
word: COST
number: 16.7
unit: ms per frame
line: Four letters, two ways. One fits the frame. The other sets it on fire.
nojs: With JavaScript the letters orbit and the number is this frame's real cost; switching to left/top turns the field red.
toggle: left / top
pause: Pause
code: gsap.to(".l", { x: 120 })
code: gsap.to(".l", { left: 120 })

## yours
title: Yours
word: YOURS
line: Your turn. Edit the line, play it on the word. Break it, we reset.
nojs: With JavaScript this line is editable and plays on the letters of YOURS.
play: Play
reverse: Reverse
copy: Copy
code: tl.to(".letter", { x: 120, rotation: 12, duration: 0.8, ease: "beat" }, "+=0")

## sources
title: Sources
link: GSAP 3.15: easeReverse | https://gsap.com/docs/v3/GSAP/Tween/vars/
link: GSAP Timeline | https://gsap.com/docs/v3/GSAP/Timeline/
link: ScrollTrigger | https://gsap.com/docs/v3/Plugins/ScrollTrigger/
link: GSAP + React | https://gsap.com/resources/React/
link: web.dev: compositor-only properties and layer count | https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count
link: Long Animation Frames API | https://developer.chrome.com/docs/web-platform/long-animation-frames
link: Codrops: Animating with agents, GSAP and Animaxxing | https://tympanus.net/codrops/2026/10/26/animating-agents-gsap-animaxxing/
link: Museum of Motion (inspiration) | https://tympanus.net/Demos/MuseumOfMotion/
colophon: Set in Anybody (Tyler Finck, Etcetera Type Co.) via next/font. Built with
top: Back to the top

## author
title: Made by Piotrek Filipecki
link: Portfolio | https://piotrfilipecki.com
link: GitHub | https://github.com/PiotrekFilipecki
