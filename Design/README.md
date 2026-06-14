# CODEX - Design & Planning Documentation

## 📁 Folder Structure

```
Design/
├── Business/                          # Business model and go-to-market
│   └── BUSINESS_PLAN.md              # Strategy, economics, milestones, and risks
├── Frontend/                          # Frontend UI Design
│   ├── FRONTEND_UI_DESIGN_PLAN.md    # Original 21 screens plus added-screen index
│   ├── ADDITIONAL_CUSTOMER_SCREENS.md # Five added customer screens
│   ├── BROWSER_AND_OS_COMPATIBILITY.md
│   └── DESIGN_SUMMARY.md             # Quick reference guide
├── Product/                           # Product requirements and user flows
│   ├── PRODUCT_REQUIREMENTS.md
│   ├── CREDITS_REWARDS_POLICY.md
│   ├── CUSTOMER_CHAT_POLICY.md
│   ├── MARKET_ANALYSIS.md
│   ├── ONLINE_REFRESH_AND_PROFILE_REQUEST_POLICY.md
│   ├── PRODUCT_OPERATING_MODEL.md
│   ├── SEED_ROBOT_PHOTO_PRODUCTION_BRIEF.md
│   ├── SEED_CHAT_VALUE_POLICY.md
│   ├── SEED_PROFILE_GENERATION_POLICY.md
│   └── USER_FLOWS.md
├── Backend/                           # Employee/admin UI and robot-job design
│   ├── BACKEND_SERVICE_DESIGN.md
│   └── PREPARED_CONVERSATION_TEXT.md  # Prepared-text taxonomy and governance
├── WebService/                        # API contract planning
│   ├── API_CONTRACT_PLAN.md
│   ├── API_STANDARDS.md
│   ├── CUSTOMER_API_CONTRACTS.md
│   ├── BACKEND_API_CONTRACTS.md
│   ├── ROBOT_API_CONTRACTS.md
│   ├── FINANCE_OPERATIONS_API_CONTRACTS.md
│   ├── API_REVIEW_SUMMARY.md
│   └── ERROR_CATALOG.md
├── Database/                          # SQL Server database design
│   ├── DATABASE_DESIGN_PLAN.md
│   └── TABLE_CATALOG.md               # Detailed logical table definitions
├── Admin/                             # Company/admin backoffice design
│   ├── ADMIN_BACKOFFICE_DESIGN.md
│   └── POLICY_MAINTENANCE_UI.md
├── Security/                          # Safety, privacy, compliance design
│   ├── SAFETY_PRIVACY_COMPLIANCE.md
│   └── SECURITY_CONTROL_PLAN.md
├── Operations/                        # Non-functional requirements
│   ├── NON_FUNCTIONAL_REQUIREMENTS.md
│   ├── DEPLOYMENT_AND_LAUNCH_PLAN.md
│   ├── LAUNCH_TIMELINE.md
│   └── VERSION_CONTROL_AND_RELEASE_GOVERNANCE.md
├── Testing/
│   └── TEST_STRATEGY.md
├── Manuals/                           # Role-based product usage manuals
│   ├── MANUAL_REVIEW_GUIDE.md
│   ├── CUSTOMER_MANUAL.md
│   ├── EMPLOYEE_MANUAL.md
│   └── ADMIN_MANUAL.md
├── Data/                              # Static data files
│   ├── countries_states_cities.json   # Top 30 countries with cities
│   └── dropdown_constants.json        # All form dropdown options
├── ARCHITECTURE.md                    # System architecture overview
├── CHAT_TO_CODEX_HANDOFF.md           # Continuation baseline and transferred assets
├── DECISIONS.md                       # Confirmed and pending decisions
├── OPEN_QUESTIONS.md                  # Questions to answer before build
├── REFERENCE_ASSET_INVENTORY.md        # Screenshot/recording purpose and restrictions
├── plan.md                            # Project overview & phases
└── README.md                          # This file
```

---

## 📚 Document Guide

### **Business/BUSINESS_PLAN.md**
- Business strategy and positioning
- Initial customer and market hypotheses
- Revenue model and conservative financial scenarios
- Go-to-market stages, KPIs, risks, and launch gates

**Use this for commercial planning and validation decisions.**

`Product/MARKET_ANALYSIS.md` contains the supporting market, competitor,
customer, app-store, advertising, payment, and enforcement research.

---

### **1. plan.md** (Start Here!)
- 📋 Overall project phases (1-9)
- 🏗️ Architecture overview
- 📝 Success criteria
- 🎯 Tech stack summary

**Read this first to understand the big picture!**

---

### **2. Frontend/DESIGN_SUMMARY.md** (Quick Reference)
- ✨ Quick overview of all 26 reference screens
- 🎨 Key design highlights
- 📊 Data structure summary
- 🔄 User flows
- ✅ Next development steps

**Use this for quick lookups!**

---

### **3. Product/PRODUCT_REQUIREMENTS.md**
- Working brand/domain
- Product goals
- MVP and later scope
- Business rules
- Success metrics

**Use this to keep the product direction clear.**

---

### **4. Product/USER_FLOWS.md**
- New user registration
- Existing user login
- Profile wizard
- Discovery to chat
- Credits/payment
- Report/block
- Admin moderation

**Use this before designing screens or APIs.**

`Product/SEED_PROFILE_GENERATION_POLICY.md` defines original synthetic or licensed
seed sources, three-photo consistency, biography and location rules, provenance,
human approval, profile presentation, and takedown requirements.

---

### **5. ARCHITECTURE.md**
- 3-tier architecture
- Logical components
- Frontend/API/database responsibilities
- Integration style
- Open architecture decisions

**Use this before implementation choices.**

---

### **6. Backend/BACKEND_SERVICE_DESIGN.md**
- Backend modules
- Business logic areas
- Common API rules
- Response and error envelope examples
- Backend gaps to fill

**Use this to design the C# services.**

---

### **7. WebService/API_CONTRACT_PLAN.md**
- API route plan
- Auth/profile/discovery/messaging/payment/admin endpoint groups
- Contract details still needed

**Use this when turning flows into service contracts.**

---

### **8. Database/DATABASE_DESIGN_PLAN.md**
- SQL Server table groups
- Static reference data
- Indexing ideas
- Data integrity rules
- Open database decisions

**Use this when designing schema and migrations.**

`Database/TABLE_CATALOG.md` contains the detailed table-by-table data dictionary and draft SQL Server data types.

---

### **9. Admin/ADMIN_BACKOFFICE_DESIGN.md**
- Admin roles
- Backoffice sections
- Dashboard widgets
- User/report/payment review
- Audit requirements

**Use this for company backend/admin design.**

---

### **10. Security/SAFETY_PRIVACY_COMPLIANCE.md**
- Age and eligibility
- Account security
- Privacy boundaries
- Messaging/photo/payment safety
- Moderation and abuse prevention

**Use this as the safety baseline.**

`Security/SECURITY_CONTROL_PLAN.md` defines the detailed identity, authorization,
application, data, payment, AI/robot, infrastructure, monitoring, vulnerability,
recovery, and release security controls.

---

### **11. Operations/NON_FUNCTIONAL_REQUIREMENTS.md**
- Performance
- Availability
- Scalability
- Observability
- Reliability
- Accessibility
- Data retention

**Use this to avoid late production surprises.**

`Operations/VERSION_CONTROL_AND_RELEASE_GOVERNANCE.md` defines protected branches,
pull-request review, versioning, release artifacts, repository access, software
supply-chain controls, and emergency-change governance.

---

### **12. DECISIONS.md and OPEN_QUESTIONS.md**
- `DECISIONS.md` records confirmed and pending decisions
- `OPEN_QUESTIONS.md` stores questions to answer before build

**Use these continuously as the design changes.**

---

### **13. Frontend/FRONTEND_UI_DESIGN_PLAN.md** (Detailed Spec)
Complete specification including:
- 🗺️ Navigation flow diagrams
- 📱 Original 21 screens detailed in `Frontend/FRONTEND_UI_DESIGN_PLAN.md`
- 📱 Five added screens detailed in `Frontend/ADDITIONAL_CUSTOMER_SCREENS.md`
  (profile detail, request picker, active conversation, account drawer, and visitors)
- Reference screen inventory:
  - FrontUI0.png - Login page
  - FrontUI010501-010509.png - 9-step profile wizard
  - FrontUI01.png - Dashboard
  - FrontUI0101-0106.png - Main features (Search, Inbox, Chats, Newfeed, People, Active)
  - Payment pages
- 🎨 Design system (colors, typography, spacing)
- 📐 Responsive design rules
- ✅ Form validation
- 🔗 API integration map
- 📂 File structure template

**Use this during development!**

---

### **14. Data/countries_states_cities.json**
Structured data for:
- 🌍 30 countries
- 📍 States/provinces per country
- 🏙️ Top 3-5 cities per state

**Usage Examples:**
```javascript
// For dropdowns in profile creation
import { countries } from './data/countries_states_cities.json';

countries.map(country => (
  <option key={country.id}>{country.name}</option>
))

// For dependent dropdowns (state based on country)
const states = countries.find(c => c.code === selectedCountry).states;

// For city dropdown
const cities = states.find(s => s.id === selectedState).cities;
```

---

### **15. Data/dropdown_constants.json**
All static form options:
- 👤 Personality traits (20)
- 💼 Fields of work (24)
- 🎬 Movie genres (15)
- 🎵 Music genres (15)
- 📚 Interests (32)
- 🎯 Dating goals (9)
- 💬 Gender preferences (5)
- 🗣️ Languages (20)
- 💳 Credit packages (5 tiers with pricing)
- 💝 Message gifts (emoji + credit cost)
- 🎖️ Verification badges

**Usage Examples:**
```javascript
// Import constants
import { interests, personality_traits, credit_packages } from './data/dropdown_constants.json';

// Use in forms
interests.map(interest => (
  <label key={interest.id}>
    <input type="checkbox" value={interest.value} />
    {interest.label}
  </label>
))

// For credit purchase page
credit_packages.map(pkg => (
  <div key={pkg.id}>
    <h3>{pkg.credits} Credits - ${pkg.price_usd}</h3>
    {pkg.discount_percentage > 0 && 
      <span>Save: {pkg.discount_percentage}%</span>
    }
  </div>
))
```

---

### **16. Manuals**

- `Product/PRODUCT_OPERATING_MODEL.md`: shared terminology, states, lifecycle handoffs, recommended information architecture, and V1 boundary.
- `Manuals/MANUAL_REVIEW_GUIDE.md`: decisions to make and the proposed review order.
- `Manuals/CUSTOMER_MANUAL.md`: screens, account states, profile and social actions, real and virtual chat, credits, privacy, support, appeals, and recovery.
- `Manuals/EMPLOYEE_MANUAL.md`: screen map, assignment states, 20-seed/10-chat workflow, response checks, AI assistance, escalation, handoff, quality, and security.
- `Manuals/ADMIN_MANUAL.md`: role boundaries, support and moderation cases, appeals, finance, privacy requests, change control, operating cadence, audit, and incidents.

Each manual separates confirmed rules, recommended decisions, and publication
or training blockers. Review the guide first; approved recommendations are then
recorded in `DECISIONS.md`.

---

## 🚀 Next Steps

### **Design-First Workflow**
1. Review and approve the three role manuals.
2. Record approved recommendations in `DECISIONS.md`.
3. Review Web Service API contracts against every approved workflow and state.
4. Review database tables against the approved contracts, finance rules, and audit needs.
5. Complete the V1 implementation plan and begin coding only after explicit approval.

### **Phase 1: Frontend Setup**
1. Create folder structure in `Front/`:
   ```
   Front/
   ├── templates/          # HTML templates (one per screen)
   ├── static/
   │   ├── css/           # Stylesheets
   │   ├── js/            # JavaScript files
   │   └── images/        # Assets
   ├── data/              # Link to Design/Data/
   └── app.py             # Flask/Django app
   ```

2. Create HTML templates for each screen
3. Build CSS framework (responsive)
4. Implement JavaScript interactions

### **Phase 2: Web Service Setup (C#)**
1. Create folder structure in `Service/`
2. Design database schema
3. Build API endpoints
4. Implement authentication

### **Phase 3: Integration**
1. Connect frontend to backend
2. Implement real-time features
3. Payment processing
4. Testing

---

## 📖 Design System Quick Reference

### **Colors**
| Name | Hex | Usage |
|------|-----|-------|
| Primary Orange | #FF8C00 | Buttons, CTAs |
| Pink/Coral | #FF6B7A | Accents |
| Success Green | #28A745 | Badges |
| Error Red | #E74C3C | Errors |

### **Fonts**
- **Logo**: Bold 24-32px
- **Headers**: Bold 18-28px
- **Body**: Regular 14-16px
- **Labels**: Medium 12-14px

### **Spacing**
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 20px

### **Navigation (5 Tabs)**
1. 🔍 Search (with badge)
2. 💬 Messages (with badge)
3. ✉️ Mail (with badge)
4. 📰 Newsfeed
5. 👥 People

---

## 🔗 Related Folders

- **`ScreenCopy/`** - Original 21 screenshots, five added screenshots, and reference recording
- **`Front/`** - Frontend development (create this)
- **`Service/`** - Backend C# API (create this)
- **`Database/`** - SQL scripts (create this)

---

## ✅ Checklist for Getting Started

- [ ] Review `plan.md` for project overview
- [ ] Read `Frontend/DESIGN_SUMMARY.md` for quick reference
- [ ] Study `Frontend/FRONTEND_UI_DESIGN_PLAN.md` for details
- [ ] Copy `Data/` folder to your frontend directory
- [ ] Create HTML templates based on screen specs
- [ ] Build responsive CSS framework
- [ ] Add JavaScript for interactions
- [ ] Set up Flask/Django backend
- [ ] Connect to C# API endpoints
- [ ] Test on desktop/tablet/mobile

---

## 📞 Questions?

Refer back to:
1. **What does screen X contain?** → `FRONTEND_UI_DESIGN_PLAN.md`
2. **What are the dropdown options?** → `dropdown_constants.json`
3. **What countries/cities are supported?** → `countries_states_cities.json`
4. **What's the overall architecture?** → `plan.md`
5. **Quick overview?** → `DESIGN_SUMMARY.md`

---

**Version**: 1.0  
**Created**: 2026-06-06  
**Status**: Design and policy refinement in progress; no product coding authorized yet  
**Location**: `/Users/weizhonggong/Codex/Design/`
