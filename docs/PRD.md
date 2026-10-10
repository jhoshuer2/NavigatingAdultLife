# Navigating Adult Life — Product Requirements Document

**Working title:** Navigating Adult Life (codename: *NAL*)
**Version:** 1.0 (draft for review) · **Status:** Pre-development, no code written
**Platform:** Mobile-first web browser game (installable PWA), desktop supported
**Launch setting:** Lagos, Nigeria · **Committed expansion order (owner):** Abuja → Delta State (e.g., Warri, Asaba) → Akwa Ibom State (e.g., Uyo, Eket) · **Later:** Port Harcourt, Kano, Enugu, Ibadan, then other African cities (Accra, Nairobi, Johannesburg, …)

---

## 0. How to use this document

This PRD is written to be consumed by a human team *and* by AI coding agents. Conventions:

- Requirement IDs look like `M1-F03` (Milestone 1, Feature 3). Reference them in tickets, commits and tests.
- **MUST / SHOULD / MAY** follow RFC 2119 meaning.
- Every milestone has *scope*, *out of scope*, *acceptance criteria*, *test plan*, and a *definition of done*. A milestone is not complete until every MUST criterion passes.
- Numbers in this document (salaries, costs, probabilities) are **starting values for tuning**, not final balance. They live in data files (Section 14), never hard-coded.
- Section 19 lists **assumptions** I made and Section 20 lists **open questions** that need a human decision.

> **Note on the reference sites.** The three examples (danfo.horpey.dev, lagoslife.app, campuslife.cubbes.app) could not be opened from the sandbox (DNS lookup failed). Screen recordings of **danfo.horpey.dev** (drove Section 7.1), **campuslife.cubbes.app** (drove Section 5.6 and the M2 world scope) and **lagoslife.app** (drove Section 5.7 and character creation) were later supplied and reviewed. The rest is derived from the brief and the two recordings. Treat those three as inspiration only; no assets, names or copy are reused.

---

## 1. Product vision

### 1.1 One-liner
A funny, warm, replayable life simulator where you grow up Nigerian — from primary school to old age — making choices about school, money, love, hustle and family, and living with the consequences.

### 1.2 Vision
Most life sims are Western-default. *Navigating Adult Life* makes the Nigerian (and later, African) experience the default: the generator noise, the go-slow, the owambe, JAMB stress, NYSC, mama's phone calls, the "japa" dream, the small business that feeds a whole family. It should feel like a friend telling a funny, true story about life — not a museum exhibit and not a stereotype pile.

### 1.3 Design pillars
1. **Choices with weight.** Every choice changes stats, relationships, flags, or future event availability. No fake choices. The end-of-life summary must be able to say *why* your life went the way it did.
2. **Funny but respectful.** Humour comes from shared recognition and clever writing, not from mocking people. Culture is portrayed with specificity and affection.
3. **Short sessions, long arcs.** A life runs 20–35 minutes in M1; a single year takes 15–40 seconds. Playable on a cheap Android phone on patchy data.
4. **Many lives, not one.** Traits, backgrounds, cities and hidden branches make each run different; achievements and legacy rewards give a reason for "one more life".
5. **Arcade relief.** Skill-based mini-games give the player a break from reading and a direct way to affect their economy.
6. **Data-driven.** Events, jobs, items and NPCs are content files. Adding a city or 50 events must not require engine changes.

### 1.4 Target audience
- **Primary:** Nigerian players 16–35, mostly on mid/low-end Android, mobile data, short play sessions, social-media sharing culture.
- **Secondary:** Nigerian diaspora and other Africans who recognise the context; global fans of life sims (BitLife-style) curious about a different culture.
- Tone/rating target: **PG-13**. Mature themes (death, poverty, corruption, relationships) are handled with humour and care; no explicit content.

### 1.5 Success metrics (post-launch of M1 public beta)
| Metric | Target |
|---|---|
| Players who finish a life (reach an ending) | ≥ 55% of those who start |
| Median session length | 8–15 min |
| D1 / D7 retention | ≥ 30% / ≥ 12% |
| Lives started per returning player (first week) | ≥ 2.5 |
| Median time-to-first-interactive on 4G mid-range Android | ≤ 3 s |
| Crash-free sessions | ≥ 99.5% |

### 1.6 Non-goals (v1–v3)
- No real-time multiplayer or chat. No user-generated content in v1–v3. No real-money gambling or real-money payouts. **Paid content is limited to Playtime Tokens (3.10); no pay-to-win, no loot boxes, no purchasable Cowries.**
- No 3D. No native app stores (PWA only) unless demand justifies it.
- No attempt at statistically accurate Nigerian economics: the economy is *plausible and funny*, tuned for fun.
- No real people, real political parties, or real brands as *characters*. Real Nigerian places, roads and institutions may appear **as settings** under the guardrails in Q18 (no logos, no endorsement, no defamation).

---

## 2. Core gameplay loop

### 2.1 Time model
- **Macro tick = one year of life.** Life runs from age 6 (start of primary school) to death or a cap at age 90. (Optional "start as adult" scenario in M3.)
- Each year the player has **Energy (0–100)**. Activities cost Energy. When the player is out of Energy (or chooses "End Year"), the year resolves.
- **Life stages:** Childhood (6–11) · Teen (12–17) · Young Adult (18–29) · Adult (30–59) · Elder (60+).

### 2.2 The yearly loop (all milestones)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. YEAR START   age++ · apply recurring income/expenses · stage      │
│                 transitions · scripted milestone prompts (exams,    │
│                 graduation, retirement)                              │
│ 2. ACTION PHASE player spends Energy on Activities (study, work,    │
│                 hustle, socialise, rest, mini-game, explore, shop)  │
│ 3. EVENT PHASE  1–3 events drawn from the eligible weighted pool    │
│                 (+ any scripted/follow-up events). Each has choices │
│ 4. YEAR SUMMARY stat deltas, headline ("2031: Promoted! Aunty Ngozi │
│                 is jealous."), achievements/quest pop-ups           │
│ 5. NEXT YEAR    or ENDING if death/retirement cap reached           │
└─────────────────────────────────────────────────────────────────────┘
```

- **Short loop (seconds):** pick an activity → see result → pick another.
- **Medium loop (a year, 15–40 s):** spend Energy well → survive/enjoy events → read the summary.
- **Long loop (a life, 20–35 min):** shape a trajectory (education → career → family → legacy) → ending screen with legacy score.
- **Meta loop (many lives):** Cowries (meta-currency), achievements, unlocks, new starting backgrounds/cities.

### 2.3 Death and endings
- Death is **probabilistic** from age 45+ (and via rare early events), driven by the hidden **Health** stat, age, and lifestyle flags. Hard cap at 90.
- The ending screen shows: cause/circumstances, a generated **obituary** in the game's voice, top 5 life moments (from the event log), final stat radar, net worth, relationships, **Legacy Score**, achievements earned, Cowries awarded.
- Ending archetypes (computed from flags/stats; at least 8 in M1): *Respected Elder*, *Big Oga*, *Comfortable & Content*, *Hustler Till the End*, *Family Pillar*, *Scholar*, *Broke but Beloved*, *Lonely at the Top*, *Cut Short*.

---

## 3. Game systems

### 3.1 Primary stats (the five requested)

| Stat | Range | Meaning | Visible? |
|---|---|---|---|
| **Cash** | integer ₦ (can go negative → debt) | Spendable money. Income and expenses settle each year. | Yes |
| **Energy** | 0–100 | Action budget for the year. Refills at Year Start to `maxEnergy`. | Yes |
| **Happiness** | 0–100 | Mood. ≤ 15 for 2 consecutive years triggers burnout/sad events; ≥ 85 unlocks "joy" events and Health bonus. | Yes |
| **Knowledge** | 0–100 | Learning and skill. Gates schools, exams, jobs. | Yes |
| **Social Reputation** | 0–100 | How people regard you ("Respect/Aura"). Affects relationships, business trust, opportunities. | Yes |

**Supporting stats:**
- **Health (0–100, shown as a subtle heart/icon).** *Assumption:* required to make death and sickness meaningful. Affects `maxEnergy` and mortality.
- **Stress (hidden 0–100, surfaced as a "tired/frazzled" indicator).** Accumulates from overwork; M2+.
- **Skills** (M2+): Hustle, Tech, Creativity, Charm, Fitness — each 0–10, levelled by activities. M1 uses Knowledge only plus per-career "experience years".

All stats clamp to their range. Cash has no hard cap. Every stat change is recorded in the **event log** with a reason string (used by the year summary and obituary).

### 3.2 Currencies
- **Naira (₦) = Cash.** In-world money.
- **Mini-game coins.** Collected in the runner. At the end of a run they convert to Cash at `coinToCash` (default ₦50 each, scaled by life stage) subject to a **per-year cap** (default 3 mini-game cash-outs/yr) to prevent grinding the economy.
- **Cowries (meta-currency, persists across lives).** Earned from achievements, quest chains, ending Legacy Score, and daily bonus (M3). Spent on cosmetics, starting perks and unlocks (Section 8). Cowries are **never** purchasable with real money; the only thing for sale is **Playtime Tokens** (3.10).

### 3.3 Energy economy (starting values)
- `maxEnergy = 100 − agePenalty − healthPenalty − stressPenalty` (age penalty starts at 50, 0.5 per year; floor 40).
- Typical costs: Study 20 · Work (job, full year) 40 · Side hustle 25 · Socialise 15 · Rest 10 (restores +Health/Happiness) · Mini-game 10 · Exercise 15 · Community/Faith 10.
- Result: ~3–5 meaningful activities per year; deciding what to skip is the core tension.

### 3.4 Money model (yearly settlement)
```
netCash = income(job + business + side hustle + gifts)
        − livingCost(housing, lifestyle, city, dependants)
        − eventCosts − loanRepayments
```
- **Lifestyle** setting (Frugal / Normal / Baller) multiplies living cost (0.7 / 1.0 / 1.6) and modifies Happiness/Reputation.
- **Inflation:** `costMultiplier` rises by decade-based config (with satirical event hooks such as "fuel price jump", "dollar don rise"). Wages scale partly with it so the game doesn't become unwinnable; the *feeling* of squeeze is a feature.
- **Debt:** negative Cash accrues interest (M2: loans, M2 ajo/esusu rotating savings). Bankruptcy-like events at ≤ −₦X trigger forced downgrades, not game over.
- **Family obligation (the "black tax"):** from age 22, relatives periodically ask for money; you can refuse (Reputation/relationship cost) or help (Cash cost, Happiness/Reputation benefit). This is a signature system.

### 3.5 Education
- **Path:** Primary (6–11) → Junior Secondary (12–14) → Senior Secondary (15–17) → *WAEC/JAMB exam gate (Knowledge check + study actions)* → University / Polytechnic / Trade apprenticeship / Straight to work.
- **Exam gates** are skill checks using Knowledge, a study-streak modifier, trait bonuses, and seeded luck. Outcomes: Distinction / Pass / Fail (resit option, costs a year and Happiness).
- **After university (M2):** NYSC (one mandatory service year with posting event chain), then job market.
- School type from background: public / private / federal unity — modifies Knowledge growth, Reputation and fees.

### 3.6 Careers (M1: 5 tracks × 4 levels; M2: +2 tracks; M3: +prestige roles)
| Track | L1 | L2 | L3 | L4 | Key req. |
|---|---|---|---|---|---|
| Trade/Artisan (tailor, mechanic, hair stylist) | Apprentice | Journeyman | Own workshop | Master | Hustle/apprenticeship, low Knowledge OK |
| Civil Service/Teaching | Junior Officer | Officer | Principal Officer | Director | Degree; slow, stable, pension |
| Corporate (bank/telecom) | Graduate Trainee | Analyst | Manager | Executive | Degree + Knowledge ≥ 55 |
| Tech | Junior Dev/Support | Developer | Senior/Lead | CTO / Founder | Knowledge ≥ 60, high variance |
| Creative (music/Nollywood/content) | Hopeful | Gigging | Rising | Star | Charm/Reputation, high variance |

Starting annual salary (₦, tunable): L1 400k–1.2M, L2 1.2–3M, L3 3–8M, L4 8–30M (variance by track). Each track defines: Energy cost, Stress, promotion check (performance score = Knowledge + experience + Reputation + luck), layoff/scandal risk, retirement/pension rule, and 10+ track-specific events.

### 3.7 Relationships
- **NPC relationship meter** (0–100) with a type: Family, Friend, Romantic, Colleague, Rival, Neighbour.
- Actions: Hang out, Call, Gift, Help, Argue, Ask a favour. Meters decay without contact.
- **Romance chain:** crush → dating → (optional) engagement → marriage (traditional and/or white wedding choices with budget trade-offs; asoebi/owambe costs) → possible children. Break-ups, infidelity temptations and reconciliation are event-driven, not UI-driven.
- **Family:** parents, siblings, extended relatives with aging and death. Children (M1: count + cost + Happiness; M2: age-specific events and school choices; M3: heir play).
- Social Reputation modifies how often NPCs offer opportunities and whether gossip events help or hurt.

### 3.8 Traits (choose 2 at creation; M1 ships 14)
Each trait has one clear upside and one downside, both expressed as data modifiers:

| Trait | Upside | Downside |
|---|---|---|
| Hustler | +25% side-hustle income | −10 Happiness cap when idle |
| Bookworm | +Knowledge gain | −Social events success |
| Charmer | +Reputation, romance odds | Cheating-temptation events more frequent |
| Street-Smart | Better scam/danger event outcomes | Lower school discipline checks |
| Devout | +Happiness from community, resilience in crises | Some options morally locked |
| Creative | Bonus in Creative track and mini-games cosmetics | Lower stability in Corporate |
| Athletic | +Health, runner mini-game bonus | Less Knowledge growth early |
| Frugal | −20% living costs | Lower Reputation gains from spending |
| Lucky | +10% on random checks | Fewer "earned it" Reputation gains (success feels less deserved) |
| Anxious | Prepared: warnings before risky choices | −Happiness baseline |
| Foodie | Meals restore extra Energy/Happiness | Higher living costs |
| Owambe Spirit | +Reputation and Happiness from celebrations | Overspends on invitations |
| Night Crawler | Bonus from nightlife/creative events | Less Energy from morning activities |
| Musical | Faster Creativity growth; runner rhythm bonus | Lower Knowledge growth in school |

*Design note:* no trait disables achievements. Traits shape play style only.

### 3.9 Skill checks and randomness
- All randomness uses a **seeded PRNG** (`mulberry32`) stored in the save, so runs are reproducible for testing and bug reports.
- Check formula: `score = stat + traitBonus + itemBonus + d(−15..+15)`; tier by margin vs. difficulty (**Critical Success / Success / Fail / Critical Fail**). Choices show approximate odds ("Risky", "Safe") — never exact percentages by default (SHOULD offer an "Odds visible" accessibility setting).

### 3.10 Playtime Tokens and paywall (business model)
**Owner decision (Q8):** the game is **free for the first 2 hours**, then asks players to **top up to continue**. Daily free tokens keep players coming back, and the stored free balance is capped at **2 hours**.

**Three currencies, kept strictly separate**
| Currency | Source | Use | Purchasable? |
|---|---|---|---|
| **₦ Cash** | Gameplay | In-world spending | Never |
| **Cowries** | Achievements, Legacy Score, quests | Cosmetics, starting perks, unlocks | **Never** (keeps the game free of pay-to-win) |
| **Playtime Tokens** | Welcome grant, daily free refill, top-ups | **Time to play** | **Yes** (only thing for sale) |

**Rules (all values tunable in `monetisation.json`; Q21–Q24 need confirmation)**
1. **Unit:** 1 token = 1 minute of active play. The balance is shown as time remaining ("1h 42m left") in the HUD and Settings.
2. **Welcome grant:** 120 tokens (2 hours) when a new player starts their first life: the "free first 2 hours".
3. **Daily free refill:** +30 tokens at the player's first session each day, **capped so the free balance never exceeds 120 tokens**. (Default: 30/day, Q21.) Free tokens are consumed before purchased tokens.
4. **Top-up:** paid token packs (e.g., 60 / 180 / 600 minutes; pricing Q22) add to a separate **purchased balance** that is **not capped** and **never expires** (Q22).
5. **What counts as play time:** only while the tab is visible and the player has interacted in the last 60 s (menus, events, mini-games, and Focus Days all count; paused, hidden, idle and offline do not).
6. **Running out of tokens never destroys progress.** On reaching 0 the game finishes the current action, **autosaves**, and shows a friendly paywall: *Top up to continue* · *Come back tomorrow for free tokens* (shows time to next refill) · *Browse profile, achievements, Garage* (read-only). A pre-warning appears at 10 and 2 minutes. Never interrupt mid mini-game; let the run finish.
7. **Transparency:** costs are always shown in Naira before payment; no dark patterns (no fake countdowns, no hidden auto-renew; top-ups are one-off).
8. **Payments:** Nigerian-friendly gateway (e.g., Paystack or Flutterwave): card, bank transfer, USSD. Receipts by email; refunds per policy. Payment requires **accounts and a server-side token ledger** because a client-only meter can be trivially bypassed (M2-F27).
9. **Minors:** under-18 players need a parent/guardian-approved payment flow or a gifted-token code (Q23). No personal data collected from minors beyond what payments strictly need.
10. **Anti-abuse:** one welcome grant per account (plus device/fingerprint heuristics); daily refill server-validated; replay and tamper detection on the ledger.
11. **Ethics guardrail:** the free allowance must be enough to finish at least one complete life in M1-sized sessions (~25–35 min) so the player can judge the game before paying; otherwise reduce the lengths of lives, not the allowance.

**Milestone placement**
- **M1 (M1-F26):** client-side token meter, HUD display, low-balance warnings, paywall screen, and a **mock top-up** (no real payments) behind a feature flag so the full loop is playtestable. Playtest builds can set the allowance to unlimited.
- **M2 (M2-F27):** accounts (email/magic link or phone OTP), **server-side token ledger**, real payments (Paystack/Flutterwave), receipts, restore-purchases, and basic fraud checks. Public monetised launch requires this.
- **M3:** bundle offers, gift codes, family/guardian flows, promotions (e.g., Detty December bonus), rewarded actions that grant a few free tokens (SHOULD; Q8).

**Metrics:** day-1 paywall reach rate, paywall→top-up conversion, tokens consumed per session, D7 retention of paying vs. non-paying players, refund rate.

---

## 4. Character creation

### 4.1 Flow (≤ 120 seconds, skippable with "Randomise / Spin")
Order revised after the Lagos Life reference (5.7). One decision per screen, with a progress indicator and Back.
1. **Look:** gender, hairstyle (afro, low cut, cornrows, braids, twists, locs, bun, ponytail, shaved, bald; gele/hijab/cap as outfit options), face shape (4), facial hair (M), skin tone (10 curated swatches), hair colour, outfit type (casual, hoodie, office, chill, owambe, site work, traditional: buba & sokoto, agbada, iro & buba, boubou, kaftan), **fabric** (plain, Ankara, Adire, Aso-oke), top/bottom colours. Live preview with **drag-to-rotate**. School uniform is applied automatically in school.
2. **Personality:** pick **2 of 14 traits** as cards with a witty name and a one-line perk (3.8).
3. **Dream:** pick one big life goal with a measurable target (8.4). Changeable once, at age 18.
4. **Birth Lottery:** a **reveal** of your starting circumstances as a named archetype with explicit perks and constraints (e.g., a small starting loan with weekly repayments but faster skill learning; a comfortable start with family expectations). Sets starting Cash, school type, parental support and debts. **One re-roll** per life; hard starts earn the underdog Cowries bonus, and every achievement stays earnable from any start. Per life vs per account: Q19.
5. **Home:** choose a starting home in your city from 2–3 options tagged *Hard start / Balanced / Big spender* with start cash and rent; a higher tier is shown **locked** ("work your way here"). Lagos only in M1 (Q20).
6. **Heritage & name:** Yoruba · Igbo · Hausa · "Naija Mix" (M1; M3 adds Edo, Ijaw, Efik/Ibibio, Tiv, Kanuri, Fulani, etc.) affecting name pools, food/event flavour and family events; first name (pool suggestions, free text with profanity filter), nickname (optional).
7. **Confirm & start:** a "your story begins" intro card.

### 4.2 Gender
- Options: **Male, Female** (owner decision, Q5). Pronouns he/she stored on the character. All narrative strings use template tokens (`{they}`, `{their}`, `{them}` resolve to he/she, his/her, him/her) via a pronoun helper — never hard-coded, so more options can be added later without content rewrites.
- Gender affects *cultural expectation events* (e.g., pressure to marry, career bias events) with humour and agency — **never** locks careers, stats, or achievements.

### 4.3 Avatar technical approach
- **Layered 2D sprites** composited in a single `<Avatar>` component (SVG/PNG layers: body, head, hair-back, face, hair-front, outfit, accessory). Tinting via CSS/Canvas for skin tone. The same `AvatarConfig` drives a simple procedural low-poly 3D character (skin tint, hair mesh, outfit colours) in the runner and, from M2, the world.
- Aging: 5 life-stage variants of body/face proportion (child, teen, adult, mid-age, elder) with grey-hair overlay and wrinkle layer. (M1 MAY ship with 3 stages.)

---

## 5. World design

### 5.1 Principles
- A **City Pack** is a data bundle: districts, locations, NPC archetypes, name pools, events, cost-of-living, music palette, slang glossary. Lagos is City Pack #1. Adding a city = adding a folder of JSON + art, not code (Section 14.2).
- **Authenticity process:** every City Pack is built from the cultural bible (16.3), reviewed by the owner during playtests (Q10), and checked against the sensitivity checklist (Section 16).

### 5.2 Lagos City Pack (v1)
| District | Role in the game |
|---|---|
| **Surulere** (default family home, middle-class mainland) | Compound life, neighbours, football pitch, local market, secondary school |
| **Yaba / Akoka** | University, tech scene, cyber café → co-working, bookshops, student housing |
| **Lagos Island (Balogun / CBD)** | Markets, banks, offices, trade, Balogun haggling mini-game (M2) |
| **Lekki / VI** | Wealth tier, corporate offices, nightlife, beaches, "baller" lifestyle |
| **Ikorodu / Ajegunle** | Struggling-start home district, strong community, hustle-heavy events |
| **Oshodi / Mushin** | Transit hub, danfo terminals, runner mini-game stage, street hustle |
| **Ikeja** (M2) | Airport, civil service offices, Computer Village, Allen Avenue |
| **Badagry / Epe** (M3 day-trips) | Heritage and village-return events |

**Location types (reusable):** Home · Compound/Street · School · Market · Danfo Stop/BRT · Mama Put (buka) · Football Pitch · Place of Worship (church/mosque/other; faith choice is optional and neutral by default) · Hospital/Clinic · Bank/POS Kiosk · Office/Workshop · Lounge/Club · Beach · Cyber Café/Co-working · Salon/Barbershop · Event Centre (owambe).

### 5.3 World presentation by milestone
- **M1:** each location is a **scene card** — a static illustrated background with tappable hotspots (activities) and NPC portraits. Navigation = a district menu. Cheap to build, still feels like a place.
- **M2:** an **explorable third-person 3D low-poly district** (Three.js, procedural geometry, same art language as the runner; see 5.6): walk (tap-to-move / virtual stick / WASD), tap places and people for contextual panels, enter buildings (scene cards or short interior scenes), talk to NPCs, find collectibles. Moving between districts costs Cash (transport) and Energy and triggers "go-slow" micro-events. **Lite mode** (M1-style scene cards) stays available for low-end devices.
- **M3:** multi-city travel (Lagos ↔ Abuja ↔ Delta ↔ Akwa Ibom…), seasons/festivals shown on the map (Harmattan haze, rainy-season flooding, Detty December crowds).

### 5.4 NPCs
- **NPC archetypes (data):** Mama Put, Danfo conductor ("Oya enter!"), Neighbour Aunty, Strict Teacher, Best Friend, Frenemy, Oga Boss, Landlord, Area Boy (portrayed with nuance), Pastor/Imam/Elder (respectful), Market Mama, Tech Bro, Uncle from the Village, Fine Girl/Guy Next Door.
- **Named persistent NPCs** are generated per run (family, best friends, partners, rivals, bosses) from name pools + trait tags; they age, move, marry, die, and recur in events.
- NPC data: `id, name, gender, archetype, ageBorn, traits[], portraitLayers, relationshipToPlayer, meters, flags, alive`.

### 5.5 Culture & humour content pillars (event seeds)
NEPA/PHCN "light don go" and generators · fuel queues and go-slow · JAMB/WAEC nerves · school "sir, I was sleeping" · owambe & asoebi pressure · jollof wars · mama's guilt-trip calls · "when are you getting married?" · POS charges and network failures · NYSC camp & posting · Detty December · Harmattan · "japa" dream and visa interview · cousin who needs "small something" · landlord's rent hike · Nollywood auditions · Afrobeats gig · generator vs. solar upgrade · airtime vs. data bundles · market haggling · wedding negotiations (handled respectfully) · church/mosque/community events · naming ceremony · burial/memorial traditions · village return trip.

Sensitive topics (scams, police, religion, politics) follow the rules in Section 16.

### 5.6 Lessons from the Campus Life reference (campuslife.cubbes.app)
Observed in the recording (a third-person, low-poly 3D walk-around of a real Lagos university campus):

| Observed | What we do with it |
|---|---|
| Third-person 3D walk-around of a campus; roads, hostels, lecture halls, trees; ambient students with speech bubbles ("Shuuu, queue don long") | M2 explorable districts (M2-F01) in the same low-poly language as the runner; ambient NPC chatter lines are data (`ambientLines`) |
| Persistent HUD: profile chip ("Fresher · Visiting …"), **Energy**, **Vibe** (mood), **Pocket money (₦)**, a **Found X/N** counter (places discovered), time-of-day chip (Morning, 11:24 AM), minimap | Our stats map directly: Energy, Happiness (surfaced as **Vibe** in copy), Cash (**Pocket money** for under-18s), plus a **time-of-day chip** in Focus Days and a minimap in M2. The **Found 8/27** counter is a *places-discovered* tracker (tooltip: "Places you've found on this campus. Walk around, or use Places under the minimap."). We adopt it as the **Places Found** counter per district/city, which also drives exploration rewards and achievements. Other tooltips worth copying: Energy ("sleep, eat, or hang around and rest; lectures, sports and hustles use it up") and Pocket money ("Enrol to find out your family's budget and monthly allowance") |
| Left menu: Explore · Campus tour · People & events · Become a student | M2 side menu: Explore · Tour · People & Events · Quests |
| Discovery toasts ("Found Jaja & Moremi Halls"), place signs | **Place discovery** log (M2); first visit grants small Reputation/Knowledge/Cowries |
| "Talk to Femi — *New face*" proximity prompts | NPC proximity prompts with a *New face* tag until met; tied to relationship meters |
| **Contextual "next thing to do" card** ("Sit in on a real lecture… Go") | **Suggested-next-action** card driven by quests and location; always dismissible |
| Bottom shortcuts: Tour · Map · Main Gate · **Wait** | Fast travel (Map, Home/Main Gate), guided Tour, and **Wait** (advance time / recover Energy) |
| Place panel: "Arts Theatre — *Front row for the serious, back row for the network*", "4 people you can meet", live class card ("Dr. Ghost · CSC 101 — *Class may or may not hold*" · LIVE), action rows with costs/benefits ("Sit in on CSC 101: −6 Energy, +2 Vibe") | **Place panel** pattern for every location: witty one-liner, who is here, live events, and action rows with **Energy cost and stat-benefit chips** (generalises M1 activity cards) |
| **Lecturer card** with quirk and favourite quote, *Enter class / Not now* | NPC intro cards for recurring characters (lecturer, boss, landlord, auntie) with a catchphrase |
| In-class 3D scene; lecturer picks you mid-lecture with a question; funny feedback tied to relationships ("Correct! A few people actually clapped. +4 relationship"); **Class over**; **after-class revision quiz** | **Pop-quiz mechanic** (M1 text version, M2 in-scene): study draws 1–3 questions from a bank; correct answers raise Knowledge and sometimes relationships/Reputation; wrong answers are funny, not punishing |

**Design decisions taken from this reference**
1. **Focus Days (M2-F21).** The macro unit stays the year, but key moments (first day at university, first day at a job, owambe, market day, NYSC camp) play as **day-scale vignettes** in the 3D world with a clock. A Focus Day spends part of that year's Energy and then rejoins the normal year loop, giving campus-style moment-to-moment play without simulating 80 years day by day.
2. **One renderer.** Both references are low-poly 3D, so the runner and the world share one lazy-loaded Three.js module. The M1 scene-card UI doubles as **Lite mode** on low-end devices.
3. **Place panels everywhere** (scene cards in M1, 3D world in M2) so the UI grammar is learned once.
4. **University campus pack (M2-F24).** A **real-Nigeria-grounded** campus (Q18: real institution, hall and place names, original art and fictional people) with live classes, quirky lecturers, hostel life, societies, exam weeks, a JAMB-to-admission storyline and NYSC follow-on.
5. **Profile screen and tiers.** The campus profile (About me · Personality · My look · Badges · Belongings · My space · Goals, with Projected GPA, Reputation tier "2 · Unknown", Study streak, Style points) is a template for our M2-F19 screen. Social Reputation (0–100) gets **named tiers** (Unknown → Known → Respected → Big Name → Legend) so the number has meaning.
6. **Visitor → Enrol onboarding.** The reference lets you explore as a *Campus visitor* and "Become a student" to reveal your family budget and allowance. We use the same try-before-you-commit idea: the M1 tutorial can start with a short guided visit (a Lagos street or school gate) before character creation, and the family tier is *revealed* at the start of the story.
7. **Ambient wit.** Speech bubbles such as "Sapa is real", "2001 or SUB?", "Omo, this sun!" are tone-setting lines; ≥ 60 ambient lines per location type in M2.
8. **Contextual shortcut buttons** change with the place (Main Gate vs Lecture Hall), and the HUD shows a **"12 online"** presence badge, which we do **not** adopt (no multiplayer in v1–v3, see Q17).
9. **Humour through specificity.** Place blurbs, lecturer quirks and ambient lines are the most shareable content; budget writing time for them.

### 5.7 Lessons from the Lagos Life reference (lagoslife.app)
Observed in the recording (a multi-step creation flow, then an isometric 3D home with a bottom nav of Home · Buy · Map · Phone):

| Observed | What we do with it |
|---|---|
| **Look step:** Woman/Man; hairstyles (Braids, Afro, Bun, Ponytail, Long, Locs, Low-cut, Gele, Classic); outfits (Casual, Hoodie, Office, Chill, **Owambe**, **Site work**); **fabric** (Plain, **Ankara**, **Adire**, **Aso-oke**); skin-tone, hair, top and bottom colour swatches; "Drag to spin" 3D preview | Adopt in 4.1: outfit type × fabric × colour, drag-to-rotate preview. Our fabrics list and outfit types follow suit; art is original |
| **Personality step:** "Choose 2 traits" from cards (Hustler, Foodie, Owambe Spirit, Gym Rat, Smooth Talker, Lazy Bone, Clean Pikin, Night Crawler, Tech Bro/Sis, Musical…) each with a one-line perk | Matches our 2-of-10 traits (3.8). Adopt the **card format with a one-line perk and a witty name**; add Foodie, Owambe Spirit, Night Crawler, Musical to the trait pool |
| **Dream step:** pick a big life goal (Oga at the Top, Lekki Landlord, Afrobeats Star, Everybody's Padi, Yaba Unicorn), each with a measurable target | Adopt as **Dreams** (new, 8.5): a chosen life goal with progress tracking that feeds quests, the ending and the Legacy Score. Our own names and targets |
| **Birth lottery:** a reveal of your starting circumstances as a named archetype ("LAPO Baby! Self-made hits different"), with a starting loan, weekly repayment, perks (skill starts at 2, learn skills 25% faster) and trade-offs; "Drag to spin"; decided once per account | Adopt as **Birth Lottery** (4.1 step 3), replacing the plain family-tier picker: named archetypes with explicit perks and constraints, an excited reveal, and limited re-rolls. Per life vs per account is Q19 |
| **Home step:** choose city (Abuja/Lagos/PH) and a home with start cash and **weekly rent** ("Single room · Kubwa, Hard start, start with ₦76,000, rent ₦2,800/wk" ; "Mini flat · Gwarinpa, Balanced" ; "Serviced apartment · Wuse 2" locked: *work your way here*) | Adopt a **Home pick** with difficulty tags (Hard start / Balanced / Big spender), start cash and rent, and **locked aspirational tiers** shown but unavailable ("work your way here"). Starting city stays Lagos in M1 (Q20) |
| **Isometric 3D home** (cutaway room), avatar with small need bars, **bottom nav: Home · Buy · Map · Phone** | Adopt as **My Space** (M2-F25) and the M2 navigation shell (Home · Buy · Map · Phone) |
| **Buy mode / Catalogue:** category tabs (Design, Sleep, Kitchen, Bath, Comfort, Fun, Skills, Light), priced items (plastic chair ₦500, standing fan ₦2,200, velvet sofa, dining table, bean bag), place furniture in the room; wish chips ("Buy something for the house +2 …") | Adopt for housing (M2-F08/F25): items have a price, a comfort/skill effect and a wish/need tie-in; furniture placement on a grid |
| **Top bar:** "Sat 10 · 10:44 AM", mood chip (*Happy*), wallet (₦1,090,000) with **+** button, **"74k online"** | Day/time + mood chip in Focus Days; wallet in HUD. The **+** (top-up) and "online" presence are **not adopted** (Q8, Q17) |
| **Quest chips:** "Eat something: tap the cooker", "Daily gem hunt: find gems, ₦3,000" | Contextual starter chips ("Eat something", "Daily hunt") and a **daily collectible hunt** in the 3D world paying coins (M2) |
| **Ledger toasts with personality:** "Rent paid: ₦6,000. Baba Landlord is smiling." | Adopt: every automatic money event gets a **flavoured one-line toast** (rent, black tax, salary, POS charges) |
| **Owambe Invitation event** (3 choices with cost and status): *Buy aso-ebi & go (₦1,500)* · *Go & spray money BIG (₦5,000, "legendary status")* · *Not today (stay home)* | Matches our event model exactly; added as a worked example in 6.2 |
| **Live announcement cards** from the team ("The Election for CBN Governor is now open! You can now go to the polls…") and a gift/compensation toast | Live-ops announcement card type (M3-F14). Civic/election events are allowed only as **fictionalised satire** (see Q11 and Section 16) |
| **Phone** menu | **Phone** (M2): contacts, messages, wallet/bank (balance, loans, ajo), jobs board, map |

**Design decisions taken from this reference**
1. **Creation becomes a story, not a form.** Order: Look → Personality (2 traits) → **Dream** → **Birth Lottery** → **Home** → Name/Confirm. Each step is one screen; a Randomise/Spin shortcut skips to Start (see 4.1).
2. **Dreams give runs a purpose** and make endings interpretable ("You chased *Big Oga* and caught *Everybody's Padi*").
3. **Honest constraints as flavour.** Perks and trade-offs are stated in one witty line each, not hidden numbers.
4. **Own names, own wording.** Dream names, archetype names and copy are original so we inspire without cloning.

---

## 6. Events and branching narrative

### 6.1 Event engine requirements
- **Weighted eligibility pool.** Each year the engine filters events by `conditions`, applies cooldowns/once-only rules, then draws by `weight` with a seeded RNG, targeting 1–3 events.
- **Scripted milestones** (exam, graduation, retirement) are `priority: "scripted"` and always fire at their trigger.
- **Follow-ups:** a choice may enqueue a follow-up event after N years (e.g., "bribed the teacher" → investigation 2 years later).
- **Flags:** global boolean/number/string flags (`hasDegree`, `marriedTo`, `owesUncleMoney`) used by conditions.
- **Templating:** `{name}`, `{they}`, `{friend.name}`, `{city}`, `{cash}`; glossary terms (`[[owambe]]`) render with tap-to-define tooltips.
- **Consequence log:** each applied effect writes `{year, eventId, choiceId, effects, reason}` to `state.log` (feeds year summary + obituary).

### 6.2 Content authoring format (YAML or JSON, validated by Zod)

```yaml
id: evt_nepa_exam_night
title: "NEPA took light"
stage: [teen]
weight: 6
cooldownYears: 3
once: false
conditions:
  all:
    - { ageBetween: [14, 17] }
    - { flagAbsent: "hasGeneratorFamily" }
    - { inSchool: true }
text: |
  It's the night before your mock exams and the whole street goes dark.
  {Their} candle is almost finished. Mama is already saying "Chineke!" (or the equivalent in your house).
choices:
  - id: study_candle
    label: "Study by candlelight"
    cost: { energy: 15 }
    check: { stat: knowledge, difficulty: 45, luck: true }
    outcomes:
      critSuccess: { effects: [{ knowledge: +4 }, { happiness: +3 }], text: "You remember everything. Teacher is shocked." }
      success:     { effects: [{ knowledge: +2 }] }
      fail:        { effects: [{ knowledge: -1 }, { health: -2 }], text: "Candle wax, tears, and nothing in your head." }
  - id: sleep_early
    label: "Sleep. God will provide."
    effects: [{ energy: +10 }, { knowledge: -2 }, { happiness: +2 }]
  - id: borrow_neighbour_gen
    label: "Beg Mr Sule next door for generator light"
    requires: { reputationAtLeast: 30 }
    effects: [{ reputation: +1 }, { relationship: { npc: "neighbour", delta: +5 } }, { knowledge: +2 }]
```

**Second worked example (inspired by an owambe invitation in the Lagos Life reference; original wording):**

```yaml
id: evt_owambe_invite
title: "Owambe invitation"
stage: [youngAdult, adult]
weight: 7
cooldownYears: 2
conditions: { all: [ { reputationAtLeast: 20 } ] }
text: |
  {friend.name}'s cousin is getting married on Saturday. Aso-ebi is already in the family WhatsApp group.
  Rice, suya, live band, and an MC who will not let you sit down.
choices:
  - id: buy_asoebi_go
    label: "Buy the aso-ebi and go"
    cost: { cash: 1500 }
    riskLabel: safe
    effects: [{ happiness: +4 }, { reputation: +2 }, { relationship: { npc: "friend", delta: +6 } }]
  - id: spray_big
    label: "Go and spray money like a boss"
    cost: { cash: 5000 }
    riskLabel: gamble
    outcomes:
      success: { effects: [{ reputation: +8 }, { flag: { set: "legendarySprayer" } }], text: "The MC calls your name three times. Legendary." }
      fail:    { effects: [{ reputation: -1 }, { happiness: -2 }], text: "You spray everything and still end up behind the speakers." }
  - id: not_today
    label: "Not today, sapa is real"
    effects: [{ energy: +8 }, { relationship: { npc: "friend", delta: -2 } }]
```

### 6.3 Content volume targets
| Milestone | Events | Unique choices | Endings | Notes |
|---|---|---|---|---|
| M1 | ≥ 90 (≈ 15 per life stage + 5 scripted milestones/stage) | ≥ 250 | 8 | Each life shows ~50–70 events; repeat rate < 30% across 3 consecutive lives |
| M2 | ≥ 220 | ≥ 650 | 14 | Plus 12 quest chains, 40 NPC-specific events |
| M3 | ≥ 400 | ≥ 1,200 | 24 | Plus city-specific packs, generational events |

### 6.4 Authoring guardrails (enforced by a content linter in CI)
- Every referenced flag, item, NPC archetype and event id must exist.
- No event with a choice that produces *only* strictly-positive outcomes unless explicitly tagged `freebie`.
- Every event has ≥ 2 choices unless tagged `narration`.
- String length caps for mobile readability (title ≤ 40 chars, body ≤ 420 chars, choice label ≤ 60).
- Detect unreachable events and dead-end follow-up chains.

---

## 7. Mini-games

### 7.1 Go-Slow Dash (endless runner) — M1 flagship

> **Revised after reviewing a screen recording of danfo.horpey.dev ("Danfo Run").** That game is a **3D, behind-the-vehicle, multi-lane runner**: you *drive* a yellow danfo down real Lagos corridors (Oshodi, Ojuelegba under the flyover, a Mortala Mohammed Way-style road, BRT lane), with low-poly/voxel buildings, market umbrellas and pedestrians. Our original 2D side-scroller spec is replaced by the design below, which keeps the brief's *running, jumping, obstacle avoidance, coin collection* and adopts what made the reference compelling. **We take inspiration, not assets, names, copy, or layouts** (our title is deliberately different; all art, text and audio are original).

**Observed in the reference (design inputs)**
| Observed | What we do with it |
|---|---|
| Third-person behind-view, 3–5 lanes, vehicle auto-advances, km/h readout (~70–125 km/h, speed ramps up) | Behind-view lane runner; speed ramp; speed shown as a HUD element |
| Route is a real corridor split into **named stops** ("Next stop: Ojuelegba, 165 m"), segment progress bar at top | Each run follows a **Route** (data file) of named Lagos segments with a progress bar and "next stop" card |
| **Passengers:** "Kerb lane → to load", "Brake to load!", "Oya! Ojuelegba dey here! (2 to drop)"; fares earned in ₦; "22 passengers" on results | Stop events are the **core scoring loop**: steer to the kerb lane and brake to load; drop at destination for fares |
| **Close calls** (near-misses) tracked per run | Near-miss detection gives combo score and feeds missions |
| Coins counter, collectibles (₦ coins), power-ups: **Magnet**, **Super Hop**, **Score** boost | Same trio, re-themed (below) |
| Per-run **missions** ("Stay fast ×1.5 for 12 s", "5 close calls in one run", "Earn ₦180 in fares") with ₦ rewards, shown in the pause menu | 3 missions per run, rewarded in coins and Cowries |
| **Daily streak** (7-day tracker), **Leaderboard**, **Garage** (vehicle cosmetics), **Share**, updates link | Streak + Garage in M1/M2; leaderboard in M3; share card in M1 |
| Result screen: **"WAHALA!"** headline, big score, "New best!", stat ticket (coins, km, passengers, close calls), Go Again CTA | Same flow with our own copy ("Wahala dey! / Oga, you try!") and a *Go Again* primary button |
| Dense Lagos set dressing (BRT lane, flyovers, kiosks, billboards, umbrellas), warm dusk palette, motion blur at speed | Procedural low-poly set dressing, warm palette, speed lines |

**Game modes (one engine, two "avatars"). The mode is chosen by life context, not from a menu; both ship in M1 (Q16).**
- **Context mapping:** school run, late for class, chasing the bus, escaping a chase, market dash, exam-day sprint → **On Foot**. Commuting to work, danfo conductor/driver hustle, delivery/ride-hailing job, going to an interview or owambe across town → **Danfo** (or a vehicle skin: okada, car, BRT). Events and activities declare `miniGame: { id: 'go-slow-dash', mode: 'foot' | 'danfo', route }`, so the story decides which version appears.
- **On Foot (Child/Teen/early Young Adult):** your character runs the lanes — **swipe/arrow left-right to change lane, up = jump, down = slide**; dodge potholes, goats, wheelbarrows, okada, puddles; chase the school bus / beat the bell / catch the danfo. Coins (₦) and power-ups on the path.
- **Danfo (any stage where the story puts you on the road: commute, conductor/driver hustle, delivery job; owning a bus in M2):** drive the danfo — **lane change, brake, horn**; load/drop passengers at stops for fares; avoid traffic, okada, potholes, and the occasional LASTMA-style checkpoint (fictionalised). Jump is replaced by a "hop" power-up (Super Hop).
- Both modes share the same lane/obstacle/coin/power-up/mission/route logic; only the player controller and obstacle sets differ.

**Core mechanics (both modes)**
- **Lanes:** 3 lanes in M1 (4–5 optional in Danfo mode, M2). Lane switching is snap-with-ease (≈120 ms); input is buffered for 100 ms.
- **Speed:** starts at 60 "km/h" equivalent, rises smoothly to a cap (≈ 125) over ~90 s; speed bands change music layer and set-dressing density. "Stay fast" mission = holding ≥ 90% of cap.
- **Obstacles** (spawned from weighted, hand-authored **patterns**; never impossible — the *fairness rule* below): pothole, goat, okada, wheelbarrow, traffic cone cluster, stalled danfo, low signboard (slide/steer), floodwater (long hop), BRT-lane barrier (can't enter).
- **Hits:** 3 hearts (On Foot) or 3 "scratches" (Danfo); 1 s invulnerability after a hit; zero ends the run. (Reference-style instant-crash is a future "Hard" toggle.)
- **Collectibles & power-ups (one active at a time, 5 s default):** ₦ coins (₦50 base; gold ₦200, rare); **Magnet** (pulls coins); **Super Hop** (extended jump/hop over obstacles); **Suya Boost** (score ×2 + invulnerability). Jollof shield is cut to keep the trio aligned with the reference feel.
- **Close calls:** passing within ~0.6 lane-widths of an obstacle without a hit grants +25 score and a combo tick (combo decays after 3 s).
- **Stops & passengers (Danfo mode; On Foot uses "pick-up points" for friends/classmates for bonus Happiness):** a stop appears 150 m ahead with a kerb-lane marker and call-out ("Oya! Ojuelegba!"). Slow below 30 km/h inside the zone for ≥ 1 s to load; fares paid on drop at the destination stop. Missing a stop costs nothing but forgoes fare.
- **Missions:** each run draws 3 from a pool (distance, close calls, fares, coins, stay-fast, no-hit stretch); completing grants coins/Cowries; the daily streak adds a bonus.
- **Fairness rule:** the pattern generator guarantees that, for every obstacle sequence at the current speed, at least one lane/action path is solvable with ≥ 250 ms reaction margin (unit-tested by a headless solver).
- **Scoring:** `distance + coins*10 + fares*5 + closeCalls*25 + stopBonuses`, with combo multiplier up to ×3. Stored as **personal best per character and lifetime**.

**Routes (data, expandable per city pack)**
`Route { id, cityId, segments: [{ name, lengthM, ambience, setDressingTags[], stops[] }] }`. M1 ships 2 Lagos routes (e.g., Oshodi → Mushin → Ojuelegba, and Yaba → Surulere) ≈ 8–10 segments each, 90–150 s per run before looping at higher speed. M2+ routes per district; M3 per city (Abuja ring roads, Port Harcourt waterfront, etc.).

**Integration with the life sim**
- Costs 10 Energy to play. Rewards: coins → Cash (`coinToCash` and per-year cash-out cap as in 3.2); fares count as Cash in Danfo mode (same cap); distance → Health/Happiness (+1 per 400 m, max +4); close calls/streak feed Reputation events; Athletic trait grants lane-switch easing and +1 heart.
- Cosmetics via **Garage** (danfo liveries/slogans — the funny painted bus slogans are a content opportunity; runner outfits reuse the avatar), unlocked with Cowries.
- Daily streak and missions are meta-profile features; they never gate life-sim progress.

**Rendering approach (decision for the T18 spike; recommendation below)**
- **Recommended:** **Three.js** (tree-shaken, lazy-loaded), **procedural low-poly/voxel geometry** (instanced boxes + flat/vertex colours; no texture-heavy assets). This matches the reference's look, keeps the mini-game's asset payload tiny (~< 1 MB incl. audio), and is feasible on mid-range Android if draw calls ≤ ~150, instancing is used, shadows are baked/fake, and pixel ratio is capped (≤ 1.5) with an automatic **quality governor** (drops effects/resolution when FPS < 45 for 2 s).
- **Fallback if the spike misses 55 FPS on the reference device:** a Canvas 2D pseudo-3D renderer (scaled sprites along a road projection) using the **same simulation logic**. The runner **simulation is a pure TypeScript module** (lanes, patterns, speed, collisions, scoring, missions) with no rendering imports, so the renderer is swappable and the sim is unit-testable and replayable from `seed + inputLog` (needed for M3 leaderboard validation).
- The M2 explorable world reuses the same Three.js chunk, materials and low-poly kit, so the 3D renderer is paid for once (see 5.6). Phaser is **no longer in the stack**.

**Controls & accessibility**
- Touch: swipe left/right (lane), up (jump/hop), down (slide/brake), tap-hold to brake at stops; on-screen buttons alternative. Keyboard: ←/→, ↑, ↓, Space = horn. Gamepad MAY.
- **Assist mode:** slower speed cap, wider hit-forgiveness (hitbox −20%), auto-brake at stops. **Reduced motion:** disables camera shake/motion blur/speed lines. All HUD info has non-colour cues; captions for audio cues (horn, "Oya!").

**Performance & quality targets:** ≥ 55 FPS on a Tecno Spark/Infinix Hot-class Android in Chrome; ≤ 150 draw calls; initial load of the mini-game chunk ≤ 350 KB gz (Three.js tree-shaken + sim + HUD); memory ≤ 250 MB; object pooling for obstacles/coins/pedestrians; fixed-timestep simulation at 60 Hz independent of render rate.

**Acceptance (in addition to AC-M1-06):** lane/jump/slide inputs respond within 100 ms; a headless solver clears 10,000 generated patterns with zero unsolvable sequences; replaying a recorded `seed + inputLog` reproduces the same score; missions, streak and cash-out cap behave per spec; the result screen shows score, coins, km, passengers/fares, close calls and a *Go Again* button.

### 7.2 Further mini-games (M2/M3)
- **M2 — Balogun Haggle:** timing/slider bargaining mini-game that affects trade profit.
- **M2 — Oya Oya (danfo conductor call-outs):** quick tap-the-right-stop memory/reaction game; income for the "conductor" job and street-smart bonus.
- **M3 — Whot!** (popular card game) vs. NPCs for Cash/Reputation; **Ayo** (mancala) as a low-stakes strategy game.
- All mini-games implement a common `MiniGame` interface (Section 12.4) so new ones plug in without touching life-sim code.

---

## 8. Progression, quests, achievements, items

### 8.1 Quests
- **Quest** = id, title, stages, conditions, rewards, tracker text. Types: *Life Goals* (graduate, get first job, own a home), *NPC Quests* (help your friend plan a wedding), *City Quests* (M2), *Challenge Quests* (finish a runner at 1000 m).
- M1: 8 quests (simple, 2–3 steps). M2: 30 incl. branching chains. M3: 60 incl. cross-city and generational quests.
- Quest log accessible from the HUD; at most 3 pinned.

### 8.2 Achievements
- Persistent across lives (stored in the **MetaProfile**). Examples: *First Class Honours*, *Oga At The Top*, *Debt Free*, *Japa'd* (M3), *Mama's Favourite*, *Serial Entrepreneur*, *Jollof Judge*, *1,000m Go-Slow Dash*, *Never Missed a Sunday*, *Survived Harmattan*, *Married Twice*.
- Tiers: Bronze/Silver/Gold where it makes sense. M1: 25, M2: 60, M3: 100+. Some are **hidden** until unlocked.
- Rewards: Cowries, titles, cosmetic unlocks. Toast notification on unlock; Achievements screen shows progress.

### 8.3 Items
- **Categories:** Clothing/cosmetics (avatar), Gadgets (phone, laptop → job bonuses), Home upgrades (generator → inverter/solar), Vehicles (M2: bicycle, okada, car), Food/consumables (one-time buffs), Collectibles (trophies, photos).
- **Storage:** inventory with slots (M2); in M1 items are *flags with effects* (no inventory UI) — a simple "Owned" list.
- **Unlockables with Cowries:** extra clothing, hairstyles, runner skins, starting perks (+₦ start money, +1 Energy cap for first 5 years, "Big Family" with a stronger safety net), new backgrounds (M2+) and cities (M3).

### 8.4 Dreams (chosen at creation)
A **Dream** is a measurable long-term goal that shapes quests, event odds and the ending. Progress is shown on the profile and in the obituary; achieving it adds to the Legacy Score and grants Cowries. Names and targets below are our own (inspired by the Lagos Life reference):

| Dream | Target (tunable) | Typical path |
|---|---|---|
| **Big Oga** | Reach career level 4 in any track | Education + steady promotions |
| **Property Owner** | Own a home and reach net worth ₦X | Saving, business, investments (M2+) |
| **Entertainment Star** | Creative track level 4 or Creativity skill 10 | Music/Nollywood/content path |
| **Everybody's Padi** | Hold 4 relationships ≥ 80 closeness | Social investment, hosting, helping |
| **Unicorn Founder** | Build a business valued above ₦X or get a startup funded | Tech/startup path (M2 businesses) |
| **Scholar** | Highest degree + Knowledge ≥ 90 | Education path |
| **Family Pillar** | Support all dependants through school and see grandchildren (M3) | Family path |
| **Japa Dreamer** (M3) | Emigrate and sustain a household abroad | Visa/relocation branch |

M1 ships the first five; Dreams can be changed once at age 18. All five must be completable by bots in the sim harness to avoid dead-end goals.

### 8.5 Legacy Score (end of life)
`legacy = wealthTier*20 + happinessAvg*0.3 + knowledge*0.2 + reputation*0.3 + relationshipsScore + achievementsThisLife*5 + underdogBonus`. Converted to Cowries (`floor(legacy / 10)`). Tunable in config.

---

## 9. Milestones

The three milestones are **vertical slices**: each is playable end-to-end, deployable, and builds on the previous. Do not start a milestone until the previous one's Definition of Done is met.

### 9.0 Technical Foundations (Sprint 0, before M1 features)
Part of M1 but listed first so agents do it in order.

- `M1-F00` Repo bootstrap: Vite + React + TypeScript (strict), ESLint, Prettier, Vitest, Playwright, GitHub Actions (lint, typecheck, test, build, deploy preview), Tailwind, path aliases.
- `M1-F00b` Folder layout from Section 12.2; engine package has **no** React/Three.js imports (enforced via ESLint `no-restricted-imports`).
- `M1-F00c` Content pipeline: schemas (Zod), loader, linter script `npm run content:lint`.
- `M1-F00d` Seeded RNG, save/load with versioned schema + migration stub.
- `M1-F00e` Deployed hello-world to production URL (so deployment is never the last step).

---

### Milestone 1 — "Ìbẹ̀rẹ̀" (The Beginning): Basic Playable Life Simulation
**Goal:** a complete, fun, replayable life from age 6 to ending in ~20–35 minutes, menu-driven with illustrated scenes, one polished mini-game, and shareable endings.

**In scope (MUST unless noted)**

| ID | Feature | Details |
|---|---|---|
| M1-F01 | Title screen & main menu | New Life, Continue, Achievements, Settings, About/Credits |
| M1-F02 | Character creation | Per Section 4.1: Look (incl. fabric and drag-to-rotate preview), 2 of 14 traits, Dream (5 goals), Birth Lottery (6 archetypes, 1 re-roll), Home pick, heritage/name, Randomise/Spin |
| M1-F03 | Core engine | Yearly loop, stats, Energy, seeded RNG, state reducer, undo-free (no save-scumming: autosave each year; SHOULD allow "Resume from last year" only) |
| M1-F04 | HUD | Name/age/stage, 5 stats with deltas, Energy bar, year counter, quick access to Quests/Achievements/Settings |
| M1-F05 | Activity system | ≥ 12 activities with stage gating (study, play, chores, work, hustle, socialise, rest, exercise, worship/community, mini-game, shop, family time) |
| M1-F06 | Scene cards | 8 illustrated locations (Home, Compound, School, Market, Danfo Stop, Mama Put, Office/Workshop, Event Centre) in Surulere/Yaba/Oshodi style; district switching minimal |
| M1-F07 | Education path | Primary → Secondary → exam gate → University/Poly/Trade/Work; exam skill check; fee costs; resit |
| M1-F08 | Careers | 5 tracks × 4 levels (Section 3.6), job search, promotion check, firing/layoff, retirement; 10 events per track (≥ 50 total across careers, may be shared in generic pool) |
| M1-F09 | Money | Yearly settlement, living cost, lifestyle toggle, debt flag, family-obligation requests, simple savings |
| M1-F10 | Relationships (basic) | Parents, 1–2 siblings, 2 friends, 1 romantic partner at a time, marriage, children as count; meters, hang-out/call/gift, break-up/death events |
| M1-F11 | Events | ≥ 90 events, 250 choices (Section 6.3), follow-ups, flags, templating, glossary tooltips for Nigerian terms |
| M1-F12 | Mini-game: Go-Slow Dash (both modes) | Per Section 7.1: 3-lane behind-view runner with **On Foot** and **Danfo-driving** modes, **chosen by life context** (see 7.1), 2 Lagos routes, 3 power-ups, close calls, 3 missions/run, daily streak, result screen. Built in two steps: F12a On Foot, then F12b Danfo mode on the same engine |
| M1-F13 | Coins | Mini-game coins → Cash; coin pickup/HUD animation; per-year cap |
| M1-F14 | Quests | 8 starter quests, tracker, rewards |
| M1-F15 | Achievements | 25 achievements, MetaProfile persistence, toast + screen |
| M1-F16 | Cowries & unlocks (light) | Cowries earned at the end of each life; unlock 10 cosmetics / 3 starting perks |
| M1-F17 | Ending & Legacy | 8 ending archetypes, obituary generator, top moments, Legacy Score, share card (PNG via canvas; copy-to-clipboard + Web Share API) |
| M1-F18 | Save/Load | Autosave per year to IndexedDB/localStorage; 1 active life + MetaProfile; export/import JSON file |
| M1-F19 | Settings | Sound/music toggle & volume, text speed, reduced motion, language: English (+ Pidgin flavour lines flagged as content, not full i18n) |
| M1-F20 | Audio | Original/royalty-free Afrobeats-inspired loops (menu, play, mini-game), 10 UI/game SFX |
| M1-F21 | Tutorial | 90-second first-run guided first year (skippable) |
| M1-F22 | Accessibility baseline | Colour contrast AA, keyboard navigable, tap targets ≥ 44px, scalable text |
| M1-F23 | Analytics (privacy-light, consent) | Anonymous funnel events: `life_started`, `stage_reached`, `life_ended` (cause), `minigame_played` |
| M1-F26 | Playtime Tokens (client-side) | Token meter per 3.10: welcome grant, daily refill (cap 120), HUD time-left, 10/2-minute warnings, paywall screen with mock top-up (feature-flagged), safe autosave at 0, read-only mode |
| M1-F27 | Playtest feedback button | "Flag this" on events, NPC lines and place panels; logs content id + note to a local export; build-flagged (playtest builds only); see 16.3(H) |
| M1-F25 | Pop-quiz study (SHOULD) | Study draws 1–3 questions from a bank of ≥ 120 curriculum-style questions (maths, English, science, general knowledge, ICT) by stage; correct answers boost Knowledge gain; funny feedback; text-only in M1 |
| M1-F24 | PWA | Installable, offline-capable core game (assets cached) |

**Out of scope for M1:** explorable map, inventory UI, businesses, skills system, loans/ajo, NYSC chain, multiple cities, cloud saves, leaderboards, voice acting, full localization.

**Recommended build order (each step independently demoable)**
1. Foundations (`M1-F00`s). 2. Engine + stats + yearly loop with a **text-only debug UI** (proves the sim) + automated bot test. 3. Character creation + HUD + scene cards. 4. Education + careers + money. 5. Event engine + first 30 events. 6. Relationships + family obligation. 7. Go-Slow Dash (standalone page first, then integrated). 8. Quests, achievements, Cowries. 9. Ending + legacy + share card. 10. Content to 90 events, tuning via bot simulations. 11. Audio, tutorial, PWA, accessibility pass. 12. Playtest and fix.

**M1 Acceptance criteria**
- **AC-M1-01** A new player can create a character and reach Year 1 in ≤ 120 s with ≤ 20 taps/clicks (excluding typing); the Randomise/Spin path takes ≤ 3 taps.
- **AC-M1-02** A complete life from age 6 to an ending can be played without a crash or soft-lock; the sim never enters a state with no available actions (End Year is always available).
- **AC-M1-03** All five stats update correctly; clamping verified; every change appears in the year summary with a reason.
- **AC-M1-04** Choosing different traits/family tiers produces measurably different outcomes (bot simulation shows distinct median final Cash and Happiness per tier, see tests).
- **AC-M1-05** Fail an exam → resit path works; skipping university → Trade/Work path works; each of 5 career tracks is reachable and can be promoted in.
- **AC-M1-06** Go-Slow Dash: runs ≥ 55 FPS on a reference mid-range Android (e.g., Tecno Spark/Infinix Hot class, Chrome); coin collection works; result screen shows converted Cash; yearly cap enforced.
- **AC-M1-07** ≥ 8 different endings are reachable (verified via bot + hand-crafted seeded scenarios) and each shows a distinct obituary.
- **AC-M1-08** Save → close → reopen resumes at the right year with identical state and RNG sequence; export/import round-trips.
- **AC-M1-09** Across 3 consecutive random lives, < 30% of events repeat.
- **AC-M1-10** First load ≤ 3 s on throttled "Fast 4G" in Lighthouse (mobile); initial JS (gzip) ≤ 250 KB for the menu/creation route; total M1 assets ≤ 6 MB; Three.js lazy-loaded only when entering a mini-game.
- **AC-M1-11** No hard-coded content strings in engine code; the content linter passes with 0 errors.
- **AC-M1-13** Token meter: a new profile starts with 120 tokens; daily refill adds 30 but never exceeds 120 free; the meter only ticks during active visible play (idle > 60 s and hidden tabs don't consume); reaching 0 autosaves, shows the paywall, and loses no progress; a mock top-up restores play.
- **AC-M1-12** Lighthouse Accessibility ≥ 90, PWA installable, works offline after first load.

**M1 Test plan**
- *Unit (Vitest):* stat clamping, energy math, money settlement, check tiers, condition evaluator, event picker (weights, cooldowns, once), save migration, runner pattern solvability.
- *Property/fuzz:* random action sequences over 10,000 seeds never produce NaN, negative age, out-of-range stats, or unreachable states.
- *Bot simulation:* three bots (random, "scholar", "money-first") play 1,000 lives each headlessly; assert 0 exceptions, distribution targets (e.g., 8–25% die before 60; median ending in "comfortable" range; all ending archetypes appear ≥ 1× across 3,000 lives; no strategy yields > 40% share of top Legacy tier).
- *E2E (Playwright):* create character → play 5 years → mini-game → save → reload → continue; one full-life smoke test with a fixed seed using accelerated time.
- *Manual QA checklist:* Android Chrome (low/mid), iOS Safari, desktop Chrome/Firefox; offline mode; text overflow in long names; 320 px wide screens.
- *Playtest:* 10 target-audience testers; collect time-to-end, confusion points, funniest/most boring events.

**M1 Definition of Done:** all MUST features implemented; AC-M1-01…12 pass; CI green; deployed on production URL; 10-person playtest completed with ≥ 70% finishing a life and an average fun rating ≥ 4/5; known-issues list triaged (no P0/P1 open).

---

### Milestone 2 — "Àwùjọ" (The Community): A Living World
**Goal:** transform the menu-driven sim into a world you *inhabit*: explore districts, build relationships with persistent NPCs, run businesses, handle richer money, quests, items, and more mini-games.

**New/changed scope**

| ID | Feature | Details |
|---|---|---|
| M2-F01 | Explorable 3D districts | 4 Lagos districts (Surulere, Yaba, Lagos Island, Lekki/VI) as low-poly 3D third-person scenes (procedural kit: buildings, roads, kiosks, umbrellas, trees, pedestrians); tap-to-move/stick; navmesh walkability; buildings open place panels/interiors; collectibles; time-of-day lighting (see 5.6) |
| M2-F02 | Travel & transport | Costs (Cash/Energy) and "go-slow" micro-events; danfo/BRT/okada/ride-hail choices, each with trade-offs |
| M2-F03 | Persistent NPC system | NPCs live in locations, have schedules by life stage, remember interactions, show relationship emotes; 40 named-archetype NPC templates |
| M2-F04 | Deep relationships | Dating pipeline, traditional + white wedding options and costs, in-law events, child-raising events by age, parenting style choice, sibling/parent aging and care |
| M2-F05 | Skills system | Hustle, Tech, Creativity, Charm, Fitness (0–10) with activity XP and gates |
| M2-F06 | Businesses | Start/run 6 business types (provision store, POS kiosk, food stall, tailoring, tech freelance, ride-hailing/transport): capital, staff (up to 3), yearly P&L, risk events, closure/sale |
| M2-F07 | Money tools | Savings account, loans (bank/loan-app with predatory-interest trap), **ajo/esusu** rotating savings with NPCs (trust/Reputation mechanics), black-tax scaling |
| M2-F08 | Housing | Rent (**weekly rent tick shown in Focus Days**, yearly in the macro loop) / own; landlord events with flavoured toasts; generator → inverter/solar upgrade; housing tier affects Energy/Happiness; locked aspirational tiers |
| M2-F09 | Inventory & shop | Slot-based inventory, shops in Markets, item effects, gifts to NPCs |
| M2-F25 | My Space (home builder) | Isometric cutaway home; Buy mode with catalogue tabs (Sleep, Kitchen, Bath, Comfort, Fun, Skills, Light, Design); grid placement; items grant comfort/skill effects and satisfy wishes; shareable room screenshot |
| M2-F26 | Phone & navigation shell | Bottom nav Home · Buy · Map · Phone; Phone = contacts, messages, wallet/bank (balance, loans, ajo), jobs board, map |
| M2-F27 | Accounts, token ledger & payments | Account sign-in (email magic link or phone OTP, guest→account upgrade), **server-side token ledger** (welcome grant, daily refill, spend by heartbeat), Paystack/Flutterwave top-ups, receipts, restore, fraud checks, guardian flow for minors (3.10) |
| M2-F10 | Quests v2 | Branching quest chains with 30 quests; quest journal with hints; NPC-given quests |
| M2-F11 | NYSC chain | Post-grad service year: camp, posting lottery, CDS group, side-hustle options |
| M2-F12 | Additional career tracks | +Healthcare, +Agriculture/Agribusiness; job-hopping, side-gigs, remote work |
| M2-F13 | Mini-games: Balogun Haggle, Oya Oya | Via common interface; plus Go-Slow Dash v2 (new obstacles per district, daily challenge seed) |
| M2-F14 | Seasons & festivals | Harmattan, rainy season flooding, Detty December, Ramadan/Eid/Christmas/Easter community events, Independence Day; optional faith system (Christian/Muslim/Traditional/None) with respectful flavour events |
| M2-F15 | Achievements v2 | 60 total, hidden and tiered |
| M2-F16 | Content scale | 220 events, 650 choices, 14 endings |
| M2-F17 | Pidgin & glossary | Pidgin flavour toggle ("Naija Pidgin mode") for narration; in-game glossary |
| M2-F18 | UX polish | Animated transitions, juicy number popups, haptics (Vibration API), richer audio, 5 new music tracks |
| M2-F19 | Profile & stats screen | Tabs: About me · Personality (trait) · My look · Badges · Belongings · My space · Goals. Fields: institution, course, hall/home, life stage, **Projected GPA**, **Reputation tier** (e.g., 2 · Unknown → named tiers), academic/career rank, **Study streak**, style points (cosmetic currency, = Cowries unlocks), Cash; lives history (last 20), lifetime stats, share cards |
| M2-F20 | Performance & data-saver mode | Lazy-load per district, geometry instancing, quality governor, lite mode (scene cards only) for low-end devices |
| M2-F21 | Focus Days | Day-scale 3D vignettes with a clock for key life moments; spend part of the year's Energy; place panels, NPC proximity prompts, suggested-next card, Wait |
| M2-F22 | Lectures & in-scene quizzes | Live classes, lecturer cards, mid-lecture questions, class-over summary, after-class revision quiz feeding Knowledge and relationships |
| M2-F23 | World UX kit | Minimap, fast travel (Map/Home/Main Gate), guided Tour, place-discovery log, ambient chatter, "New face" tags |
| M2-F24 | University campus pack | Nigerian university district grounded in real names (e.g., a UNILAG-style campus with halls, lecture theatres, cafeteria, medical centre), hostels, societies, exam weeks, JAMB-to-admission chain, "Visitor → Enrol" onboarding (5.6, Q18) |

**Out of scope:** multi-city, generational play, cloud sync, leaderboards, Whot/Ayo.

**M2 Acceptance criteria**
- **AC-M2-12** Payments: a test-mode top-up credits the server ledger exactly once (idempotent webhooks), appears in the HUD within 5 s, survives reload and device change, and a tampered client cannot grant itself tokens; refunds and failed payments leave the ledger consistent; a minor account cannot complete a purchase without the guardian flow.
- **AC-M2-11** A Focus Day (e.g., first lecture) runs end-to-end: arrive, discover a place, meet an NPC ("New face"), attend a live class, answer a question, finish with a summary; Energy and stat changes apply once to the year; clock and Wait behave consistently.
- **AC-M2-01** Player can walk a district map, enter ≥ 6 building types, talk to ≥ 5 NPC archetypes per district, and leave without being stuck (pathfinding/collision verified by automated walkability tests per map).
- **AC-M2-02** Starting a business, hiring a worker, a risk event, and selling the business all work with correct ledger totals in the year summary (ledger unit tests; sum of deltas equals net worth change).
- **AC-M2-03** NPCs persist and remember: an NPC you helped in Year X references it in an event ≥ Year X+3 in ≥ 80% of seeded scenarios (checked by test harness).
- **AC-M2-04** Map screens hold ≥ 50 FPS on reference mid-range Android; "lite mode" holds ≥ 55 FPS and reduces memory by ≥ 30%.
- **AC-M2-05** Any M1 save loads in M2 via migration without data loss (migration tests with fixture saves).
- **AC-M2-06** Quest chains: all 30 quests completable in a scripted run; no quest becomes impossible due to a prior choice without an alternate route or an explicit "failed" state shown.
- **AC-M2-07** Bot sims (1,000 lives × 3 strategies) show 0 exceptions, no infinite-money loops (max Cash growth rate bounded), and at least 3 strategies viable (each ≥ 15% share of high-Legacy outcomes).
- **AC-M2-08** Ajo/esusu and loan math validated by unit tests (incl. default scenarios).
- **AC-M2-09** Total initial load unchanged vs M1 (≤ 3 s on Fast 4G), district assets load on demand (≤ 1.5 MB per district).
- **AC-M2-10** Content lint passes; events/quests/achievements counts met.

**M2 Test plan**
- Everything in M1 plus: navmesh/walkability validation scripts (walkable graph connected, entrances reachable), ledger invariants, NPC memory harness, integration tests for business and relationship flows, visual regression screenshots of key screens (Playwright), device-matrix manual QA, 15-person playtest with qualitative interviews on "does the world feel alive?"

**M2 Definition of Done:** all MUST features; AC-M2-01…10 pass; 15-person playtest: ≥ 75% finish a life, ≥ 60% say the world "feels alive/Nigerian"; owner cultural sign-off from playtest feedback (Q10); production deploy.

---

### Milestone 3 — "Ogún Ìrandíran / Legacy": Advanced Life Progression & Expansion
**Goal:** depth and replay value at scale — generational play, multiple cities/cultures, advanced economy and careers, cloud profile, and the content pipeline to keep expanding.

| ID | Feature | Details |
|---|---|---|
| M3-F01 | Generational play | On death, choose a child/heir to continue; inheritance (wealth, property, reputation, family debts/feuds, family businesses); family tree view |
| M3-F02 | Multi-city expansion | City Packs in owner-set order: **Abuja** (planned city, civil service, estates such as Gwarinpa/Kubwa/Wuse, transport by BRT/keke), **Delta** (Warri, Asaba, Sapele: oil and trade, riverine life; Urhobo, Itsekiri, Isoko, Ijaw and Anioma/Igbo cultures), **Akwa Ibom** (Uyo, Eket, Ikot Ekpene: Ibibio, Annang and Oron cultures, food and festivals). Relocation events, culture shock, cost-of-living differences. Port Harcourt, Kano, Enugu, Ibadan follow later (Q20) |
| M3-F03 | Heritage depth | Heritage-specific chains: naming ceremonies, festivals, traditional titles, language flavour lines (Yoruba/Igbo/Hausa greetings) reviewed by native speakers |
| M3-F04 | Advanced careers | Branching specialisations, mentors, certifications, promotions via networking, side-career pivots, politics-lite (community/local leadership), entertainment industry arcs, "japa" emigration branch with remittance/diaspora consequences |
| M3-F05 | Advanced business | Multi-business empire, franchising, supply-chain events, investors, cooperatives, import/export risks, reputation-linked trust loans |
| M3-F06 | Investments | Treasury-bill-style safe assets, stocks-lite, risky "get-rich" schemes with scam-awareness education, real-estate; market event cycles |
| M3-F07 | Health & ageing depth | Chronic conditions, insurance (HMO), lifestyle, caregiving for parents, elderly legacy projects (foundation, school, community hall) |
| M3-F08 | Legacy & meta progression | Dynasty tree, prestige titles, expanded Cowries shop, starting-scenario challenges ("Rags to Riches", "Last Born"), daily challenge seed |
| M3-F09 | Cloud profile (optional login) | Email/magic-link or OAuth; cloud save sync; conflict resolution; guest play always available |
| M3-F10 | Leaderboards & sharing | Weekly Go-Slow Dash leaderboard (anti-cheat via server-validated run summaries + seed replay), Legacy leaderboards, social share cards |
| M3-F11 | Additional mini-games | Whot! and Ayo; Go-Slow Dash v3 (boss chase, weather) |
| M3-F12 | Localization framework | i18n infrastructure; Pidgin as first-class language; French and Swahili scaffolding for future cities (strings externalised) |
| M3-F13 | Content tools | Event/quest editor (web-based or CLI + VS Code snippets), validator, playtest-from-seed button, localisation export; community-ready City Pack template |
| M3-F14 | Live-ops basics | Seasonal events (calendar-driven), remote config for balance, A/B toggles, feature flags |
| M3-F15 | Content scale | 400 events, 1,200 choices, 24 endings, 60 quests, 100+ achievements |
| M3-F16 | Quality | Full accessibility pass (WCAG AA), screen-reader labels for narrative, performance budgets enforced in CI |
| M3-F17 | Monetisation extensions | Bundle offers, gift codes, family/guardian flows, seasonal promos, rewarded actions granting a few free tokens; **no pay-to-win, no loot boxes, Cowries stay non-purchasable** |

**M3 Acceptance criteria**
- **AC-M3-01** Heir transition: all assets, relationships and debts transfer correctly (invariants test: net family wealth conserved minus taxes/fees); play ≥ 3 generations without data corruption.
- **AC-M3-02** A City Pack can be added by creating data/art only: a fixture "Test City" is added in CI with **zero engine changes** and passes content lint and a bot sim.
- **AC-M3-03** Cloud sync: offline edits on two devices reconcile deterministically (last-write-wins per life + merge of MetaProfile achievements/Cowries by max/union); no data loss in tested conflict scenarios.
- **AC-M3-04** Leaderboard submissions are validated: replaying the submitted seed + input log reproduces the score within tolerance; tampered submissions rejected.
- **AC-M3-05** M1/M2 saves migrate; migration tests for every previous schema version.
- **AC-M3-06** Perf budgets enforced in CI (initial JS ≤ 250 KB gz, per-route budgets, Lighthouse perf ≥ 80 mobile).
- **AC-M3-07** Bot sims: 5,000 lives across 3 cities and 3 generations without exceptions; no infinite loops; diversity metric (distinct ending/path combos) ≥ 60% of defined ones reached.
- **AC-M3-08** Localization: switching to Pidgin changes ≥ 95% of UI strings with no missing-key fallbacks in the shipped locales.
- **AC-M3-09** Owner sign-off (and, recommended, at least one external reviewer from the relevant heritage) for each new heritage/city before release.

**M3 Definition of Done:** all MUST features; AC-M3-01…09 pass; public launch checklist complete (privacy policy, NDPA-compliant data handling, analytics consent, content rating, error monitoring, backup/restore); 30-day post-launch roadmap prepared.

---

## 10. UI/UX specification

### 10.1 Principles
- **Mobile-first portrait** (360×640 min). Desktop gets a centred phone-like column with decorative side art, up to a 480 px game column (M2 maps use a wider 16:9 mode).
- **One decision per screen.** Large cards, ≤ 4 choices visible at once, big thumb-reachable buttons at the bottom.
- **Juice with restraint:** number pop-ups, haptic taps, coin sparkles, stat bar animation — all respect `prefers-reduced-motion`.
- **Plain, warm, funny copy.** Written in a distinct narrator voice (see Section 16.2).

### 10.2 Visual style
- **Two layers, one palette.** (1) 2D UI, portraits and scene cards: bold flat illustration with Ankara/Adire-inspired trim. (2) 3D runner and world: **procedural low-poly** (flat-shaded boxes/prisms, warm dusk lighting, saturated umbrellas, yellow-and-black danfo livery), as in both reference games. Palette: deep green, gold, terracotta, indigo with accessible contrast. Use cowries, calabash, danfo stripes and ankara motifs rather than Western-default iconography. Low-poly characters are parameterised from the same `AvatarConfig` as the 2D portrait (skin tint, hair mesh, outfit colours).
- **Placeholder-first asset strategy:** colour-block SVG placeholders in early builds so every screen is playable before art lands; final assets slotted by id without code changes.

### 10.3 Key screens and wireframes (M1)

```
TITLE            CREATE (step n/5)         HOME (Life Hub)
┌──────────┐     ┌──────────────┐          ┌────────────────────┐
│  LOGO    │     │ ◄  Step 3/5  │          │ Ada · 17 · Teen   ▤│
│  hero art│     │  [Avatar     │          │ ₦ 45,000   ⚡ 70   │
│ [New Life]│    │   preview ]  │          │ 😀62 📚55 ⭐41     │
│ [Continue]│    │  Skin ● ● ● ●│          │ ┌────────────────┐ │
│ [Achieve.]│    │  Hair ▢ ▢ ▢  │          │ │ scene art:      │ │
│ [Settings]│    │  Outfit ▢ ▢  │          │ │ Compound, dusk  │ │
└──────────┘     │ [ Next ►    ] │          │ └────────────────┘ │
                 └──────────────┘          │ [Study][Hustle]     │
                                           │ [Hang out][Rest]    │
EVENT                  YEAR SUMMARY        │ [Play Go-Slow Dash]   │
┌────────────────┐     ┌────────────────┐  │ [End Year ►]       │
│ NEPA took light│     │ 2031 · Age 18  │  └────────────────────┘
│ (illustration) │     │ Headline       │
│ body text      │     │ Δ Cash  +₦120k │  MINI-GAME HUD
│ ○ Study candle │     │ Δ Happy −4     │  ┌────────────────────┐
│ ○ Sleep early  │     │ Quest updated  │  │ ♥♥♥  ₦ 1,250  412m │
│ ○ Beg neighbour│     │ [Continue]     │  │  runner scene      │
└────────────────┘     └────────────────┘  └────────────────────┘
```

### 10.4 UX requirements
- **Stat feedback:** every delta shows `+/−` chips near the stat with a tap-for-reason tooltip.
- **Risk communication:** choices labelled Safe / Risky / Gamble with colour + icon (not colour only).
- **Undo:** none for choices (consequences matter), but a confirm step for irreversible high-stakes choices (marry, quit job, take loan).
- **Pacing:** text speed setting; "tap to reveal" for long events; skip-all-animations toggle.
- **Onboarding:** first-year tutorial with coach marks (explain Energy, stats, activities, events).
- **Error handling:** autosave failure shows a non-blocking toast with "Export save" option; offline banner.
- **Localisation-ready:** no text baked into images; strings via keys even in M1.
- **Accessibility:** semantic HTML for the sim UI (Three.js only for the world and mini-games), focus management on modals, ARIA live region announcing stat changes (can be toggled), dyslexia-friendly font option (M2).

---

## 11. Audio and art direction (summary)
- **Music:** **placeholder** royalty-free/CC0 tracks that fit the mood (Afrobeats/Highlife/Afro-fusion-leaning, upbeat for runner, calmer for hub) are used for now; the owner will supply replacements if these are disliked. All audio is referenced by **id in an asset manifest** (`assets/manifest.json`), so swapping a file requires **no code change**. Every placeholder's source and license is recorded in `docs/ASSET_LOG.md`. No uncleared or sampled commercial tracks.
- **SFX:** coin chime, horn honk, danfo "oya!" shouts (original voice), UI taps.
- **Art:** **placeholder** art for now (procedural low-poly geometry, CSS/SVG UI and simple illustrated scene cards, CC0/royalty-free where needed); the owner will supply final art to replace it. Same manifest-by-id approach as audio. Art direction guide produced in Sprint 0 (palette, line weight, character proportions, architecture reference), avoiding Western-skewed features and skin rendering.

---

## 12. Technical architecture

### 12.1 Recommended stack (practical, AI-agent-friendly, deployable on static hosting)

| Layer | Choice | Why |
|---|---|---|
| Language | **TypeScript (strict)** | Types guard data/engine contracts; agents generate it reliably |
| Build | **Vite** | Fast dev loop, simple config, code splitting |
| UI | **React 18 + Tailwind CSS** | Declarative menus/HUD/event cards; huge ecosystem; accessible DOM for text-heavy UI |
| State | **Zustand** (+ immer) wrapping a **pure engine** | Simple, serialisable; engine remains framework-agnostic |
| Mini-games & world | **Three.js** (lazy-loaded; procedural low-poly; shared by the runner and the M2 3D district) | Both reference games are low-poly 3D third-person; procedural geometry keeps assets tiny and one renderer serves runner + world. Simulation logic stays pure TS so the renderer is swappable (7.1) |
| Content validation | **Zod** + custom linter | Runtime schema checks for JSON/YAML content |
| Persistence | **localStorage → IndexedDB (via `idb`)** with versioned saves | Small saves; IndexedDB for MetaProfile growth |
| Audio | **Howler.js** | Reliable cross-browser audio incl. mobile unlock behaviour |
| i18n | **i18next** (M1 keys, M3 locales) | Standard, supports Pidgin as a locale |
| PWA | **vite-plugin-pwa (Workbox)** | Offline + install |
| Testing | **Vitest** (unit/property via fast-check), **Playwright** (E2E + screenshots) | Fast, CI-friendly |
| Quality | ESLint, Prettier, TypeScript `strict`, `dependency-cruiser` (engine isolation) | Keeps agent output consistent |
| CI/CD | **GitHub Actions** → **Cloudflare Pages** (or Vercel/Netlify); preview deploys per PR | Free tier, global CDN (edge nodes near West Africa), simple |
| Analytics | **Plausible** or **PostHog** (self-serve, cookie-less, consent gated) | Privacy-friendly |
| Error monitoring | **Sentry** (browser, sampled) | Crash visibility |
| M3 backend (optional) | **Supabase** (Auth + Postgres + RLS) *or* **Cloudflare Workers + D1/KV** | Cloud saves, leaderboards, remote config; no server to run |

*Alternatives considered:* Godot/Unity WebGL (heavy bundle sizes, poor on low-end devices); Phaser/Pixi (strong 2D, but the references are 3D and a second renderer costs bundle size); Next.js (SSR unnecessary for a static game). The recommendation is deliberately boring: static site, no backend until M3.

### 12.2 Repository layout

```
/src
  /engine            # PURE TypeScript. No DOM, React, or Three.js imports.
    /core            # rng.ts, state.ts, reducer.ts, time.ts, stats.ts
    /systems         # education.ts, career.ts, money.ts, relationships.ts, events.ts,
                     # quests.ts, achievements.ts, business.ts (M2), family.ts (M3)
    /endings         # ending.ts, obituary.ts, legacy.ts
    /api.ts          # Public engine API (Section 12.3)
  /content           # Data only
    /schemas         # Zod schemas
    /cities/lagos    # city.json, locations.json, npcs.json, names.json, events/*.yaml, jobs.json
    /shared          # traits.json, items.json, quests.json, achievements.json, glossary.json
  /ui                # React components, screens, hooks
    /screens         # Title, Create, Hub, Event, Summary, Ending, Achievements, Settings
    /components      # Avatar, StatBar, ChoiceCard, Toast, Modal, Tooltip
  /minigames         # Three.js renderers + pure sims; each exports a MiniGame (Section 12.4)
    /go-slow-dash
  /world             # (M2) map scenes, pathfinding, NPC controllers
  /platform          # save.ts, storage.ts, audio.ts, analytics.ts, share.ts, pwa.ts
  /i18n
/tests
  /unit /property /sim /e2e
/tools               # content-lint, bot-sim, map-validate, asset-pack scripts
/docs                # PRD.md, CONTENT_GUIDE.md, ART_GUIDE.md, ADRs
```

### 12.3 Engine API (contract)
Pure functions over a serialisable `GameState`; UI never mutates state directly.

```ts
createNewLife(config: NewLifeConfig, seed: number, meta: MetaProfile): GameState
getAvailableActions(state: GameState): ActionOption[]
performAction(state: GameState, actionId: string, args?: unknown): ActionResult // {state, log, followUps}
endYear(state: GameState): YearResult      // settlement, event draw → pendingEvents
resolveChoice(state: GameState, eventId: string, choiceId: string): ChoiceResult
applyMiniGameResult(state: GameState, result: MiniGameResult): ActionResult
checkEnding(state: GameState): Ending | null
serialize(state): string; deserialize(raw: string): GameState   // with migrations
```

Rules: deterministic given (state, input); no `Math.random()` or `Date.now()` in engine (inject via state); every state change emits typed `LogEntry`s.

### 12.4 Mini-game interface

```ts
interface MiniGame {
  id: string
  mount(container: HTMLElement, ctx: MiniGameContext): MiniGameHandle
}
interface MiniGameContext { seed: number; difficulty: number; stage: LifeStage;
  avatar: AvatarConfig; assist: boolean; onComplete(result: MiniGameResult): void }
interface MiniGameResult { gameId: string; score: number; coins: number;
  distance?: number; durationMs: number; inputLogHash?: string }
```

### 12.5 Performance and compatibility
- Targets: Chrome Android (last 3 years), Safari iOS 15+, desktop evergreen. Minimum screen 320 px.
- Budgets: initial JS ≤ 250 KB gz; menu route interactive ≤ 3 s on Fast 4G; images WebP/AVIF; audio as OGG/MP3 ≤ 2 MB total in M1 (stream music, preload SFX); sprite atlases ≤ 1 MB; shared 3D chunk (Three.js tree-shaken) ≤ 200 KB gz, runner module ≤ 150 KB gz, district module ≤ 200 KB gz (M2), 3D assets ≤ 1.5 MB per district.
- Data-saver: respect `navigator.connection.saveData`; "lite mode" (M2).
- Avoid layout shifts and long main-thread tasks (>50 ms) during year resolution (engine work < 10 ms typical).

### 12.6 Security, privacy, compliance
- Guest-first; no PII collected in M1–M2. Analytics anonymous and consent-gated.
- M3 accounts: Nigeria's **NDPA 2023** and GDPR-aligned handling; privacy policy, data deletion endpoint, minimal data retention. Age gate/consent flow if under-18 data is collected (default: don't collect).
- Leaderboard anti-cheat via server-side replay validation; rate limiting.
- Content Security Policy; no third-party script without review.
- User-entered names sanitised and filtered (profanity list incl. Nigerian languages/Pidgin).

### 12.7 Observability and balance tooling
- `npm run sim -- --lives 1000 --bot scholar` outputs distributions (final Cash, age at death, endings, event frequency, stat curves) to CSV/JSON; CI runs a smaller sim (200 lives × 3 bots) with threshold assertions.
- Dev overlay (URL flag `?debug=1`): show seed, force event, jump to age, grant stats, reveal hidden stats.

---

## 13. Data models (TypeScript interfaces; authoritative for M1, extended in M2/M3)

```ts
type LifeStage = 'child' | 'teen' | 'youngAdult' | 'adult' | 'elder'
type Gender = 'male' | 'female'
type Heritage = 'yoruba' | 'igbo' | 'hausa' | 'mix' | string // extensible via City/Heritage packs

interface NewLifeConfig {
  name: string; nickname?: string; gender: Gender; heritage: Heritage
  familyTier: 'struggling' | 'lowerMiddle' | 'middle' | 'comfortable'
  cityId: string; appearance: AvatarConfig; traits: [TraitId, TraitId]
}

interface AvatarConfig {
  skinTone: number; faceShape: number; hairStyle: string; hairColor: string
  facialHair?: string; outfitSet: string; accessories: string[]
}

interface Stats {
  cash: number; energy: number; maxEnergy: number
  happiness: number; knowledge: number; reputation: number
  health: number; stress: number
  skills?: Record<'hustle'|'tech'|'creativity'|'charm'|'fitness', number> // M2
}

interface Character {
  id: string; name: string; gender: Gender; heritage: Heritage
  birthYear: number; age: number; stage: LifeStage
  appearance: AvatarConfig; traits: TraitId[]; stats: Stats
  education: { level: EducationLevel; schoolType: 'public'|'private'|'federal'; inSchool: boolean; examResults: Record<string,'distinction'|'pass'|'fail'> }
  careerId?: string; careerLevel?: number; careerYears?: number
  lifestyle: 'frugal' | 'normal' | 'baller'
  housing: { type: 'family'|'rent'|'own'; districtId: string; tier: number }
  businessIds: string[]      // M2
  inventory: ItemInstance[]  // M2 (M1: flags)
  debt: number
}

interface NPC {
  id: string; name: string; gender: Gender; archetype: string
  birthYear: number; alive: boolean; traits: string[]
  appearance: AvatarConfig
  role: 'parent'|'sibling'|'relative'|'friend'|'partner'|'child'|'colleague'|'rival'|'neighbour'|'boss'
  meters: { closeness: number; trust: number; romance?: number }
  memory: { eventId: string; year: number; tag: string }[]   // M2 recall
  locationId?: string // M2
}

interface GameState {
  schemaVersion: number
  seed: number; rngState: number
  year: number; age: number
  character: Character
  npcs: Record<string, NPC>
  flags: Record<string, boolean | number | string>
  pendingEvents: string[]                 // queue of event ids
  scheduledEvents: { eventId: string; fireYear: number }[]
  eventHistory: Record<string, { lastYear: number; count: number }>
  quests: Record<string, QuestProgress>
  log: LogEntry[]                         // append-only consequence log
  currentYearEnergySpent: number
  cityId: string
  status: 'active' | 'ended'
  ending?: EndingResult
}

interface MetaProfile {
  profileId: string; cowries: number
  unlocks: string[]                       // cosmetic/perk/city ids
  achievements: Record<string, { unlockedAt: number; lifeId: string }>
  stats: { livesPlayed: number; bestLegacy: number; runnerBest: number; longestLife: number }
  settings: Settings
  livesHistory: LifeSummary[]
}

// Content definitions
interface GameEvent {
  id: string; title: string; text: string; image?: string
  stage?: LifeStage[]; weight: number; cooldownYears?: number; once?: boolean
  priority?: 'normal' | 'scripted'
  conditions?: ConditionGroup
  tags?: string[]
  choices: Choice[]
}
interface Choice {
  id: string; label: string; requires?: ConditionGroup
  cost?: Partial<Pick<Stats,'cash'|'energy'>>
  check?: { stat: keyof Stats | string; difficulty: number; luck?: boolean }
  effects?: Effect[]                      // used when no check
  outcomes?: Partial<Record<'critSuccess'|'success'|'fail'|'critFail', { effects: Effect[]; text?: string; followUp?: FollowUp }>>
  followUp?: FollowUp
  riskLabel?: 'safe'|'risky'|'gamble'
}
type Effect =
  | { stat: keyof Stats; delta: number }
  | { flag: string; set: boolean | number | string }
  | { relationship: { npc: string; delta: number } }
  | { item: string; give?: boolean; remove?: boolean }
  | { career: { set?: string; levelDelta?: number } }
  | { questUpdate: { id: string; stage: string } }
  | { npcSpawn: { archetype: string; role: NPC['role'] } }
type ConditionGroup = { all?: Condition[]; any?: Condition[]; not?: Condition[] }
type FollowUp = { eventId: string; inYears: number }

interface JobDef {
  id: string; trackId: string; level: number; title: string
  salaryRange: [number, number]; energyCost: number; stress: number
  requires: { education?: EducationLevel; knowledge?: number; reputation?: number; skills?: Partial<Record<string, number>> }
  promoteBase: number; layoffRisk: number
}

interface QuestDef { id: string; title: string; stages: { id: string; text: string; condition: ConditionGroup }[]; rewards: Effect[]; cowries?: number }
interface AchievementDef { id: string; title: string; description: string; hidden?: boolean; tier?: 'bronze'|'silver'|'gold'; condition: ConditionGroup; cowries: number }
interface ItemDef { id: string; name: string; category: string; price: number; effects: Effect[]; cowrieCost?: number; unlockedBy?: string }
interface BusinessDef { id: string; name: string; startupCost: number; yearlyRevenueRange: [number,number]; yearlyCost: number; maxStaff: number; riskEvents: string[] } // M2
interface CityPack { id: string; name: string; districts: District[]; locations: LocationDef[]; npcArchetypes: string[]; namePools: Record<Heritage,string[]>; costOfLivingMultiplier: number; eventTagsEnabled: string[]; music: string[] }
```

**Save file:** `{ schemaVersion, savedAt, state: GameState, meta: MetaProfile }` serialised JSON; migrations as an ordered array of `(old) => new` functions with fixtures in `/tests/fixtures/saves`.

---

## 14. Balance and tuning (starting configuration)

### 14.1 Configurable constants (single `balance.json`)
- Start Cash by family tier: ₦20k / ₦80k / ₦200k / ₦600k (as pocket money/family allowance scaled by stage).
- Annual living cost (adult, normal lifestyle, Lagos): ₦600k–₦2.4M by housing tier (scaled by `costMultiplier`).
- Mortality curve: base annual death probability 0.2% at 45 rising to 12% at 85; modified by Health (±50%), flags (accident, illness).
- Study Knowledge gain: +3 base (+trait, +school quality, diminishing returns above 70).
- Exam pass thresholds: Knowledge ≥ 40 pass, ≥ 70 distinction (before luck).
- Black-tax request frequency: 0–1/yr from 22+, amount 5–20% of annual income.
- Runner: `coinToCash` ₦50 (scaled 0.5× child, 1× teen, 2× adult), yearly cash-out cap 3.

### 14.2 Design-for-expansion checklist
- All city-specific strings, prices and events are in a CityPack; engine reads `cityId` for multipliers only.
- Heritage-specific flavour is injected via tags (`heritage:yoruba`) and name pools, not branches in code.
- Currency formatting through a `formatMoney(cityId, amount)` helper (Naira now, Cedi/Shilling/Rand later).

---

## 15. Quality bar and QA strategy

| Layer | What | Tool | Gate |
|---|---|---|---|
| Static | Types, lint, format, engine isolation | tsc, ESLint, dependency-cruiser | CI blocking |
| Unit/property | Engine rules, invariants, schemas | Vitest + fast-check | CI blocking, ≥ 85% engine coverage |
| Content | Schema, references, reachability, length caps, tone linter (banned word list) | `content:lint` | CI blocking |
| Simulation | Bot lives, distribution assertions, no-exception | `sim` | CI (small), nightly (large) |
| E2E | Critical flows, full-life smoke | Playwright (Chromium + WebKit + mobile emulation) | CI blocking |
| Performance | Lighthouse CI, bundle size budget | lhci, size-limit | CI blocking |
| Manual | Device matrix, cultural review, playtests | Checklists | Milestone gate |

**Bug severity:** P0 (crash/soft-lock/data loss) blocks release; P1 (broken core feature, major balance exploit) blocks release; P2 fix next sprint; P3 backlog.

---

## 16. Cultural authenticity, sensitivity, and writing guide

### 16.1 Process
1. **Cultural review:** the **owner** reviews content during playtesting (Q10); all content is built deeply from the cultural bible (16.3) and flagged `reviewNeeded` where uncertain. External per-heritage reviewers are optional and recommended before the M3 heritage expansion.
2. **Specificity over stereotype:** prefer concrete everyday details (a particular snack, a neighbour's habit) over broad tropes.
3. **Agency and dignity:** poverty is a setting, not a punchline; wealth is not automatically villainous; rural/urban, ethnic and religious groups are not ranked.
4. **Humour rules:** laugh *with* situations (NEPA, traffic, mother's calls), not *at* ethnicity, religion, disability, or gender.
5. **Sensitive topics** (scams, police interactions, politics, religion, bride price, polygamy, traditional religion, violence): allowed only with nuance, real consequence, and reviewer sign-off; no real politicians, parties, or brands; no endorsing crime; scams appear as temptations with realistic downsides and educational framing.
6. **Language:** English default; Pidgin and local-language lines are accurate and spelled consistently via a style sheet; no phonetic mockery of accents; glossary explains terms for outsiders.
7. **Representation:** diverse body types, skin tones, disabilities (assistive devices as NPC/character flavour in M2+), and family structures.

### 16.2 Narrator voice
Warm, witty, a little teasing, never cruel; short paragraphs; second person ("you") with name tokens; sprinkled Pidgin/Yoruba/Igbo/Hausa expressions with context so non-speakers can follow. Example: *"Mama calls. Not texts. Calls. This is either love or a request for money. Possibly both."*

### 16.3 Nigerian cultural content bible (build depth from here)
**Owner decision (Q10):** go deep into Nigerian culture and build from it; the **owner reviews during playtesting** and gives feedback. This section is the content brief for writers and AI agents. It is a *starting* inventory drawn from general knowledge, so every item is subject to owner correction; tag uncertain material `reviewNeeded: true`. Details such as names, dates, prices and customs vary by community and region, so write them as *typical* rather than universal.

**A. Life-stage cultural beats (event seeds, by stage)**
| Stage | Beats |
|---|---|
| **Birth/Childhood (6–11)** | Naming ceremony stories told by relatives (Yoruba *Ìsọmọlórúkọ* ~day 7–8, Igbo *Igu aha*, Hausa *Suna*); being sent on errands and greeting elders properly; "uncle/auntie" for any elder; Common Entrance/primary exams; school assembly, break-time suya or *puff-puff*, boli at the gate; lesson teacher; Saturday chores; *Suwe*/hand-clap, *ayo*, *ludo*, *whot*, football on the street; NEPA outages at bedtime; village or grandmother visits at Christmas/Sallah; Mum's/Dad's "when I was your age" speeches; Sunday service or Friday jumu'ah; first phone call to a relative abroad |
| **Teen (12–17)** | Junior and Senior Secondary (JSS/SSS), boarding school hardships, Federal Unity vs private schools, **WAEC/NECO**, **JAMB UTME** and Post-UTME, extra lessons, school clubs, inter-house sports, prefect politics, crush and "chatting", parents' strictness, peer pressure, owambe and church/mosque youth programmes, first small hustle (selling sachet water, assisting at the shop), rebellious hair/dress, school resumption fees and uniform sewing |
| **Young adult (18–29)** | University/polytechnic/college admission, hostel life, *carryovers*, **ASUU-style strike** downtime (fictionalised), SIWES/industrial training, **NYSC** (call-up letter, orientation camp, platoons, CDS, PPA posting, "allowee"), job hunting with CVs and aptitude tests, "who you know" nepotism, first salary and **rent upfront**, flat-sharing, side-hustles (POS, reselling, content, tutoring), dating, relocation (the **japa** question), first car/bike, family expectations about marriage |
| **Adult (30–59)** | Marriage preparations and ceremonies, in-laws, children and school fees, rent/ownership, **omo onile** land disputes, building a house in the village or city, promotions and office politics, cooperative societies, contributing to **ajo/esusu/adashi**, black tax, health scares, church/mosque leadership roles, community associations (town unions, landlords' associations, *egbe*), political season chatter, burial and memorial obligations |
| **Elder (60+)** | Retirement and pension delays, being consulted as an elder, grandchildren, village titles, health and HMO, passing on land and customs, legacy projects (scholarships, community borehole), farewell/burial planning, stories told at gatherings |

**B. Everyday systems that make it feel Nigerian (mechanics, not just flavour)**
- **Rent upfront:** tenancy is typically paid **annually (or longer) upfront** plus *agent* and *legal/agreement* fees and *caution deposit*. This fits our yearly tick perfectly: year-start settlement shows "Rent due: ₦X + agent + legal"; shortfall triggers *beg landlord / borrow / downgrade* choices. (Lagos Life's weekly rent is a different style; ours is annual with an optional monthly/weekly plan at a premium.)
- **Power:** disco/NEPA outages, estimated billing vs prepaid meter, generator fuel and noise, inverter/solar upgrades, neighbours' generators, "light don come" joy event.
- **Water:** borehole, tanker, sachet "pure water", Mama Put with a well.
- **Transport:** danfo, BRT, keke, okada, ride-hail, ferries, third-mainland-bridge go-slow, LASTMA-style checkpoints (fictionalised), "conductor change" arguments, fuel queues, airport travel.
- **Money:** cash vs transfer, POS agents and charges, network failures, *esusu/ajo/adashi*, cooperative loans, microfinance-style loans with weekly repayments, dollar/naira jokes, airtime vs data, Black-tax requests, "sapa" (broke) moments, owambe spraying.
- **Housing:** single room/"face-me-I-face-you", mini-flat, flat, duplex, boys' quarters, serviced apartment; landlord rules; agent chases; omo onile "land fees".
- **Respect:** **greeting is a mechanic.** Greeting an elder properly (and choosing the right form) affects Reputation and relationship; skipping it triggers comic-consequence events. Kneeling/prostrating customs differ by heritage and gender and are portrayed respectfully.
- **Food as mood:** *Sunday rice*, jollof wars, pounded yam, amala, eba, egusi, pepper soup, suya, boli, akara, moi moi, puff-puff, chin chin, zobo, kunu. Food boosts Energy/Happiness with small flavour effects; cooking and Mama Put are activities.
- **Dress:** buba & sokoto, agbada, iro & buba, gele, aso-oke, Ankara, Adire, George wrapper, isiagu, kaftan, babban riga, hijab, school uniforms, owambe "asoebi" colours.
- **Education system:** 6-3-3-4 (primary, JSS, SSS, university), WAEC/NECO, JAMB UTME, polytechnic (ND/HND), colleges of education (NCE), NYSC after graduation.

**C. Heritage packs (M1: Yoruba, Igbo, Hausa, Naija Mix; M3: more)**
| Heritage | Seeds (to be refined with the owner) |
|---|---|
| **Yoruba** | Naming ceremony, *oriki* (praise names), prostrating/kneeling greetings, **Eyo** (Lagos Island), **Osun-Osogbo**, Egungun, introduction/engagement and wedding rites, owambe culture, aso-oke/gele/agbada, amala-ewedu-gbegiri, iyan, ofada rice, *akara*, *ewa agoyin*, proverbs (*owe*), Yoruba names and their meanings |
| **Igbo** | **New Yam (Iri ji)**, kola nut breaking, **igba nkwu** and *iku aka* (traditional marriage and introduction), *umunna* kindred, age grades, apprenticeship (*igba boi/imu ahia*) as a **real entrepreneurial path**, Ofala and masquerade festivals, Christmas "going home to the village", isiagu/george/red cap, ofe onugbu, egusi, oha, abacha, nkwobi, *isi ewu* |
| **Hausa** | **Sallah (Eid)** and Ramadan rhythm, **Durbar**, naming ceremony (*Suna*), adashi savings, Kano markets and dye pits, kunu, tuwo and miyan kuka/taushe, *kilishi*, suya, fura da nono, babban riga, hijab and cap styles, respect and greeting formulas |
| **Naija Mix** | Mixed family, intercity relocation, Pidgin as household language, mixed foods and celebrations |
| **M3 additions (priority from owner's city order)** | **Delta:** Urhobo, Itsekiri, Isoko, Ijaw, Anioma (Delta Igbo); **Akwa Ibom:** Ibibio, Annang, Oron (with Efik neighbours: **edikang ikong**, **afang**); **Abuja:** a mix of all groups plus Gbagyi as host community. **Later:** Edo (Benin court, **Igue**), Tiv, Nupe, Kanuri, Fulani, Igala, and more, each reviewed |

**D. Calendar (drives seasonal events and Focus Days)**
Harmattan (dry dusty season, roughly Dec–Feb: cracked lips, hazy mornings), rainy season (floods, traffic), "ember months" (Sep–Dec) superstition and Detty December, New Year/crossover night, Ramadan/Eid, Easter, Christmas "go to the village", Independence Day (1 Oct), Democracy Day (12 June), new academic session, resumption and fees, harvest/new yam time.

**E. Language and humour (use sparingly, always with context)**
Pidgin and Nigerian English expressions such as *abeg, wahala, sapa, japa, gist, oya, chop, how far, no wahala, I dey, na so*, with gloss tooltips; proverbs; Mama's guilt trips; WhatsApp family-group drama; conductor chants; "we move" jokes. Rules: no phonetic mockery, consistent spelling via a style sheet, include a glossary entry for every non-English term.

**F. Culture-driven mechanics to implement**
- *Greeting & respect check* (elders, in-laws, bosses).
- *Black tax, owambe overspend, aso-ebi pressure* as recurring money sinks with Reputation upsides.
- *Esusu/ajo/adashi* with trust and default consequences (M2).
- *Apprenticeship path* (trade/tech/fashion) as a first-class career route with a master/mentor NPC (M1 trade track, M2 depth).
- *Introduction → engagement → wedding* chain with heritage-specific beats and costs (Q15).
- *Festival events* with heritage-specific variants and a "going home" travel event.
- *Faith as optional flavour*: church/mosque/traditional community life, vigils, fasting, offerings, never forced.

**G. Sensitive-content rules for this section**
Treat bride price, polygamy, traditional religion, burial rites, ethnic stereotypes, police and security, religion and politics with nuance, humour at the situation (not the group), and consequences; never present one group's practice as the Nigerian default; avoid real people and parties; keep ethnic/religious jokes out unless the owner explicitly approves in review.

**H. Review loop with the owner**
- Every event/NPC/place can carry `reviewNeeded: true` and a `cultureTag` (heritage, festival, system) to filter in review.
- **Playtest builds include a "Flag this" button** on events, NPC lines and place panels (M1-F27): it logs `{eventId, textId, build, note}` to a local file/clipboard export (and, from M2, to the backend) so owner feedback maps to exact content ids.
- Feedback is triaged each sprint into: wrong/offensive (fix now), inaccurate (fix next), flavour change (backlog). The `docs/CULTURE_FEEDBACK.md` log tracks decisions so changes aren't repeated.
- Inviting external reviewers per heritage is **optional** and recommended before the M3 heritage expansion.

---

## 17. Prioritized feature backlog

**Priority:** P0 = required for the milestone to ship; P1 = should ship; P2 = nice to have; P3 = future. **Size:** S ≤ 1 day, M ≈ 2–4 days, L ≈ 1–2 weeks (AI-assisted estimates, single developer + agents).

| Rank | ID | Item | Milestone | Priority | Size | Depends on |
|---|---|---|---|---|---|---|
| 1 | M1-F00 | Repo, CI, deploy pipeline | M1 | P0 | S | — |
| 2 | M1-F03 | Core engine (state, RNG, stats, yearly loop) | M1 | P0 | L | F00 |
| 3 | M1-F00c | Content schemas + linter | M1 | P0 | M | F03 |
| 4 | Sim | Headless bot simulation harness | M1 | P0 | M | F03 |
| 5 | M1-F18 | Save/load (versioned) | M1 | P0 | M | F03 |
| 6 | M1-F02 | Character creation + avatar layers | M1 | P0 | L | F03 |
| 7 | M1-F04/F05/F06 | HUD, activities, scene cards | M1 | P0 | L | F02 |
| 8 | M1-F11 | Event engine + 90 events | M1 | P0 | L | F03, F00c |
| 9 | M1-F07 | Education path + exams | M1 | P0 | M | F11 |
| 10 | M1-F08 | Careers (5 tracks) | M1 | P0 | L | F07 |
| 11 | M1-F09 | Money, lifestyle, black tax | M1 | P0 | M | F08 |
| 12 | M1-F10 | Relationships (basic) + family | M1 | P0 | L | F11 |
| 13 | M1-F12/F13 | Go-Slow Dash + coin integration | M1 | P0 | L | F03 |
| 14 | M1-F17 | Endings, obituary, legacy, share card | M1 | P0 | M | F10 |
| 15 | M1-F14/F15/F16 | Quests, achievements, Cowries | M1 | P0 | M | F11 |
| 16 | M1-F21 | Tutorial | M1 | P1 | S | F04 |
| 17 | M1-F19/F20 | Settings, audio | M1 | P1 | M | — |
| 18 | M1-F22/F24 | Accessibility baseline, PWA | M1 | P1 | M | — |
| 18b | M1-F25 | Pop-quiz study | M1 | P1 | M | F07 |
| 18d | M1-F27 | Playtest "Flag this" feedback button | M1 | P1 | S | F11 |
| 18c | M1-F26 | Playtime Tokens (client-side) + paywall UI | M1 | P0 | M | F03 |
| 19 | M1-F23 | Consent-gated analytics | M1 | P1 | S | — |
| 20 | M1-X1 | Debug overlay & seed share | M1 | P1 | S | F03 |
| 21 | M2-F01/F02 | Explorable maps + travel | M2 | P0 | L | M1 |
| 22 | M2-F03 | Persistent NPC system | M2 | P0 | L | M1 |
| 23 | M2-F06 | Businesses | M2 | P0 | L | M1 |
| 24 | M2-F07 | Savings, loans, ajo/esusu | M2 | P0 | M | F06 |
| 25 | M2-F04 | Deep relationships/parenting | M2 | P0 | L | F03 |
| 26 | M2-F05 | Skills system | M2 | P1 | M | M1 |
| 27 | M2-F10 | Quests v2 | M2 | P0 | M | F03 |
| 28 | M2-F13 | New mini-games | M2 | P1 | L | M1 F12 |
| 29 | M2-F14 | Seasons, festivals, faith (optional) | M2 | P1 | M | M1 |
| 30 | M2-F08/F09 | Housing, inventory, shop | M2 | P1 | M | F06 |
| 31 | M2-F11/F12 | NYSC chain, new careers | M2 | P1 | M | M1 |
| 32 | M2-F16 | Content scale to 220 events | M2 | P0 | L | — |
| 33 | M2-F20 | Lite mode / data saver | M2 | P1 | M | F01 |
| 33a | M2-F27 | Accounts, server ledger, payments (required for monetised launch) | M2 | P0 | L | M1-F26 |
| 33b | M2-F21–F24 | Focus Days, lectures & quizzes, world UX kit, campus pack | M2 | P0 | L | M2-F01 |
| 34 | M2-F17/F18/F19 | Pidgin mode, polish, history stats | M2 | P2 | M | — |
| 35 | M3-F01 | Generational play | M3 | P0 | L | M2 |
| 36 | M3-F02/F13 | Multi-city packs + content tools | M3 | P0 | L | M2 |
| 37 | M3-F03 | Heritage depth | M3 | P0 | L | F02 |
| 38 | M3-F04/F05/F06 | Advanced careers, business, investments | M3 | P1 | L | M2 |
| 39 | M3-F07 | Health/ageing depth | M3 | P1 | M | M2 |
| 40 | M3-F09/F10 | Cloud profile + leaderboards | M3 | P1 | L | M2 |
| 41 | M3-F11 | Whot!, Ayo | M3 | P2 | L | M2 F13 |
| 42 | M3-F12 | Localization framework | M3 | P1 | M | — |
| 43 | M3-F14 | Live-ops basics | M3 | P2 | M | F09 |
| 44 | M3-F17 | Monetisation extensions | M3 | P2 | M | M2-F27 |
| 45 | Future | Additional African cities (Accra, Nairobi, Johannesburg, Dakar…) | Post-M3 | P3 | L each | M3-F02 |
| 46 | Future | Native wrappers (Capacitor), voice lines, community City Pack submissions | Post-M3 | P3 | L | — |

---

## 18. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Content volume (90 → 400 events) is the long pole | Stale/repetitive game | Content pipeline + linter early; templated generators; AI-assisted drafting **with human cultural review**; track repeat-rate metric |
| Cultural missteps | Reputation, trust | Advisors, review gates, sensitivity checklist, ability to hot-patch content (remote config M3) |
| Balance/exploits (infinite money, trivial strategies) | Boring game | Bot sims in CI, caps on mini-game income, diminishing returns |
| Low-end device performance / data costs | Churn | Budgets enforced in CI, lazy-load Three.js, lite mode, quality governor, PWA caching |
| Art production bottleneck | Delays | Placeholder-first, layered avatar reuse, limited scene count in M1 |
| AI agent drift (inconsistent architecture) | Rework | Strict engine isolation, schemas, typed contracts, small tickets, mandatory tests, ADR log |
| Scope creep from "life sim can do anything" | Never ships | Hard milestone gates, "out of scope" lists, backlog priorities |
| Music/art licensing | Legal | Original/commissioned only; asset provenance log |
| Paywall hurts retention or feels unfair | Churn, bad reviews | Generous welcome grant sized to finish a full life, safe autosave at zero, transparent Naira pricing, daily refill, conversion/retention dashboards, tunable values |
| Payment fraud / token tampering | Revenue loss | Server-side ledger, idempotent webhooks, one welcome grant per account, rate limits |
| Save corruption/migrations | Lost lives | Versioned schema, fixture-based migration tests, export/import |

---

## 19. Assumptions made
1. Audience is 16–35, mobile-first, PG-13; free-to-play with no real-money mechanics at launch.
2. The year is the macro time unit; Energy doubles as the action budget (no separate action points).
3. Health and Stress are added supporting stats (not in the brief's five) to make mortality and burnout work.
4. Lagos only for M1–M2; additional cities arrive via City Packs in M3.
5. Faith is optional and never required for progress; religious content is respectful and reviewed.
6. Gender options are Male and Female (owner decision); the pronoun helper keeps the door open for more.
7. M1 has no backend (local play, mock top-up). **Accounts, a server-side token ledger and payments arrive in M2 (M2-F27)** because the paywall can't be enforced client-side; cloud saves/leaderboards remain M3.
8. UI art is 2D illustrated with layered portrait avatars; the runner and M2 world are procedural low-poly 3D (Three.js); scene cards in M1.
9. Music and art are **placeholders** (royalty-free/CC0 or procedural, licenses logged) until the owner supplies finals; swaps are manifest-driven. No uncleared samples.
10. English is primary; Pidgin is a flavour layer in M1–M2 and a full locale in M3.
11. Economy values are fun-first, not statistically realistic.
12. One development team of 1–3 humans plus AI coding agents; no dedicated QA until M2.

---

## 20. Critical open questions (need human decisions)

| # | Question | Why it matters | Default if unanswered |
|---|---|---|---|
| Q1 | **Resolved:** all three references have been reviewed (Sections 5.6, 5.7, 7.1). | — | — |
| Q2 | Target platform priority: phone-first PWA, or desktop-first? | Layout and input choices | Phone-first |
| Q3 | Target age rating / maturity (PG-13 vs. more edgy BitLife-style)? | Event content scope | PG-13 |
| Q4 | Final name, branding, and domain? | Share cards, store/PWA metadata | "Navigating Adult Life" |
| Q5 | **Resolved (owner):** gender options are Male and Female. | — | — |
| Q6 | Is death permanent per life (roguelike) or may players "Continue as heir" in M1? | Scope | Heirs in M3 only |
| Q7 | **Resolved (owner):** placeholder music and art for now; owner supplies replacements on request. Asset manifest makes swapping code-free. | — | — |
| Q8 | **Resolved (owner):** free for the first 2 hours, then top-up to continue; daily free tokens, stored free balance capped at 2 hours. Specified in 3.10. Details still open in Q21–Q24. | — | — |
| Q9 | **Resolved:** no licensed Afrobeats tracks; placeholder royalty-free music only, with provenance logged. | — | — |
| Q10 | **Resolved (owner):** build deeply from Nigerian culture; the owner reviews during testing and gives feedback. Workflow in 16.3(H). | — | — |
| Q11 | Should real-world satire (fuel price, exchange rate, japa) reference actual events, or stay generic/fictionalised? | Legal and tone | Generic/fictionalised |
| Q12 | Do players need accounts in v1 (e.g., to share/compare)? | Backend and privacy scope | Guest only until M3 |
| Q13 | Offline expectation: must core gameplay work fully offline? | PWA caching strategy | Yes for M1+ |
| Q14 | Language scope for launch: English + Pidgin flavour only, or Yoruba/Igbo/Hausa UI? | Localization cost | English + Pidgin flavour |
| Q15 | Bride price/traditional marriage customs: depict explicitly, abstractly, or skip? | Sensitivity and reviewer approach | Abstract with reviewer-approved choices |
| Q17 | The campus reference shows a "12 online" presence badge and Cubbes account sign-in (multiplayer/social layer). Do we want any ambient presence, friends or shared leaderboards beyond M3's leaderboards? | Scope, backend, moderation cost | No; single-player, leaderboards only (M3) |
| Q18 | **Resolved (owner):** content must relate to real Nigerian life, so we use real Nigerian institution, place, road and landmark names. Guardrails to confirm with legal review: names as setting only (no logos, trademarks, or implied endorsement), original art, fictional people (incl. lecturers/staff), no defamatory or real-person satire, jokes target situations not institutions. | Authenticity vs legal risk | Real names with guardrails |
| Q19 | **Resolved (owner):** the Birth Lottery is decided **fresh each life** (one re-roll, underdog Cowries bonus). | — | — |
| Q20 | **Resolved (owner):** start with **Lagos**; then **Abuja, Delta and Akwa Ibom** (in that order). The starting-city picker appears when the second pack ships. Open detail: pull Abuja earlier (e.g., end of M2) if content capacity allows? | Content volume per city | Lagos M1–M2; Abuja, Delta, Akwa Ibom in M3 |
| Q21 | Daily free refill amount (default 30 min/day, capped at 2 h stored)? Should it stack with the welcome 2 h, or does the welcome grant simply fill the 2 h cap? | Retention vs. revenue | 30 min/day; welcome fills the 120-minute cap |
| Q22 | Token pack sizes and Naira prices, whether purchased tokens expire, and payment gateway (Paystack vs Flutterwave; card, transfer, USSD)? | Revenue, trust | Packs of 60/180/600 min, no expiry, Paystack |
| Q23 | Minors: is a guardian-approved payment flow or gifted code required, and what is the minimum age to create an account? | Compliance (NDPA), ethics | Under-18s need guardian approval for purchases |
| Q24 | Should rewarded actions (e.g., finishing the daily mission or sharing) grant a few free tokens beyond the daily refill? | Retention, fairness | Yes, small, within the 2 h cap |
| Q16 | **Resolved (owner):** the game is about navigating life, so runner modes are **contextual and combined** (on foot where the story is on foot, driving where it is a commute or job). Both ship in M1. 3D remains the plan (as in the references) with the Canvas 2D fallback if the T18 spike fails. | Largest M1 schedule risk | Both modes in M1, sequenced F12a → F12b |

---

## 21. Guidance for AI coding agents (build protocol)

1. **Work in vertical slices.** Each ticket ends with something runnable and tested. Never leave the app in a non-building state on `main`.
2. **Engine first, UI second.** Prove every system via unit tests and the bot sim before wiring UI. The text-only debug UI is a deliverable of M1 step 2.
3. **Data over code.** If you are writing `if (eventId === '...')` in the engine, stop — add a condition/effect type or content instead.
4. **Keep it boring.** No state-management or architecture abstractions beyond Section 12 without an ADR. No premature multiplayer, ECS, or custom engines.
5. **Test with every change.** New system → unit tests + at least one sim assertion. New content → linter must pass.
6. **Small PRs** (< ~400 changed lines excluding content/data). Reference requirement IDs (e.g., "implements M1-F07").
7. **Determinism rules.** No `Math.random()`/`Date.now()` in `/engine`. All RNG via injected PRNG.
8. **Performance rules.** Respect budgets in 12.5; import Three.js only inside `/minigames` and `/world` via dynamic import.
9. **Accessibility rules.** Every interactive element reachable by keyboard; no information by colour alone.
10. **Content rules.** Follow Section 16; mark any culturally uncertain content with `reviewNeeded: true` in the data so reviewers can filter it.
11. **Document decisions.** Add an ADR (`/docs/adr/NNN-title.md`) for any deviation from this PRD.
12. **Definition of Done per ticket:** typecheck, lint, tests, content lint, build, and (where UI) a Playwright check or screenshot attached.

### Suggested M1 ticket sequence (copy into your tracker)
`T01` repo+CI+deploy · `T02` RNG + state + serialization + tests · `T03` stats/energy/money settlement · `T04` condition/effect evaluator + schemas + linter · `T05` event picker (weights, cooldowns, follow-ups) · `T06` yearly loop + debug UI · `T07` bot sim harness · `T08` education + exams · `T09` careers · `T10` relationships + family obligation · `T11` quests + achievements + MetaProfile · `T12` endings + obituary + legacy · `T13` save/load/export · `T14` React shell: title, settings, HUD · `T15` avatar layers + character creation · `T16` scene cards + activity UI · `T17` event/summary/ending screens · `T18` Go-Slow Dash **renderer spike (Three.js vs Canvas 2D fallback on a real mid-range Android, gate: ≥ 55 FPS)** → prototype page → pattern generator tests → integration · `T19` content passes (30 → 60 → 90 events) with balance via sims · `T20` audio, tutorial, accessibility, PWA · `T21` share card · `T22` Lighthouse/perf budgets · `T23` playtest + bug bash.

---

## 22. Glossary (excerpt)
- **Owambe:** lively party/celebration, often with a dress code (asoebi). **Asoebi:** matching fabric worn by guests of a celebration.
- **Danfo:** yellow Lagos commercial minibus. **Okada:** motorcycle taxi. **Go-slow:** traffic jam.
- **NEPA/PHCN:** colloquial for the electricity supply ("NEPA don take light").
- **Mama Put / Buka:** small local eatery.
- **JAMB/WAEC:** university entrance and secondary-school certificate exams. **NYSC:** National Youth Service Corps.
- **Japa:** emigrating abroad (Yoruba/Pidgin slang "to run/flee").
- **Ajo / Esusu:** traditional rotating savings groups.
- **Black tax:** informal financial obligation to support extended family.
- **Cowrie:** historic shell currency; used here as meta-currency.
