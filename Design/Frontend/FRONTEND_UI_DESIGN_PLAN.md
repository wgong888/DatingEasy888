# Adult Social Chat - Frontend UI Design Plan (Based on 21 Screenshots)

## Executive Summary
This is a comprehensive frontend design specification based on actual UI mockups. The application is a dating/social chat platform (Best Dates / Horizon Singles) with a responsive design for desktop and mobile.

The customer-facing interface must remain simple, compact, robust, and easy to
use. It is designed mobile-first because the phone is the primary customer
device. Every customer workflow must work at supported phone widths before
desktop enhancements are accepted.

Mobile-first does not mean a reduced customer product. Registration, profile,
discovery, favorites, chat, gifts, credits, safety, and account management
must remain complete on phones. Desktop may use additional space, but it must
not become the only usable path for a customer action.

---

## 1. Navigation Flow & Screen Map

### Complete User Journey

```
┌──────────────────┐
│  FrontUI0.png    │ ← Landing/Login Page
│  "Horizon Single"│
└────────┬─────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
[Login]   [Sign Up]
    │          │
    │          └─────────┐
    │                    ▼
    │            FrontUI010501-010509
    │            (9-step Profile Wizard)
    │                    │
    └────────┬───────────┘
             ▼
    ┌─────────────────────┐
    │ FrontUI01.png       │
    │ Dashboard/Main Hub  │
    │ (Active Chats)      │
    └────────┬────────────┘
             │
    ┌────────┼────────┬─────────┬───────────┬─────────┐
    ▼        ▼        ▼         ▼           ▼         ▼
 Search   Inbox   Chats    Newfeed      People    Active
(0101)   (0102)  (0103)    (0104)      (0105)    (0106)
 FrontUI Frontui FrontUI  FrontUI
 0101    0102a   0103     0104

    │
    └─► FrontUI0105 (People/Browse Profiles)
         │
         ├─► FrontUI0105-1 (Buy Credits)
         │    └─► FrontUI0105-1-1 (Payment Method)
         │
         └─► FrontUI010601 (Search Filters)

    │
    └─► FrontUI0103 (Chat/Messaging Interface)
         └─► Real-time message exchange with gifts/emojis

    └─► FrontUI010101 (Search Filters Detail)
```

---

## 2. Screen-by-Screen Detailed Specifications

### **Screen 1: FrontUI0.png - Login/Registration Landing Page**

**Purpose:** Entry point for new and existing users

**Design Features:**
- Dark purple/navy background with gradient
- "Horizon Singles" branding logo (pink/magenta)
- Two main CTAs:
  - "Sign Up for Free!" (pink/coral button)
  - "LOG IN" (pink button, top right)
- Social login options: Google, Microsoft, Yahoo
- Cookie consent banner at bottom
- Sample user profiles on sides (carousels)

**Layout:**
```
┌─ HEADER ────────────────────────────────────────┐
│  Logo                      Google  MS  Yahoo  LOG IN │
├─────────────────────────────────────────────────┤
│                                                 │
│  Left Sidebar          Center Content      Right Sidebar
│  Sample Profile    "Want to see more     Sample Profile
│  Photo/Name        profiles?"            Photo/Name
│  Age               "Sign up for Free!"   Age
│                    Main description      
│                    [Sign Up Button]      
│                    [LOG IN link]         
│                                         │
├─────────────────────────────────────────────────┤
│ Cookie consent: [Show more] [Accept all]      │
└─────────────────────────────────────────────────┘
```

**Key Data Fields:**
- Email/Username
- Password  
- Age verification (18+)
- Consent checkbox

**API Calls:**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/verify-age`

---

### **Screens 2-10: FrontUI010501-FrontUI010509 - 9-Step Profile Creation Wizard**

**Overall Structure:**
- Multi-step wizard with "Cancel editing" button (top right)
- Each step has a "Save" button (orange, bottom)
- Progress indication (implicit from step number)

#### **Step 1 - FrontUI010501: Basic Profile Info**
**Fields:**
- [ ] Name (text input)
- [ ] Profile photo placeholder with edit icon
- [ ] Online status indicator (green dot)

#### **Step 2 - FrontUI010502: Additional Profile Setup**

#### **Step 3 - FrontUI010503: Birthday & Location**
**Fields:**
- Birthday: Month (dropdown) + Day (dropdown) + Year (dropdown)
  - Example: DEC 08 1972
- Country (dropdown) - "United States"
- City (dropdown/search) - "Temple City"
- Marital Status (dropdown) - "Divorced"

#### **Step 4 - FrontUI010504: Professional & Language Info**
**Fields:**
- Field of work (dropdown) - "Engineering"
- English level (dropdown) - "Advanced"
- Languages (multi-select)
  - Tag-based: "English ✕", "Mandarin ✕"
  - Add more option: "Select other languages"
- Personality traits (expandable section)

#### **Step 5 - FrontUI010505: Personality & Interests Selection**
**Traits Section:**
- "You may select up to 3 options"
- Tag-based selection: honest, cheerful, moody, self-confident (selected), optimistic, calm, grateful (selected), thoughtful, kind, humorous...
- Visual: Orange border for selected items

**Interests Section:**
- "You may select up to 5 options"
- Options: Traveling (selected), Football, Watching TV, Baseball, Music, Cars, Basketball, Cooking (selected), Pets, Working out, Computer games, Dancing, Arts, Gardening, Fishing, Hunting, Hockey, Reading, Boxing, Fashion, Nature, Soccer, Biking, Tennis (selected), Astrology, Golf, Photography, Fitness, Yoga, Volunteering, Shopping, Other...

#### **Step 6 - FrontUI010506: Movies & Music Preferences**
**Movies Section:**
- "You may select up to 3 options"
- Options: Documentary (selected), Animation, Comedy, Adventure (selected), Horror, Action (selected), Thriller, Drama, Romcom, Western, Science fiction, Crime film, Historical drama, Fantasy, Don't like movies

**Music Section:**
- "You may select up to 3 options"
- Options: Rock, Pop, Electronic, Classical music (selected), Jazz, Hip-hop, Melomaniac, Country (selected), Folk (selected), Don't like music

#### **Step 7 - FrontUI010507: Dating Goals & Preferences**
**Looking For Section:**
- Goal (up to 3): chatting, finding a friend (selected), having fun, get attention, I am bored, other
- Age range: From [40] To [55] (range sliders)

#### **Step 8 - FrontUI010508: Gender & Personal Details**
**Fields:**
- Gender & Looking For (dropdown): "I am a man looking for a woman"
- Personality (dropdown): "Career chaser"
- Story (large text area): "I was a successful business man in China..."

#### **Step 9 - FrontUI010509: Public Photos & Profile Completion**
**Fields:**
- Public photos (collapsible section)
- Private photos (collapsible section)  
- Bio (expandable text)
- Name (text input) - "Billy"
- Save button at bottom

**Photo processing:**
- Accept safely readable picture sources and automatically convert the output to JPG or PNG.
- Preserve transparency with PNG; use JPG for ordinary photographs.
- Customer-uploaded pictures are automatically resized and compressed to fit within 100 x 100 pixels.
- Aspect ratio is preserved and smaller pictures are not enlarged.
- Show the processed preview before saving.

---

### **Screen 11: FrontUI01.png - Dashboard/Main Hub**

**Purpose:** Main dashboard showing active chats and recent conversations

**Layout:**
```
┌─ HEADER ────────────────────────────┐
│  Logo          Search  Profile  Settings
├──────────────────────────────────────┤
│ [All chats] [Active] [Requests]     │
│                (7)      (8)          │
├──────────────────────────────────────┤
│ Wendy              3:37 am     [1]   │
│ 💬 "If the person you're going to.. │
│                                     │
│ Claudia            3:19 am          │
│ 💬 "Did you expect me to message..." │
│                                     │
│ Kurstine           3:18 am     [1]  │
│ 💬 "Maybe you can help me..."       │
│                                     │
│ Lucero             Jun 5       [1]  │
│ 💬 "Age doesn't matter..."         │
│                                     │
│ Natalia            (message)        │
├──────────────────────────────────────┤
│ Search Messages Mail Newsfeed People │
│  (15)    (26)           │
└──────────────────────────────────────┘
```

**Key Components:**
- [ ] Chat list with user avatar
- [ ] Last message preview (truncated)
- [ ] Unread badge (orange number)
- [ ] Timestamp (3:37 am, Jun 5)
- [ ] Online status indicator (green dot)
- [ ] Tab navigation at bottom (5 tabs)
- [ ] Notification badges on tabs (orange numbers)

**Data Displayed per Chat:**
- User name
- User avatar (circular)
- Last message text (preview)
- Timestamp
- Unread count
- Online status

---

### **Screen 12: FrontUI0101.png - Search/Browse Profiles**

**Purpose:** Browse available profiles (All, Online, Following filters)

**Layout:**
```
┌─ HEADER ────────────────────────────┐
│  Logo          Search  Profile  Menu │
├──────────────────────────────────────┤
│ Profiles                             │
│ [All]  [Online]  [Following]  Filters│
├──────────────────────────────────────┤
│ ┌─────────────┐ ┌──────────────────┐│
│ │             │ │                  ││
│ │  Profile    │ │   Profile #2     ││
│ │  Photo      │ │   Photo          ││
│ │             │ │                  ││
│ │ [❤ heart]   │ │  [❤ heart]       ││
│ └─────────────┘ └──────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Profile #3                      │ │
│ │  ...                             │ │
│ └─────────────────────────────────┘ │
│                                     │
├──────────────────────────────────────┤
│ Search Messages Mail Newsfeed People │
└──────────────────────────────────────┘
```

**Features:**
- [ ] Profile cards (2-column grid on desktop)
- [ ] Heart/Like button (top right)
- [ ] Filter tabs: All, Online, Following
- [ ] "Filters" link (top right)
- [ ] Responsive grid layout

---

### **Screen 13: FrontUI010101.png - Search Filters Modal**

**Purpose:** Advanced search filtering options

**Form Fields:**
- [ ] Cancel / Reset buttons
- From: Country (dropdown) - "Select country"
- Age: From [40] To [55] (dropdowns with range)
- "I'm looking for": Dropdown - "I am a man looking for a woman"
- [Show people] button (orange, full-width)

---

### **Screen 14: FrontUI0102a.png - Inbox/Mail Tab**

**Purpose:** View messages and notifications

**Layout:**
```
┌─ HEADER ────────────────────────────┐
│  Logo          Search  Profile  Menu │
├──────────────────────────────────────┤
│ [Inbox]  [Starred]  [Outbox]  [Trash]│
│                                    │
│ Show only new [toggle]             │
├──────────────────────────────────────┤
│ Lian Feng, 50  🔔                │
│ FREE  3:47 am        [1]          │
│ "i have passport, i have business..."│
│ ⭐                                 │
│                                    │
│ Qing Qing, 32  🔔                │
│ FREE  3:42 am                     │
│ "Nice to meet you here. A simple..."│
│                                    │
│ Daria, 24  🔔                    │
│ FREE  3:39 am                     │
│ 📷 "Can I show you something..."   │
│                                    │
│ Vanessa Andrea, 24  🔔           │
│ (No message text shown)             │
├──────────────────────────────────────┤
│ Search Messages Mail Newsfeed People │
└──────────────────────────────────────┘
```

**Key Features:**
- [ ] Message list with user info
- [ ] Message status: "FREE" badge (green)
- [ ] Timestamp
- [ ] Unread indicator (orange number)
- [ ] Message preview (text or media type)
- [ ] Star/favorite option
- [ ] Tabs: Inbox, Starred, Outbox, Trash
- [ ] Toggle: "Show only new"

---

### **Screen 15: FrontUI0103.png - Chats/Active Conversations**

**Purpose:** List of active conversations

**Similar layout to Inbox** but focused on ongoing chats rather than messages.

---

### **Screen 16: FrontUI0104.png - Newfeed/Activity Feed**

**Purpose:** Timeline of activities from other users

**Layout:**
```
┌─ HEADER ────────────────────────────┐
│  Logo          Search  Profile  Menu │
├──────────────────────────────────────┤
│ Feed                                │
│ [All posts]  [⭐ Following]          │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │ Helen    [⭐] [⋮]                 │ │
│ │ "Could certain conversations     │ │
│ │  feel meaningful not because...  │ │
│ │  [see more]                      │ │
│ │                                  │ │
│ │ [Post image - profile photo]     │ │
│ └──────────────────────────────────┘ │
│                                     │
│ More posts...                       │
├──────────────────────────────────────┤
│ Search Messages Mail Newsfeed People │
└──────────────────────────────────────┘
```

**Features:**
- [ ] Post card with user info
- [ ] Post image/preview
- [ ] Like/favorite button
- [ ] More options menu (⋮)
- [ ] "see more" link for truncated text
- [ ] Tab: All posts / Following

---

### **Screen 17: FrontUI0105.png - People/User Profile Page**

**Purpose:** View own profile summary

**Layout:**
```
┌─ HEADER ────────────────────────────┐
│  Logo          Search  Profile  Menu │
├──────────────────────────────────────┤
│              Profile Photo           │
│         Billy (with edit icon)      │
│        [View my profile]             │
│                                     │
│ 💰 36 Credits        ❤️ 0 Chat gems │
│                              [+]    │
│                                     │
│ [Following] ▶                       │
├──────────────────────────────────────┤
│ Search Messages Mail Newsfeed People │
└──────────────────────────────────────┘
```

**Key Elements:**
- [ ] Profile photo (circular)
- [ ] Edit icon (orange pencil)
- [ ] Username
- [ ] "View my profile" link
- [ ] Credits display (coin icon + number)
- [ ] Chat gems (heart icon)
- [ ] Plus button (to buy more)
- [ ] Following section

**Credit Balance Behavior:**
- The displayed number represents `CustomerProfile.CreditsRemain`, the
  authoritative current spendable balance.
- Every paid action shows its cost at the action point.
- Ordinary message and gift sends do not open a confirmation dialog.
- After success, all visible credit counters immediately replace their value
  with the API response's committed `creditBalance`.
- The UI does not optimistically subtract credits before the server commits.
- A `credits.balanceChanged` event updates other open views; the three-minute
  activity reconciliation repairs any missed event.
- Failed, rejected, or cancelled actions leave the displayed balance unchanged.
- The Frontend keeps the latest server-confirmed balance in shared session
  state so screens do not repeatedly query SQL Server.
- The Frontend may track whether its displayed balance is stale and request a
  refresh after reconnect, but it does not track an uncommitted financial
  balance or send one during logout.
- Logout never attempts to save the displayed balance. If refresh detects a
  mismatch, every credit counter is replaced by the Web Service value.

---

### **Screen 18: FrontUI010501 (Edit Profile) - Profile View Page**

**Purpose:** View full profile with edit capability

**Layout:**
```
┌─ HEADER ────────────────────────────┐
│  < Profile          [Edit profile]  │
├──────────────────────────────────────┤
│  Billy, 53    🛡️                     │
│  ID: 158029273     [📷]              │
│                                     │
│ Public photos                    [^] │
│ ┌──────────────┐                    │
│ │              │  [+]               │
│ │  + Add photo │                    │
│ └──────────────┘                    │
│                                     │
├──────────────────────────────────────┤
│ Search Messages Mail Newsfeed People │
└──────────────────────────────────────┘
```

**Key Features:**
- [ ] Profile name + age
- [ ] Verification badge (shield)
- [ ] User ID
- [ ] Photo upload button (camera)
- [ ] Public photos section (collapsible)
- [ ] Add photo capability
- [ ] Processed 100 x 100 maximum preview
- [ ] JPG/PNG processed-format indicator

---

### **Screen 19: FrontUI010502 (Edit Profile Mode)**

**Purpose:** Edit profile information

**Layout:**
```
┌─ HEADER ────────────────────────────┐
│  < Profile    [Cancel editing]      │
├──────────────────────────────────────┤
│  Billy, 53                          │
│  ID: 158029273      [📷]            │
│                                     │
│ Public photos                    [^] │
│ ┌──────────────┐                    │
│ │              │                    │
│ └──────────────┘                    │
│                                     │
│ Private photos                   [v] │
│                                     │
│ Bio                              [^] │
│                                     │
│ Name                                │
│ ┌──────────────────────────────────┐ │
│ │ Billy                             │ │
│ └──────────────────────────────────┘ │
│                                     │
│ ┌──────────────────────────────────┐ │
│ │ [Save]                            │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ Search Messages Mail Newsfeed People │
└──────────────────────────────────────┘
```

**Editable Fields:**
- [ ] Name (text input)
- [ ] Bio (text area)
- [ ] Public photos (collapsible)
- [ ] Private photos (collapsible)
- [ ] Save button

---

### **Screen 20: FrontUI0106.png - Active Profiles (Discovery)**

**Purpose:** Browse and discover active profiles

**Similar to FrontUI0101** but showing different profiles in grid format with 2 columns on desktop.

---

### **Screen 21: FrontUI010601.png - Advanced Search Filters**

**Purpose:** Detailed filtering interface

**Form Fields:**
- [ ] Cancel / Reset buttons (orange)
- From: Country (dropdown) - "Select country"
- Age: From [40] To [55] (range dropdowns)
- "I'm looking for": "I am a man looking for a woman"
- [Show people] button (orange, full-width, bottom)

---

### **Screens 22-26: Additional Customer Screens**

The five screenshots added on June 7, 2026 define:
- Screen 22: Public profile detail and carousel
- Screen 23: Interaction/flirt template picker
- Screen 24: Active conversation detail
- Screen 25: Customer account drawer
- Screen 26: Profile visitors

Detailed layouts, states, responsive behavior, safety adaptations, and functional
dependencies are defined in `ADDITIONAL_CUSTOMER_SCREENS.md`.

The screenshots are references only. DatingEasy888 does not adopt misleading
templates such as unverified nearby claims or instant marriage promises, and
all internally managed-profile and intimate-request behavior follows current
consent policy.

---

### **Bonus: FrontUI0105-1.png - Buy Credits Modal**

**Purpose:** Purchase credit packages

**Modal Structure:**
```
┌────────────────────────────────────┐
│ Get Credits To Unlock All Features │
│ The more credits you buy...        │
│                                    │
│ ┌─ Best Value ────────────────────┐│
│ │ 1,500 credits                   ││
│ │ $100                            ││
│ └────────────────────────────────── │
│                                    │
│ ┌─ Most Popular ──────────────────┐│
│ │ 700 credits                     ││
│ │ $50                             ││
│ └────────────────────────────────── │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ [Continue]                      │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

**Tiers Shown:**
1. 100 credits - $10
2. 220 credits - $20
3. 360 credits - $30
4. 700 credits - $50
5. 1,500 credits - $100

The screenshot prices are superseded by the approved product policy. The formula for purchases above $100 remains pending confirmation.

---

### **Bonus: FrontUI0105-1-1.png - Payment Confirmation**

**Purpose:** Multi-step payment checkout

**Modal Structure - 3 Steps:**
```
Steps: ✅ Select Package │ (2) Payment Method │ (3) Order Status

[Payment method panel]

Selected package and price come from the current credit policy.

Payment method:
- [✓] VISA 481582XXXXXX3517  [CONFIRM]
- [+] Add new credit card

Credit Card Payment Hotline:
+1 (888) 991-0784
Ask your question online

By proceeding with payment you reaffirm accepting:
Terms of Use, Privacy Policy, Payment and Refund Policy, Arbitration Agreement
```

---

## 3. Design System Specification

### **Brand Direction**

DatingEasy888 should use Horizon Singles and Best Dates as reference points, but not copy either one exactly.

- Horizon Singles reference: energetic, colorful, social, and emotionally warm.
- Horizon Singles adjustment: reduce shine, glow, heavy gradient, and visual intensity.
- Best Dates reference: clean, readable, simple, and easy to scan.
- Best Dates adjustment: add more warmth, character, and premium polish.
- Final DatingEasy888 direction: between both references, with a modern adult dating feel that is polished but not loud, clean but not plain.

### **Color Scheme**

| Color | Hex Code | Usage |
|-------|----------|-------|
| Primary Orange | #FF8C00 | Buttons, CTAs, active states |
| Dark Purple/Navy | #1A1626 | Background, text (landing page) |
| White | #FFFFFF | Background (main app), text |
| Light Gray | #F5F5F5 | Card backgrounds, subtle backgrounds |
| Green (Success) | #28A745 | "FREE" badges, confirmation |
| Pink/Coral | #FF6B7A | Accents, secondary CTAs |
| Light Blue | #B3D9FF | Chat bubbles (user messages) |
| Dark Gray | #333333 | Primary text on light backgrounds |
| Light Gray Text | #999999 | Secondary text, timestamps |
| Red | #E74C3C | Error messages, delete actions |

### **Typography**

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Logo | Custom/Bold | 24-32px | Bold |
| Page Headers | System | 24-28px | Bold |
| Section Headers | System | 18-20px | Bold |
| Body Text | System | 14-16px | Regular |
| Small Text | System | 12-13px | Regular |
| Labels | System | 12-14px | Medium |
| Buttons | System | 14-16px | Medium/Bold |

### **Spacing Scale**

```
4px   - xs
8px   - sm
12px  - md
16px  - lg
20px  - xl
24px  - 2xl
32px  - 3xl
```

### **Button Styles**

**Primary Button (Orange)**
- Background: #FF8C00
- Text: White, 14-16px, bold
- Padding: 12px 24px
- Border radius: 6-8px
- Hover: Darker orange

**Secondary Button (Outline)**
- Background: Transparent
- Border: 1px solid #CCCCCC
- Text: Dark gray
- Padding: 10px 20px

**Danger Button (Red)**
- Background: #E74C3C
- Text: White
- Padding: 12px 24px

### **Form Elements**

**Text Input / Dropdown**
- Border: 1px solid #CCCCCC
- Padding: 12px
- Border-radius: 4px
- Focus: Border color → Orange, box-shadow light orange

**Tags/Chips**
- Background: Light gray
- Text: Dark gray
- Border: 1px solid #CCCCCC
- Border-radius: 20px
- Selected: Orange border, orange background
- Padding: 8px 12px

**Toggle/Checkbox**
- Styled custom
- Checked: Orange
- Unchecked: Gray

### **Icons & Badges**

- **Online Status**: Green circle (6-8px)
- **Unread Badge**: Orange circle with white number
- **Star/Favorite**: Orange star or outline
- **Heart/Like**: Pink/red outline or filled
- **Avatar Placeholder**: Gray circle with person icon
- **Verification Badge**: Blue shield with checkmark

---

## 4. Responsive Design Breakpoints

Customer browser and operating-system support follows
`BROWSER_AND_OS_COMPATIBILITY.md`. The UI is standards-based and supports current
Chrome, Edge, Firefox, and Safari families across Windows, macOS, mainstream
Linux, iOS/iPadOS, Android, and ChromeOS. Internet Explorer 11 is not supported.

### **Desktop (1024px+)**
- 2-column grid for profiles
- Sidebar navigation (if needed)
- Full-width forms
- Large cards and spacing

### **Tablet (768px - 1023px)**
- 1-2 column grid (adaptive)
- Collapsible navigation
- Medium spacing

### **Mobile (320px - 767px)**
- Single column layout
- Bottom tab navigation (5 tabs)
- Full-width cards
- Larger touch targets (44px+)
- Stacked forms
- Compact content density without cramped controls
- Primary customer actions reachable with one hand where practical
- No desktop-only interaction dependency such as hover

### **Customer UI Simplicity Rules**
- Keep primary navigation limited and predictable.
- Show only the controls needed for the current customer task.
- Use short labels and clear status messages.
- Avoid nested settings and deeply layered dialogs.
- Preserve customer progress when a network or validation error occurs.
- Provide clear loading, empty, offline, error, and retry states.
- Ensure the same core features are available on desktop and mobile.

---

## 5. Key Features & Interactions

### **Tab Navigation (Bottom)**
```
Search(15) | Messages(12) | Mail(27) | Newsfeed | People
```
- 5 main navigation tabs
- Red/orange badges showing unread counts
- Always visible on mobile
- Active tab highlighted

### **Profile Cards**
- Hover: Slight shadow/scale
- Click: Navigate to profile detail
- Like button: Toggle state, update count

### **Profile Interaction Requests**
On an eligible full profile, provide:
- Hello
- Cuddle
- Hug
- Flirt
- Teasing
- Intimate Chat (internal code: `SexRequest`)

Mobile may place these actions in a compact bottom sheet. `SexRequest` requires a
confirmation explaining that it requests consent but does not grant consent.
Recipients can accept, decline, block, or report.

### **Message Input**
- Text input field: "Type message"
- Action buttons below:
  - Emoji/sticker picker
  - Photo upload
  - Send button (arrow icon)
- Gift panel directly beneath the chat area with gift icons and exact costs
- Selecting a gift sends immediately; insufficient balance prevents the send
  without creating a transaction

### **Online Refresh**
- Apply real-time chat/notification events immediately when available.
- Reconcile activity at least every three minutes while the authenticated customer is online.
- Every record list initially shows at most 20 items.
- Show a `Next` button when more records exist; selecting it loads the next 20.
- Do not automatically infinite-scroll customer records.
- Refresh chat counts, chat-history presence, favorites, inbox, search status, and profile requests.
- Do not reorder visible search results while the customer is interacting with them.
- Show a `New results available` action when a new search ordering is ready.

### **Filters & Search**
- Modal dialog or slide-out panel
- Collapsible sections
- Range sliders for age
- Dropdowns for location, preferences
- Save/apply button

---

## 6. Data Structure Requirements

See separate file: `countries_states_cities.json`

### Required Dropdown Data:
- **Countries**: Top 30 (USA, China, Canada, UK, Australia, etc.)
- **States/Provinces**: By country
- **Cities**: Top cities per country
- **Fields of Work**: Engineering, Finance, Healthcare, etc.
- **Interests**: 30+ categories
- **Movies**: 15+ genres
- **Music**: 10+ genres
- **Personality Traits**: 20+ options
- **Marital Status**: Single, Married, Divorced, Widowed, etc.
- **Age Range**: 18-100
- **Looking For**: 6+ options

---

## 7. Form Validation Rules

### **Registration/Login**
- Email: Valid format (RFC 5322 compliant)
- Password: Min 8 chars, 1 uppercase, 1 number, 1 special char
- Age: Must be >= 18, <= 120

### **Profile Creation**
- Name: 2-50 characters, letters only
- Birthday: Valid date, age >= 18
- City: Required
- Country: Required
- Bio: Max 500 characters
- Interests: 1-5 selections required
- Traits: 1-3 selections required

### **Payment**
- Raw card information is collected by the selected payment provider, not stored or processed directly by DatingEasy888 forms.
- Saved methods display only bank, card type, masked last four digits, and expiration.
- Provider-hosted validation handles card number, expiration, and security code.
- DatingEasy888 never stores CVV/CVC/SecCode, card PIN, or card password.

---

## 8. API Integration Points

The route list previously drafted from screenshots has been superseded by the versioned contracts in `Design/WebService/`.

### **Authentication**
- See `CUSTOMER_API_CONTRACTS.md`, section 1.

### **Profiles**
- See `CUSTOMER_API_CONTRACTS.md`, sections 2-4.

### **Search & Discovery**
- See `CUSTOMER_API_CONTRACTS.md`, section 5.

### **Messaging**
- See `CUSTOMER_API_CONTRACTS.md`, sections 6-8.

### **Credits & Payment**
- See `CUSTOMER_API_CONTRACTS.md`, sections 9-12.

### **Feed & Activity**
- Feed contracts remain pending because detailed feed business requirements have not yet been completed.

---

## 9. Next Steps

1. ✅ Review this design specification
2. ⏳ Create `countries_states_cities.json` data file
3. ⏳ Create `dropdown_constants.json` for all static options
4. ⏳ Build HTML templates for each screen
5. ⏳ Implement CSS (responsive, component-based)
6. ⏳ Add JavaScript for interactions
7. ⏳ Connect to Python backend
8. ⏳ Integrate C# Web API calls
9. ⏳ Testing and refinement

---

## 10. File Structure Reference

```
frontend/
├── templates/
│   ├── layout.html
│   ├── login.html
│   ├── profile_wizard.html
│   ├── dashboard.html
│   ├── search.html
│   ├── inbox.html
│   ├── chat.html
│   ├── feed.html
│   ├── people.html
│   └── payments.html
├── static/
│   ├── css/
│   │   ├── main.css
│   │   ├── responsive.css
│   │   └── components.css
│   ├── js/
│   │   ├── app.js
│   │   ├── api.js
│   │   └── utils.js
│   ├── images/
│   └── icons/
├── data/
│   ├── countries_states_cities.json
│   ├── constants.json
│   └── defaults.json
└── app.py
```

---

**Document Version:** 1.1  
**Last Updated:** 2026-06-07  
**Status:** Design draft - refinement in progress; coding is not yet authorized
