# Hotdog Not Hotdog -- Design Guidelines

## The Vibe: "Jian Yang's Fever Dream meets SF Underground Comics"

This is NOT a corporate product. This is a deeply unserious hotdog stand that happens to use bleeding-edge ZK proofs and streaming micropayments. The design should feel like a late-night Tenderloin food cart flyer crossed with a 90s comic book splash page crossed with the actual Not Hotdog app from Silicon Valley. If someone opens this and thinks "this looks like it was built at a Fortune 500 company," we have failed.

Think: Robert Crumb drew a crypto app. Think: the Jian Yang "Not Hotdog" app had a baby with a bootleg SF zine. Think: if Erlich Bachman designed a payment terminal while high.

---

## Core Design Principles

### 1. Maximum Personality, Zero Corporate Energy
- Every screen should have character. No sterile card-in-a-void layouts.
- UI elements should feel hand-crafted, not generated from a design system.
- Error messages should be funny. Loading states should be entertaining. Even the admin panel should make you smile.

### 2. Chaotic Good
- The layout can be unexpected, but it must still be usable. Wacky != broken.
- Animations should be delightful but not blocking. Nobody waits 3 seconds for a hotdog to spin before they can click.
- Accessibility still matters -- readable text, sufficient contrast on interactive elements, keyboard navigation works.

### 3. The Hotdog Is the Hero
- The hotdog is our mascot, our icon, our spiritual guide. It appears everywhere. It's watching. It knows.
- Not a corporate vector hotdog. A WEIRD hotdog. Wobbly, expressive, slightly unsettling.

---

## Color Palette

Forget the current zinc-on-black SaaS palette. We're going loud.

### Primary Colors
| Name | Hex | Usage |
|---|---|---|
| **Mustard Yellow** | `#FFD700` | Primary action color, highlights, headings |
| **Ketchup Red** | `#FF2E2E` | Danger states, blacklisted tier, accents |
| **Relish Green** | `#39FF14` | Success states, VIP tier, "you're in" |
| **Stand Orange** | `#FF6B1A` | Secondary actions, hotdog-adjacent UI |

### Background & Surface
| Name | Hex | Usage |
|---|---|---|
| **Night Cart Black** | `#0D0D0D` | Page background -- keep it dark, the colors pop harder |
| **Grill Smoke** | `#1A1A2E` | Card backgrounds, elevated surfaces (slight blue undertone like night) |
| **Wrapper Paper** | `#2A2A3D` | Secondary surfaces, input fields |
| **Grease Stain** | `#3D3D56` | Borders, dividers |

### Text
| Name | Hex | Usage |
|---|---|---|
| **Bun White** | `#F5F0E8` | Primary text (warm white, not clinical) |
| **Napkin Gray** | `#9B95A0` | Secondary text, labels |
| **Pencil Scrawl** | `#6B6575` | Disabled text, hints |

### Tier-Specific Accent Colors
- **VIP**: Relish Green `#39FF14` with a neon glow effect (`box-shadow: 0 0 20px #39FF1440`)
- **Regular**: Mustard Yellow `#FFD700`
- **Blacklisted**: Ketchup Red `#FF2E2E` with screen shake on reveal

---

## Typography

### Fonts to Load (via Google Fonts / next/font)

1. **Headings: `Bangers`** -- A comic book display font. ALL CAPS energy. Use for page titles, tier reveals, the big moments.
2. **Body: `Space Grotesk`** -- Slightly quirky geometric sans-serif. Techy but not boring. Use for body text, labels, descriptions.
3. **Mono/Data: `JetBrains Mono`** -- For wallet addresses, channel IDs, amounts, transaction hashes. The crypto stuff should look crypto.

### Type Scale
- Hero text (tier reveal): `64-80px`, Bangers, with text-shadow or stroke effect
- Page title: `36-48px`, Bangers
- Section header: `24px`, Space Grotesk Bold
- Body: `16px`, Space Grotesk Regular
- Caption/metadata: `12-14px`, Space Grotesk or JetBrains Mono
- Wallet/hash display: `12px`, JetBrains Mono

### Text Effects (use sparingly, for emphasis)
- **Comic stroke**: `-webkit-text-stroke: 1px black` on hero text over busy backgrounds
- **Neon glow**: `text-shadow: 0 0 10px currentColor` for VIP tier text
- **Shake**: CSS `@keyframes shake` on blacklisted verdict text

---

## Meme Assets (docs/ folder) -- USE THESE

We have actual meme images that MUST be featured prominently. These are the soul of the app. Copy them into `public/images/` and use them as the primary visual elements.

### Asset Inventory

| File | What It Is | Where to Use |
|---|---|---|
| `jianyang.png` | Jian Yang (SeeFood founder) in his red Adidas jacket & aviators on a news segment. "SEEFOOD FOUNDER LAUNCHES NOT HOT DOG APP" chyron. The absolute legend. | **Login page hero image**. This is the face of the operation. Display prominently with a neon glow or comic-book halftone filter over it. He IS the brand. |
| `hotdog.jpg` | Jian Yang's floating head (glasses, slight smirk) next to a hotdog on **green background**. Bold yellow text: "hotdog". The approval meme. | **VIP verdict reveal** AND **Regular verdict reveal**. This is the "you're in" moment. The green bg already matches our Relish Green VIP energy. Blow it up full-width behind the verdict text. |
| `not-hotdog.jpg` | Jian Yang's floating head (disgusted/angry frown) next to a hotdog on **red background**. Bold yellow text: "Not hotdog". The rejection meme. | **Blacklisted verdict reveal**. Perfect. Red bg = Ketchup Red. His disappointed face IS the access denied screen. Make this dominate the viewport on blacklist. |
| `cheap-hotdog.jpg` | Jian Yang's floating head (big happy grin) next to a hotdog on **blue background**. Bold yellow text: "cheap hotdog". The VIP special. | **VIP price reveal moment** or **stand page header for VIP users**. The joy of getting the discount dog. Could also work as the VIP verdict variant if you want to differentiate VIP from Regular. |

### How to Use the Memes

- **DO**: Make them BIG. These should be the centerpiece of their respective screens, not thumbnails.
- **DO**: Apply CSS effects to make them feel integrated -- halftone dot overlay (`mix-blend-mode`), slight `rotate(-2deg)`, comic-book drop shadow (`4px 4px 0 black`), or a torn-paper border effect.
- **DO**: Layer the verdict text ON TOP of the meme image. "YOU MAY BUY" in massive Bangers font over the `hotdog.jpg` image. "YOU MAY NOT BUY" stamped over `not-hotdog.jpg`.
- **DO**: Use `jianyang.png` as the "proprietor" of the hotdog stand on the login page -- he's the guy running this operation.
- **DON'T**: Shrink them into tiny icons. They need breathing room.
- **DON'T**: Put them in clean white-bordered frames. Let them bleed to the edges, overlap other elements, feel chaotic.
- **DON'T**: Use them without visual treatment. Raw JPGs look flat -- add CSS filters, borders, or overlays to integrate them into the comic book aesthetic.

### CSS Treatment Ideas for Meme Images
```css
/* Comic book halftone overlay */
.meme-img {
  position: relative;
  filter: contrast(1.1) saturate(1.2);
}
.meme-img::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, #000 1px, transparent 1px);
  background-size: 4px 4px;
  mix-blend-mode: multiply;
  opacity: 0.15;
  pointer-events: none;
}

/* Comic book border */
.meme-frame {
  border: 4px solid black;
  box-shadow: 6px 6px 0 rgba(0,0,0,0.8);
  transform: rotate(-2deg);
}

/* Verdict meme -- fills the background */
.verdict-bg {
  background-size: cover;
  background-position: center;
  filter: brightness(0.6) contrast(1.2);
  /* Text sits on top with text-shadow for legibility */
}
```

### Visual Hierarchy Per Screen (with Memes)

1. **Login `/`**: `jianyang.png` as hero -- maybe a circular crop with comic-book border, or full image with a vignette. Title text overlays or sits beside him. He's the proprietor.
2. **Prove `/prove`**: No meme needed here -- this is the suspense build-up. Use animated effects and dramatic text instead. The meme payoff comes on the next screen.
3. **Verdict `/verdict`**: THE MEME MOMENT.
   - VIP: `cheap-hotdog.jpg` as full-bleed background, "YOU MAY BUY CHEAP" stamped over it
   - Regular: `hotdog.jpg` as full-bleed background, "YOU MAY BUY" stamped over it
   - Blacklisted: `not-hotdog.jpg` as full-bleed background, "YOU MAY NOT BUY" stamped over it, screen shake
4. **Stand `/stand`**: Smaller meme presence -- maybe `hotdog.jpg` or `cheap-hotdog.jpg` as a corner badge/mascot. The functional UI takes priority here.
5. **Admin `/admin`**: `jianyang.png` small in the header corner. "Jian Yang's Back Office."

---

## Visual Language & Illustration Style

### The Meme-First Approach
Since we have actual Jian Yang meme images, these REPLACE the need for custom illustrated hotdog characters. The memes ARE the characters. Jian Yang's various facial expressions across the four images give us all the emotional range we need:
- **Aviator sunglasses Jian Yang** (jianyang.png) = cool, confident, "I run this stand"
- **Smirking Jian Yang** (hotdog.jpg) = approval, "you pass"
- **Disgusted Jian Yang** (not-hotdog.jpg) = rejection, "you are not worthy"
- **Happy Jian Yang** (cheap-hotdog.jpg) = delight, "you get the good price"

For any additional illustration needs beyond what the memes cover, fall back to:
- Emoji (liberally)
- Simple CSS shapes (circles, lines, starbursts)
- Hand-drawn-style SVG elements if time permits

### Background Textures & Patterns
- Subtle **halftone dot pattern** overlay on dark backgrounds (comic book feel) -- can be done with CSS `radial-gradient` repeating pattern or an SVG filter
- **Starburst/action lines** behind the tier reveal moment -- radiating lines from center
- Optional: faint **city skyline silhouette** at bottom of screens (SF vibes)

### Iconography
- Avoid clean geometric icons. If you need icons, prefer hand-drawn style or use emoji liberally.
- Emoji are actually great here -- they match the unserious energy: `🌭 ✅ ❌ 💥 🔐 🧾 🔥 💰 🚫`

---

## Screen-by-Screen Design Direction

### `/` -- Login ("THE ENTRANCE")
**Vibe**: You're walking up to a sketchy-but-legendary late-night hotdog cart. A neon sign flickers. Jian Yang himself is here, running the show.

- **Background**: Dark with subtle animated stars or city night texture
- **Hero element**: `jianyang.png` -- the SeeFood founder in his red Adidas jacket and aviators. Crop to a circle or rounded rectangle with a thick comic-book border (`4px solid black, box-shadow: 6px 6px 0 black`). Position him prominently above or beside the title. He's the face of this operation. Optionally add a halftone overlay to give it that printed-zine feel.
- **Neon sign effect**: The title should glow like a neon sign. CSS `text-shadow` stacking:
  ```css
  text-shadow:
    0 0 7px #FFD700,
    0 0 10px #FFD700,
    0 0 21px #FFD700,
    0 0 42px #FF6B1A,
    0 0 82px #FF6B1A;
  ```
- **Subtitle**: "ZK-Gated Hotdog Stand" in a hand-stamped or stencil style. Below it: _"Prove your domain. Get your dog."_
- **Login button**: Big, chunky, rounded. Mustard Yellow background, dark text, slight `rotate(-2deg)` tilt. On hover, it wiggles (CSS keyframe). Text: "SIGN IN WITH GOOGLE" or "ENTER THE STAND"
- **Feature pills** (ZK, Tiered Pricing, MPP): Replace the current clean cards with badge-style pills that look like stickers or stamps. Maybe slightly rotated, overlapping.
- **Footer**: "Powered by Privy + Tempo Chain" in small text, but styled like a receipt or rubber stamp

### `/prove` -- ZK Proof Generation ("THE BOUNCER")
**Vibe**: You're being evaluated. The hotdog bouncer is staring you down.

- **Hotdog character**: Suspicious face, arms crossed, wearing a bouncer earpiece
- **Progress indicator**: NOT a boring spinner. Options:
  - A hotdog being slowly assembled (bun appears, then dog, then mustard, then ketchup) as proof progresses
  - A "SCANNING..." effect with retro scanlines sweeping over the user's email domain
  - A comic-panel sequence: Panel 1: "ANALYZING DOMAIN..." Panel 2: "CRUNCHING ZK MATH..." Panel 3: "VERDICT INCOMING..."
- **Status text**: In Bangers font, should feel like comic book narration boxes
  - "PROVING YOUR DOMAIN..." (yellow text)
  - "THE HOTDOG JUDGES YOU..." (dramatic)
  - "SUBMITTING TO THE COUNCIL OF WIENERS..." (funny)
- **Background**: Darker, more dramatic. Maybe subtle pulsing glow around the hotdog character
- **Error state**: Hotdog character looks confused/broken. "THE PROOF HAS FAILED. THE HOTDOG IS DISAPPOINTED."

### `/verdict` -- Tier Reveal ("THE MOMENT OF TRUTH")
**Vibe**: This is THE demo moment. It should feel like opening a loot crate, a game show reveal, a comic book splash page.

#### VIP Reveal
- **Full-bleed background**: `cheap-hotdog.jpg` (happy Jian Yang, blue bg) -- use as `background-image` covering the viewport, dimmed to ~60% brightness so text reads on top
- **Starburst overlay**: CSS animated radiating lines on top of the meme background
- **Title**: "YOU MAY BUY CHEAP" in massive Bangers font (72-80px), Relish Green, neon glow, `-webkit-text-stroke: 2px black` for legibility over the busy background
- **Confetti or sparkle particle effect** (lightweight CSS/canvas, not a heavy lib)
- **Price card**: Styled like a VIP backstage pass or golden ticket. Skeuomorphic -- gold border, embossed feel. Floats over the meme background with a strong drop shadow.
- **Enter button**: Pulsing green glow, text says "ENTER THE VIP LOUNGE" or "GET YOUR DISCOUNT DOGS"

#### Regular Reveal
- **Full-bleed background**: `hotdog.jpg` (smirking Jian Yang, green bg) -- dimmed slightly, the "hotdog" text in the meme becomes part of the design
- **Title**: "YOU MAY BUY" in Bangers, Mustard Yellow, with black stroke
- **Price card**: Styled like a regular admission ticket. Clean but fun.
- **Enter button**: "STEP RIGHT UP" in Stand Orange

#### Blacklisted Reveal
- **Full-bleed background**: `not-hotdog.jpg` (disgusted Jian Yang, red bg) -- this IS the rejection screen. Dim to ~50% and let his disappointed face tell the story.
- **Screen shake animation** (`@keyframes shake` on the entire container) on page load -- the whole viewport trembles
- **Title**: "YOU MAY NOT BUY" in massive Ketchup Red Bangers font, with a rubber-stamp "DENIED" overlay rotated at `rotate(-15deg)`, semi-transparent white/red border
- **Dramatic effect**: Brief screen flash to solid red (200ms), then fades to reveal the meme + verdict
- **Body text**: "The wiener rejects you. Begone." or "Not hotdog. Not welcome."
- **Button**: Subdued "slink away" button to go back. Styled like a sad exit. Text: "leave in shame"

### `/stand` -- Hotdog Stand ("THE CART")
**Vibe**: You're at the cart. The hotdog vendor is serving. It's a transaction interface but it should feel like a street food menu board.

- **Header**: Chalkboard/menu board aesthetic for the stand name and tier info. Think hand-lettered diner menu.
- **Stats panel**: Styled like a receipt printer or a diner check:
  - Hotdog count: BIG number, each hotdog purchased adds a small hotdog emoji that drops in with a bounce animation
  - Spent amount: Looks like a running tab
  - Channel ID: Monospace, truncated, styled like a receipt serial number
- **Hotdog display area**: The emoji hotdogs are fine, but arrange them like they're on a grill or in a pile. Maybe in a zigzag pattern, not a grid.
- **"ORDER HOTDOG" button**: THE most important button in the app.
  - Massive, impossible to miss
  - Mustard Yellow with dark text in Bangers font
  - On hover: button expands slightly, maybe a sizzle effect (subtle glow)
  - On click: brief "SIZZLE" animation, button says "GRILLING..." with a fire emoji
  - After success: a new hotdog emoji drops into the display with a satisfying bounce
- **"Leave Stand" button**: Smaller, less prominent. "CLOSE TAB & BOUNCE"
- **Session closed state**: Receipt-style layout. "YOUR TAB" at the top. Itemized list. Total at bottom with a double-underline. Hotdog character waving goodbye with a tear.

### `/admin/rules` -- Admin Dashboard ("THE BACK OFFICE")
**Vibe**: The admin panel doesn't need to be as wild, but it should still be fun. Think "employee break room" or "manager's clipboard."

- **Header**: "THE BACK OFFICE" or "WIENER MANAGEMENT CONSOLE" in Bangers
- **Table**: Styled like a diner order pad or a clipboard checklist. Alternating row colors but using the warm palette, not boring gray stripes.
- **Tier badges**: Color-coded pills -- green for VIP, yellow for regular, red with a skull or X for blacklisted
- **Add rule form**: Looks like filling out an order slip. "ADD NEW DOMAIN RULE" with a rubber stamp button

---

## Animation & Motion Guidelines

### Principles
- **Entrance animations**: Elements should feel like they're being slapped onto the page, not gently fading in. Use `scale` + slight `rotate` + `opacity` for a "stamp" effect.
- **Transitions between pages**: If possible, a brief "comic panel wipe" transition. If not, at minimum a quick `fade + slide-up`.
- **Idle animations**: Subtle. The hotdog character can have a gentle `hover` / breathing animation. Neon signs can flicker occasionally.
- **Success moments**: Go big. The hotdog order success, the VIP reveal -- these deserve confetti, bounces, flashes.
- **Error moments**: Quick shake, red flash, then settle. Don't dwell on failure.

### Specific Animations (CSS keyframes, no heavy JS libs)
```
@keyframes wobble       -- for buttons on hover (slight rotation oscillation)
@keyframes neonFlicker  -- for neon sign text (opacity pulses)
@keyframes dropIn       -- for hotdog emojis appearing (translateY + bounce)
@keyframes shake        -- for error/blacklist (translateX oscillation)
@keyframes starburst    -- for VIP reveal (scale + rotate on background rays)
@keyframes sizzle       -- for order button active state (scale pulse + glow)
```

---

## Component Patterns

### Buttons
- **Primary (Order/Enter)**: Large, rounded-2xl, Mustard Yellow bg, dark text, Bangers font, slight shadow, wobble on hover. `min-height: 56px`.
- **Secondary (Leave/Back)**: Outlined, Grease Stain border, Napkin Gray text, no fill. Understated.
- **Danger (Blacklist)**: Ketchup Red bg, white text, slight glow.
- All buttons should have a `transform: rotate(-1deg)` or `rotate(1deg)` -- nothing is perfectly aligned at a hotdog cart.

### Cards / Panels
- Rounded corners (`border-radius: 16px`)
- Grill Smoke background with Grease Stain border
- Optional: Very subtle `box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)` for depth
- Content inside should have generous padding (24px+)

### Input Fields
- Wrapper Paper background
- Grease Stain border, 2px
- On focus: Mustard Yellow border with subtle glow
- Placeholder text in Pencil Scrawl color
- Slightly rounded (`border-radius: 12px`)

### Badges / Pills
- Small, rounded-full
- Tier colors as background with dark text
- Slight `rotate(-3deg)` to `rotate(3deg)` -- randomize per badge for a sticker-on-a-notebook feel
- Font: Space Grotesk Bold, uppercase, `letter-spacing: 0.05em`

### Toast / Notifications
- Slide in from bottom-right
- Dark background with colored left border (green=success, red=error, yellow=info)
- Include a tiny hotdog emoji prefix
- Auto-dismiss after 4 seconds

---

## Tailwind Configuration Guidance

Update `tailwind.config.ts` to include the custom palette:

```ts
theme: {
  extend: {
    colors: {
      mustard: '#FFD700',
      ketchup: '#FF2E2E',
      relish: '#39FF14',
      'stand-orange': '#FF6B1A',
      'night-cart': '#0D0D0D',
      'grill-smoke': '#1A1A2E',
      'wrapper-paper': '#2A2A3D',
      'grease-stain': '#3D3D56',
      'bun-white': '#F5F0E8',
      'napkin-gray': '#9B95A0',
      'pencil-scrawl': '#6B6575',
    },
    fontFamily: {
      bangers: ['Bangers', 'cursive'],
      body: ['Space Grotesk', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    animation: {
      wobble: 'wobble 0.5s ease-in-out',
      'neon-flicker': 'neonFlicker 3s infinite',
      'drop-in': 'dropIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      shake: 'shake 0.5s ease-in-out',
      sizzle: 'sizzle 0.3s ease-in-out',
    },
  },
},
```

---

## What We Are NOT Doing

- No gradients that look like a fintech landing page
- No "hero section with a macbook mockup"
- No clean, symmetric grid layouts (asymmetry is our friend)
- No stock photography
- No "Sign up for our newsletter" energy
- No design system that looks like it came from a Figma community file called "SaaS Dashboard UI Kit"
- No subtle gray-on-white minimalism
- No smooth ease-in-out transitions that take 800ms (we are SNAPPY)

---

## Reference Mood Board (Describe, Not Link)

When implementing, channel the energy of:
- **Silicon Valley's Not Hotdog app** -- the absurd seriousness of a joke product
- **Underground SF show flyers** -- hand-drawn, photocopied, layered, chaotic typography
- **90s comic book splash pages** -- bold outlines, action lines, dramatic angles
- **Japanese street food signage** -- dense, colorful, unapologetic
- **Retro arcade game UIs** -- chunky text, bright colors on black, score counters
- **Pop Art / Roy Lichtenstein** -- halftone dots, primary colors, bold outlines

---

## Quick Reference: Jian Yang Quotes for Copy Inspiration

Use this energy for UI copy, error messages, loading states, and tooltips:

- "This is your house? It's very... not good." --> Error states
- "I have been known to be quite the drinker." --> Loading/idle states
- "Is your refrigerator running? This is Mike Hunt." --> 404 / unexpected states
- "HOTDOG. NOT HOTDOG." --> The entire thesis
- "Erlich Bachman, this is you as an old man. I'm ugly and I'm dead. Alone." --> Blacklisted tier messaging (channeling the energy, not the exact quote)

Flavor text suggestions for the app:
- Login: "Step right up, prove your wiener-worthiness"
- Proving: "The Hotdog Council convenes..."
- VIP: "You are a friend of the wiener"
- Regular: "You may purchase tube meat at standard rates"
- Blacklisted: "The wiener rejects you. Begone."
- Ordering: "One glizzy, coming right up"
- Session close: "Your tab has been settled. The wiener remembers."

---

## Implementation Priority

1. **Colors + Typography** -- Swap the palette and fonts first. Biggest visual bang for the buck.
2. **Login page redesign** -- First impression. Neon sign + hotdog character.
3. **Verdict page** -- THE demo moment. Starburst, shake, confetti.
4. **Stand page** -- Menu board aesthetic, big order button, receipt layout.
5. **Prove page** -- Comic panel progress, bouncer hotdog.
6. **Admin page** -- Light touch, just make it not boring.
7. **Animations** -- Polish layer. Add wobbles, drops, flickers last.
8. **Hotdog character illustrations** -- If time allows, custom SVGs. If not, emoji + CSS effects carry the vibe.
