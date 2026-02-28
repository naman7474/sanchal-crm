# Kavach — Frontend Design Specification
### Insurance Agent Portfolio Manager

---

## 1. Design Philosophy

**The Uncle Test:** Every screen must be usable by a 50-year-old insurance agent in Rohini who only uses WhatsApp and Excel daily. If any feature needs explanation, it needs redesign.

**Core Principle:** This is a *register that thinks* — not a SaaS dashboard. The mental model is the agent's physical diary/register going digital, not Salesforce going cheap.

---

## 2. Aesthetic Direction

| Attribute | Direction |
|-----------|-----------|
| **Tone** | Warm professional — like a good bank app |
| **Density** | Spacious. Generous whitespace. Breathable. |
| **Motion** | Minimal. Only page transitions (150ms ease) and toast notifications. No bouncing, no parallax, no skeleton loaders. |
| **Depth** | Flat with subtle borders. No shadows except on FAB and modals. |
| **Shape** | Softly rounded (8-12px radius). Never sharp, never pill-shaped. |
| **Imagery** | Zero illustrations. Zero stock photos. Data IS the content. |

### Kavach IS:
- Clean & spacious — like a well-organized desk
- Warm & trustworthy — like a senior colleague
- Fast & responsive — like a calculator
- Familiar — like WhatsApp meets Excel

### Kavach is NOT:
- Flashy or animated
- Dense or overwhelming
- Playful or gamified
- Dark-mode-first (agents work in daylight)
- Generic SaaS (no blue-purple gradient hero sections)

---

## 3. Color System

### Primary Palette

```css
/* Primary — Indigo (Trust, Authority) */
--primary-50:  #EEF2FF;
--primary-100: #E0E7FF;
--primary-200: #C7D2FE;
--primary-300: #A5B4FC;
--primary-400: #818CF8;
--primary-500: #6366F1;
--primary-600: #4F46E5;  /* DEFAULT — buttons, nav active, links */
--primary-700: #4338CA;
--primary-800: #3730A3;
--primary-900: #312E81;

/* Accent — Amber (Warmth, Action) */
--amber-50:  #FFFBEB;
--amber-100: #FEF3C7;
--amber-200: #FDE68A;
--amber-300: #FCD34D;
--amber-400: #FBBF24;
--amber-500: #F59E0B;  /* DEFAULT — highlights, attention */
--amber-600: #D97706;
--amber-700: #B45309;
```

### Semantic Colors

```css
/* Status — used ONLY for status indicators */
--success:  #10B981;  /* Active, Renewed, Converted */
--warning:  #F97316;  /* Expiring Soon, Needs Attention */
--danger:   #F43F5E;  /* Expired, Overdue, Lost */
--neutral:  #64748B;  /* Inactive, Cancelled */
--whatsapp: #25D366;  /* WhatsApp actions ONLY */
```

### Background Layers

```css
--bg-page:    #F8FAFC;  /* Slate 50 — full page background */
--bg-card:    #FFFFFF;  /* White — all cards and panels */
--bg-sidebar: #0F172A;  /* Slate 900 — sidebar (desktop) */
--bg-input:   #FFFFFF;  /* White — form inputs */
--bg-hover:   #F1F5F9;  /* Slate 100 — hover states */
--bg-active:  #EEF2FF;  /* Primary 50 — active nav item */
--border:     #E2E8F0;  /* Slate 200 — ALL borders */
```

### Color Rules
1. Never use more than 2 colors in a single card
2. Status colors are ONLY for status — never decorative
3. Amber only for primary CTA or attention-worthy items
4. WhatsApp green ONLY for WhatsApp-related actions
5. No gradients anywhere except the FAB and logo mark
6. All borders are Slate 200 (#E2E8F0), always 1px solid

---

## 4. Typography

### Font: DM Sans (Google Fonts)

Why DM Sans: Warm humanist sans-serif, excellent readability at small sizes, supports Devanagari for future Hindi localization, free, and loads fast from Google Fonts.

**Monospace companion:** DM Mono — for policy numbers, IDs, and code-like values.

```
Google Fonts import:
DM Sans: 300, 400, 500, 600, 700 (normal + italic)
DM Mono: 400, 500
```

### Type Scale

| Name | Size | Weight | Letter Spacing | Usage |
|------|------|--------|---------------|-------|
| Page Title | 28px | 700 | -0.02em | One per page, top-left |
| Section Heading | 20px | 600 | -0.01em | Card titles, section labels |
| Card Title | 16px | 600 | 0 | Stat labels, subsections |
| Body | 14px | 400 | 0 | Default text, descriptions |
| Body Bold | 14px | 600 | 0 | Numbers, key values |
| Small / Caption | 12px | 500 | 0.02em | Timestamps, metadata, badges |
| Mono | 13px | 400 | 0.02em | Policy numbers, IDs (DM Mono) |

### Text Colors

```css
--text-primary:   #0F172A;  /* Slate 900 — headings, key values */
--text-secondary: #334155;  /* Slate 700 — body text */
--text-tertiary:  #64748B;  /* Slate 500 — labels, captions */
--text-muted:     #94A3B8;  /* Slate 400 — timestamps, hints */
--text-link:      #4F46E5;  /* Primary 600 — clickable text */
```

### Number Formatting (Critical for Indian Agents)

| Type | Correct | Wrong |
|------|---------|-------|
| Currency | ₹4,57,733 | 457733 or $457,733 |
| Phone | +91 98999-25956 | 989925956 |
| Dates | 02 Feb 2026 | 2026-02-02 or 02/02/26 |
| Percentages | 42.5% | 0.425 |
| Policy No | D250305121 (monospace) | D250305121 (body font) |

---

## 5. Spacing System

Based on 4px grid. Use Tailwind's default spacing scale.

```
4px   — gap between icon and text
8px   — gap between badges, small elements  
12px  — gap between list items
16px  — card internal padding (mobile), gap between cards
20px  — section gaps
24px  — card internal padding (desktop)
32px  — section margins
48px  — major section separators
```

### Border Radius

```
6px  — badges, small tags
8px  — buttons, inputs, small cards
10px — stat cards, nav items
12px — main cards, panels
24px — phone mockup frame (only)
```

---

## 6. Component Specifications

### 6.1 Buttons

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| Primary | #4F46E5 | white | none | Main action: Save, Add, Submit |
| Secondary | #F1F5F9 | #334155 | none | Cancel, back, secondary actions |
| Success | #059669 | white | none | Confirm renewal, mark complete |
| Danger | #FFF1F2 | #E11D48 | #FFE4E6 | Delete, remove |
| WhatsApp | #25D366 | white | none | Send WhatsApp message |
| Ghost | transparent | #4F46E5 | none | "View All", inline links |

**Sizes:** sm (6px 12px, 13px), md (10px 20px, 14px), lg (12px 28px, 16px)

**Rules:**
- Max 2 buttons side-by-side
- Primary on left, secondary on right
- WhatsApp button only where WhatsApp action makes sense
- Disabled state: 50% opacity, cursor not-allowed
- No icon-only buttons without tooltip

### 6.2 Status Badges

```
Active / Renewed  → bg: #ECFDF5, text: #047857
Expiring Soon     → bg: #FFF7ED, text: #EA580C  
Expired / Overdue → bg: #FFF1F2, text: #E11D48
New Lead          → bg: #EEF2FF, text: #4F46E5
Inactive          → bg: #F1F5F9, text: #475569
```

Padding: 4px 10px. Border radius: 6px. Font: 12px/600.

### 6.3 Stat Cards

- White background, 1px Slate-200 border, 12px radius
- Layout: Label (13px, Slate-500) top → Value (28px, bold, Slate-900) → Change indicator (13px, green/red)
- Icon: 40×40px rounded square, tinted background matching the stat's semantic color
- Max 4 per row desktop, 2 on mobile
- The number should be 2-3× larger than the label text

### 6.4 Data Tables

- Header: Slate-50 background, 12px uppercase text, Slate-500 color, 0.05em letter spacing
- Rows: white background, 14px text, 1px Slate-50 bottom border
- Hover: Slate-50 background
- No alternating row colors
- Click entire row to navigate to detail
- Mobile: collapse to card list (see Section 8)

### 6.5 Form Inputs

- Label: 13px/600, Slate-700, 6px bottom margin
- Required indicator: red asterisk after label
- Input: 14px, 10px 14px padding, 8px radius, 1px Slate-200 border
- Focus: 2px Primary-500 ring (Tailwind `ring-2 ring-indigo-500`)
- Error: Red border + red error text below (13px)
- Placeholder: Slate-400, always include an example value

### 6.6 Navigation

**Desktop Sidebar (≥1024px):**
- Width: 240px (expanded), 64px (collapsed, icons only)
- Background: White with Slate-200 right border
- Logo + wordmark at top
- Nav items: 44px height, 10px 16px padding, 10px radius
- Active: Primary-50 background, Primary-600 text
- Hover: Slate-50 background
- Max 7 items (6 main + settings, separated by divider)
- No nested menus ever

**Mobile Bottom Bar (< 768px):**
- 5 items: Home, Clients, [FAB], Leads, Reports
- Height: 64px + safe area
- FAB: 48×48px, indigo gradient, elevated with shadow, centered
- Active indicator: filled icon + Primary-600 color + dot below

---

## 7. Page Layouts

### Dashboard
```
┌─ Top Bar ──────────────────────────────────┐
│ Greeting + Date + Alert Count    🔍 🔔 👤  │
├────────────────────────────────────────────┤
│ [Stat] [Stat] [Stat] [Stat]               │
├──────────────────────┬─────────────────────┤
│ Expiring This Week   │ Quick Actions       │
│ - Row with action    │ + New Policy        │
│ - Row with action    │ + Add Customer      │
│ - Row with action    │ + New Lead          │
│                      ├─────────────────────┤
│                      │ Today's Follow-ups  │
│                      │ - Name + note       │
│                      │ - Name + note       │
└──────────────────────┴─────────────────────┘
```

### Customer List
```
┌─ Header ───────────────────────────────────┐
│ Customers (247)        [Search] [+Add New] │
├─ Filters ──────────────────────────────────┤
│ [All] [Active] [Prospects] [Inactive]      │
├─ Table ────────────────────────────────────┤
│ Name | Phone | Policies | Premium | Status │
│ ...rows...                                 │
├─ Pagination ───────────────────────────────┤
│              < 1 2 3 ... 12 >              │
└────────────────────────────────────────────┘
```

### Customer Detail
```
┌─ Back + Breadcrumb ────────────────────────┐
├─ Profile Card ─────────────────────────────┤
│ Name    Phone (click-to-call)    Status    │
│ Email   Address                  Source    │
│ [Edit] [WhatsApp] [+ Add Policy]          │
├─ Tabs ─────────────────────────────────────┤
│ [Policies] [Documents] [Activity]          │
├─ Tab Content ──────────────────────────────┤
│ (policy list OR document grid OR timeline) │
└────────────────────────────────────────────┘
```

### Expiring Policies Report
```
┌─ Header ───────────────────────────────────┐
│ Expiring Policies         [Export Excel]   │
├─ Filter Bar ───────────────────────────────┤
│ [Month: Feb 2026 ▾] [Product ▾] [Co. ▾]  │
├─ Summary Bar ──────────────────────────────┤
│ Total: 14  |  Renewed: 8  |  Pending: 4  │
│ Lost: 2    |  Premium at Risk: ₹2.1L      │
├─ Table ────────────────────────────────────┤
│ Customer | Product | Company | End Date    │
│ Premium | Days Left | Status | Actions     │
└────────────────────────────────────────────┘
```

---

## 8. Mobile Specifications

### Breakpoints
```
375px  — Mobile (iPhone SE minimum)
768px  — Tablet
1024px — Desktop (sidebar appears)
1280px — Wide desktop (max container width)
```

### Mobile Navigation
- Bottom tab bar: 5 items (Home, Clients, FAB+, Leads, Reports)
- FAB opens bottom sheet with quick-add options
- No hamburger menu, no sidebar
- Settings via profile avatar → slide-in panel

### Table → Card Transformation
On mobile (< 768px), all data tables become stacked cards:
```
┌─────────────────────────────────┐
│ ┌ Left border colored by status │
│ │ Customer Name      [Badge]    │
│ │ Product · Company             │
│ │ Expires: Date · ₹Premium     │  [💬] [📞]
│ └───────────────────────────────│
└─────────────────────────────────┘
```

Left border: 3px, colored by urgency (green/orange/red)

### Mobile Touch Targets
- Minimum: 44 × 44px for ALL interactive elements
- Bottom bar icons: 48 × 48px
- FAB: 48 × 48px
- Swipe gestures on list items: left = actions, right = quick-mark

### Mobile Forms
- Single column, full-width inputs
- Sticky submit button at bottom
- Keyboard-aware: scroll input into view
- Use native date pickers (HTML date input)
- Phone input: open numeric keyboard (inputmode="tel")

---

## 9. Interaction Patterns

### Feedback
- **Success:** Green toast, top-right, auto-dismiss 3s. "Policy saved ✓"
- **Error:** Red toast, persists until dismissed. Shows specific error.
- **Loading:** Spinner in button (replaces text). Never block the full page.
- **Empty state:** Illustration-free. Just text: "No policies yet. Add your first one." + CTA button.

### Search (Cmd+K / Global)
- Triggered by search icon or Cmd+K keyboard shortcut
- Centered modal overlay with large input
- Searches across: customer names, phone numbers, policy numbers, vehicle numbers
- Shows categorized results: "Customers", "Policies"
- Max 5 results per category

### Confirmations
- Delete actions: always show confirmation dialog
- Bulk actions: show count + confirmation
- Never auto-delete. Never undo via toast (too easy to miss).

---

## 10. Tech Implementation Notes

### Stack
```
Framework:  Next.js 14+ (App Router)
Styling:    Tailwind CSS v3
Components: shadcn/ui (Radix primitives)
Icons:      Lucide React (24px default, 18px in tables)
Charts:     Recharts
Font:       DM Sans + DM Mono (Google Fonts)
State:      TanStack Query (server) + Zustand (client)
Forms:      React Hook Form + Zod validation
```

### Tailwind Config Extensions
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        kavach: {
          DEFAULT: '#4F46E5',
          50: '#EEF2FF',
          600: '#4F46E5',
          700: '#4338CA',
        },
        whatsapp: '#25D366',
      },
    },
  },
};
```

### shadcn/ui Components to Install
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add card
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add command  # for Cmd+K search
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add sheet    # for mobile slide-ins
```

---

## 11. File / Folder Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with sidebar + font loading
│   ├── page.tsx            # Dashboard
│   ├── login/page.tsx
│   ├── customers/
│   │   ├── page.tsx        # Customer list
│   │   ├── new/page.tsx    # Create customer
│   │   └── [id]/
│   │       ├── page.tsx    # Customer detail
│   │       └── edit/page.tsx
│   ├── policies/
│   │   ├── page.tsx
│   │   └── new/page.tsx
│   ├── leads/page.tsx
│   ├── reports/
│   │   ├── page.tsx
│   │   ├── expiring/page.tsx
│   │   └── commission/page.tsx
│   └── settings/page.tsx
├── components/
│   ├── ui/                 # shadcn components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── BottomNav.tsx
│   │   └── TopBar.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── ExpiringList.tsx
│   │   └── FollowUpList.tsx
│   ├── customers/
│   │   ├── CustomerForm.tsx
│   │   └── CustomerCard.tsx
│   ├── policies/
│   │   ├── PolicyForm.tsx
│   │   ├── PolicyTable.tsx
│   │   └── CommissionCalc.tsx
│   └── shared/
│       ├── StatusBadge.tsx
│       ├── SearchDialog.tsx
│       ├── EmptyState.tsx
│       └── FileUpload.tsx
├── lib/
│   ├── supabase.ts
│   ├── utils.ts            # formatCurrency, formatDate, formatPhone
│   └── constants.ts        # product types, policy types, companies
└── styles/
    └── globals.css         # Tailwind imports + custom variables
```