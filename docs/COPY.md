# One Timeline v7 · copy (single source)

Components read this file at build time through `src/lib/copy.ts`. Keep the format:
one `## <chapter id>` per chapter, then `key: value` lines. A `line` is one English
sentence or two, 15 words at most. `code` lines may repeat. Do not add keys the
parser does not know (`title`, `word`, `word2`, `line`, `code`, `marks`, `number`, `unit`, `replay`, `playhead`).

## hero
title: One Timeline
word: Sequence, overlap, ease, stagger, scrub, reverse.
marks: 0:00.00, 0:00.90, 0:01.60, 0:02.30, 0:03.10, 0:03.90
line: One timeline, six moves. Every word performs the move it names, then stands still.
replay: Replay

## position
title: Position
word: SEQUENCE
word2: OVERLAP
playhead: Playhead
line: Where a tween starts is its position. Next in line, or six hundredths early.
code: tl.to(".seq", { y: -80 }, "+=0")
code: tl.to(".ovl", { y: -80 }, "<0.06")

## ease
title: Ease
word: EASE
line: Twelve copies of one word. Their spacing is the curve.

## stagger
title: Stagger
word: STAGGER
line: One tween, a grid of letters. The offset decides who moves first.

## scrub
title: Scrub
word: SCRUB
line: The only chapter on the scroll. Your finger is the playhead.

## reverse
title: Reverse
word: REVERSE
word2: REVERSE
line: Played backwards, an ease-out crawls. easeReverse keeps the exit honest.
code: tl.reverse()
code: gsap.timeline({ easeReverse: true })

## cost
title: Cost
word: COST
number: 16.7
unit: ms per frame
line: Same letters, two ways to move them. One fits in a frame. One does not.
code: gsap.to(".l", { x: 120 })
code: gsap.to(".l", { left: 120 })

## yours
title: Yours
word: YOURS
line: Your turn. Change the line, play it on the word.
code: tl.to(".letter", { x: 120, rotation: 12, duration: 0.8, ease: "beat" }, "+=0")
