# UX, UI and brand audit, and the "Danfo Nights" direction

Reviewed from first screen to last, on a phone-sized screen (390 x 844), by walking the whole game: Title, Create (6 steps), first run, the 3D world and HUD, place and person sheets, Quests, Profile, story events, Year Summary, Achievements, Unlocks, History, Settings, Paywall, Go-Slow Dash, and the in-world tasks.

Reference: Top Eleven (club-style set-up, mentor character, big green NEXT, purple banner bars, stat icons instead of sentences, motion on every reveal) and PS5 adventure and football games (one focused thing on screen, a clear prompt button, soft cinematic framing, generous breathing room, motion that rewards each action).

## 1. What was wrong (honest audit)

| # | Finding | Where | Why it hurts |
|---|---------|-------|--------------|
| 1 | **Text is the interface.** Almost every screen explains itself in sentences (trait cards with two paragraphs each, activity cards with a blurb plus a benefit sentence, place sheets with a description, summary bullets) | Create, Place sheet, NPC sheet, Quests, Summary | Players skim, so the important thing (cost, reward, what to tap) is lost. It reads like a form, not a game |
| 2 | **One visual voice for everything.** Every surface is the same dark purple card with a 2 px border; the primary button is yellow and so are titles, chips and highlights | All screens | Nothing is the hero; hierarchy comes from nothing but size. Yellow means "action", "title" and "reward" at once |
| 3 | **Emoji as UI icons.** Stats, nav, buttons and chips all use system emoji, which render differently on every phone | HUD, nav, chips, buttons | Looks unfinished and inconsistent; low-end Android shows blank boxes for newer emoji |
| 4 | **The Title is a menu, not a moment.** Flat scene, wordmark partly under the characters, five equal buttons, small print about playtime | Title | No emotional hook or brand character in the first 3 seconds; "New life" does not look like the one thing to press |
| 5 | **Creation is a long form.** Skin, hair, face, outfit are separate wrapped lists of text pills; the avatar preview is small and scrolls away | Create step 1 | You can't see the result of what you choose while you choose it. The best moment of the game (making your character) is the most text-heavy |
| 6 | **The HUD says everything at once.** Name, age, cash, energy bar, three stat numbers, date, time, wait, menu, objective strip, last-action card, minimap | World | 11 things compete for attention. The player's real question ("what can I do here?") has no clear answer |
| 7 | **Interaction prompt is a wide label.** "Enter Your home (E)" as a long pill, plus Options, plus Talk | World | The key action should be a big, obvious, thumb-sized button with an icon (like a controller prompt) |
| 8 | **Sheets are lists.** Place, person, quests, achievements and unlocks are all vertical lists of text rows | Sheets | Browsing is slow and not rewarding. Achievements are a to-do list instead of a trophy shelf |
| 9 | **Little motion or reward.** Buttons barely move; numbers jump; achievements and year summary appear as plain cards; toasts are a flat stack | Everywhere | No sense of impact when you do well. This is the biggest gap against Top Eleven |
| 10 | **No guide character.** The tutorial is a card of text | First run | A mentor face that speaks in one line at a time (as Top Eleven does) makes onboarding feel human |
| 11 | **Contrast and size.** Many labels are 11 to 12 px at 60% opacity on dark purple; some tap targets are 28 to 32 px | HUD, chips, task headers | Fails comfortable reading outdoors on a phone; many taps are at the edge of the usable minimum |
| 12 | **Brand is a font and a bus.** There is a nice danfo idea and Nigerian art, but no system: no logo lockup, no colour rules, no consistent illustration treatment | Whole product | Feels assembled, not designed |

## 2. Brand: "Danfo Nights"

**Idea.** Lagos at golden hour turning into a neon night. Warm danfo yellow for reward, deep indigo stage, hot pink and cyan light, and Naija green for the one thing to press. Funny, warm, a bit cheeky, never childish.

**Mascot and guide.** **Oga Conductor**, a danfo bus conductor ("Oya, enter!"). He greets you, teaches the first minute in one short line at a time, and cheers or teases at big moments. He is a face (portrait in a speech card), not paragraphs.

**Colour rules**
- Stage: indigo to near-black (`#150e45` to `#0a0722`) with violet glow top, pink glow right, cyan glow left.
- **Green** = the single main action on a screen (Next, Play, Continue, Enter).
- **Gold** = reward and value (cash, coins, achievements, selected).
- **Pink / cyan** = highlight, live and new.
- **Red** = cost, danger, stress, destructive.
- Never yellow for plain titles any more: titles are white with a soft glow; gold is kept for rewards.

**Type.** Lilita One for titles, buttons and numbers (sporty, friendly, strong at small sizes); Nunito for the little text that is left. Numbers use tabular figures.

**Shape and light.** 16 to 20 px radii, glass panels (gradient, 1 px light edge, soft shadow), pressable "chunky" buttons with a gloss line and a dark bottom edge, one banner ribbon per screen (the team-banner look), rim lights and a slow light-beam backdrop.

**Icons.** A custom flat icon set (bolt, heart, book, star, smile, coin, lock, map, door, ...) so the interface looks the same on every phone. Emoji stay for content (food, places, items).

**Motion principles**
1. Every reveal has a staggered entrance (60 ms steps), never all at once.
2. Buttons squash on press and the main CTA has a slow shine sweep.
3. Rewards arrive with a pop; numbers count up; stat changes float up from where they happened.
4. Screens slide, not cut; backgrounds drift slowly (bus, clouds, beams).
5. Everything respects Reduced Motion.

## 3. Principles for every screen
1. **One hero, one action.** Each screen has a single focal element and a single green button.
2. **Show, don't tell.** Icon + number before words. A sentence only when the choice has a real consequence, and then at most one short line.
3. **Chunk and reveal.** Big tiles with short names; details open on tap (or in the sheet header), never stacked on the card.
4. **Consistent anatomy.** Banner header, glass body, bottom action bar. Same close button, same back button, same spacing scale (4/8/12/16/24).
5. **Thumb first.** Primary controls in the bottom 40% of the screen; minimum tap target 44 px; text never below 12 px at full contrast.
6. **Feedback always.** Press, success and failure each have a visual and a sound.

## 4. Screen-by-screen plan

| Screen | Before | After |
|--------|--------|-------|
| Title | Menu of 5 buttons | Full-bleed animated key art (danfo, skyline, sun), logo lockup, one big green PLAY / CONTINUE, icon-only secondary row (trophies, shells, past lives, settings), playtime as a small clock pill |
| Create | 6 text-heavy form steps | Big live avatar always visible; steps are icon tabs; looks are swatches and mini previews; traits are two-icon cards (upside / catch) with details on tap; dream and home are big picture cards; lottery is a card flip reveal; name uses suggestion chips; Oga Conductor comments in one line |
| First run | Card of text | Oga Conductor speech card (portrait + one line), pulsing target ring on the thing to do |
| HUD | 11 elements | Avatar ring + cash pill + energy bar + 3 round stat badges (tap for all), date/time pill, minimap; the objective is a slim banner with an arrow; one clear action button |
| Prompts | Wide text pill | Big round action button (icon) with a small label chip, like a controller prompt; secondary actions are small round buttons |
| Dock | 4 text chips | Icon dock: Places, Quests, Profile, Home, with active glow |
| Place and person sheets | Text rows | Header banner with the place art, then a grid of activity tiles: icon, short name, energy cost chip, reward icons; locked tiles show a lock and one reason word |
| Event | Wall of text, text choices | Cinematic card: scene art header, ribbon title, 2 lines max, choices as big buttons with cost and outcome icons |
| Year summary | Bullets | "Season recap": animated count-up income and expenses, stat tiles with deltas, achievement celebration with confetti, big NEXT YEAR |
| Ending | Text card | "Final whistle": legacy card, stat trophies, life score count-up, share |
| Quests, Profile | Lists | Progress rings and icon cards; dream as a hero card |
| Achievements | List | Trophy shelf grid; locked as silhouettes; unlock animation |
| Unlocks | List | Shop-style grid with preview and price chips |
| Settings | Row of toggles | Grouped cards with icons and switches |
| Toasts | Flat stack | Slide-in banners with an icon, colour by type |
| Tasks (study, penalties, ...) | Per-task bottom sheets | One shared task panel look (banner, progress, big buttons) |

## 5. How we will judge it
- First-time player can start a life without reading more than one line per screen.
- No screen has more than 40 words of body text at rest (counted in QA).
- The main action is the largest and brightest control on every screen.
- 60 fps scrolling on a mid-range phone; no layout shift; works with Reduced Motion and larger text.
