# Prepared Conversation Text Design

## Purpose
Prepared conversation text helps human and robot employees respond quickly,
consistently, and safely while operating internally classified,
company-operated seed profiles.

Prepared text is not sent blindly. It is selected or suggested according to conversation context, customer consent, relationship stage, profile facts, language, and safety rules.

All prepared text follows `Product/SEED_CHAT_VALUE_POLICY.md`. Its purpose is to
help customers feel heard, affectionately engaged, supported, relaxed, happier,
amused, and naturally interested in continuing when they choose.

## Core Rules
- Customer-facing profile layouts must not reveal internal real, seed, or robot
  classifications.
- Prepared text must not make explicit false claims about offline identity,
  physical presence, exact location, or real-world availability.
- Prepared text must not invent meetings, physical presence, personal history, employment, family, travel, or other real-world experiences.
- Employees may edit prepared text before sending.
- Robot use requires approved automation rules and safety checks.
- Messages must not pressure customers to buy credits, send gifts, continue paying, or avoid leaving the platform.
- Conversation continuation must come from relevance, warmth, humor, curiosity, and customer choice.
- A customer's wish to pause or end must be respected immediately and warmly.
- Repeated messages should be detected and varied to avoid spam-like conversations.
- Every prepared item must be reviewed, approved, versioned, and auditable.

## Conversation Categories

### 1. Love And Romance
Subtopics:
- Romantic interest
- Affection
- Relationship hopes
- Appreciation
- Trust
- Commitment discussion
- Romantic questions

Boundaries:
- Do not promise marriage, travel, meetings, or exclusive commitment unless the product has a truthful policy supporting it.
- Do not use emotional pressure or imply that payment proves love.

### 2. Feelings And Sympathy
Subtopics:
- Listening
- Encouragement
- Loneliness
- Stress
- Difficult day
- Loss or disappointment
- Celebrating good news

Boundaries:
- Do not present the system as a therapist or medical professional.
- Escalate self-harm, abuse, exploitation, or immediate-danger language to the approved safety workflow.
- Avoid dependency-building language such as claiming the customer needs only the seed profile.

### 3. Greetings
Subtopics:
- First greeting
- Morning
- Afternoon
- Evening
- Welcome back
- Conversation restart
- Polite goodbye

Goals:
- Friendly and brief
- Easy to personalize
- Avoid identical openings across many customers

### 4. Adult Flirting And Intimate Conversation
Working alias: Dirty Talk

Subtopics:
- Light flirting
- Compliments
- Romantic teasing
- Intimate mood
- Boundaries and consent
- Changing or stopping the topic

Rules:
- Adults only.
- Both participants must have opted into adult intimate conversation.
- Begin with non-explicit flirting and confirm comfort before increasing intimacy.
- Make it easy to stop, change topic, or reduce intensity.
- Do not generate content involving minors, coercion, incest, violence, exploitation, intoxicated consent, or non-consensual activity.
- Do not request illegal sexual content or private identifying material.
- Do not pressure customers to send intimate images.
- Explicit templates require separate legal, safety, and content approval before production use.

### 5. Sports
Subtopics:
- Favorite sport
- Teams
- Playing sports
- Fitness
- Recent games
- Friendly competition

Freshness:
- Current scores, schedules, injuries, and sports news require a verified current data source.

### 6. Travel
Subtopics:
- Favorite destinations
- Dream trips
- Local attractions
- Travel style
- Food while traveling
- Beaches, mountains, and cities

Boundaries:
- Seed profiles must not falsely claim that they personally visited a place.
- Use hypothetical wording or approved profile-story context.

### 7. Cooking And Food
Subtopics:
- Favorite foods
- Home cooking
- Recipes
- Restaurants
- Cultural food
- Desserts
- Cooking together as a hypothetical activity

Safety:
- Do not give unsafe medical, allergy, or food-storage advice.

### 8. Weather And Seasons
Subtopics:
- Today's weather
- Favorite season
- Rain, snow, heat, and sunshine
- Seasonal activities
- Weather-related mood

Freshness:
- Current weather requires verified location and live weather data.

### 9. Art And Culture
Subtopics:
- Painting
- Photography
- Music
- Movies
- Books
- Museums
- Theater and performance

Rules:
- Do not reproduce copyrighted songs, books, or scripts beyond allowed short references.

### 10. Clothing And Style
Subtopics:
- Everyday style
- Formal wear
- Colors
- Shopping
- Fashion preferences
- Compliments
- Dressing for weather or an occasion

Boundaries:
- Avoid body shaming.
- Keep compliments respectful and appropriate to the conversation's consent level.

### 11. City And Countryside Living
Subtopics:
- City convenience
- Countryside quiet
- Housing preferences
- Transportation
- Community
- Nightlife
- Nature and open space

### 12. Beach
Subtopics:
- Beach activities
- Ocean views
- Swimming
- Sunsets
- Beach food
- Relaxation

Safety:
- Avoid presenting unsafe swimming, sun exposure, or weather guidance as authoritative.

### 13. Mountains And Outdoors
Subtopics:
- Hiking
- Mountain views
- Camping
- Snow activities
- Nature
- Outdoor challenges

Safety:
- Avoid giving risky outdoor instructions without appropriate caution.

### 14. Work And Career
Subtopics:
- General career interests
- Work-life balance
- Professional goals
- Skills
- Workplace experiences
- Retirement

Boundaries:
- Seed profiles must not fabricate real employment or credentials.
- Avoid asking for confidential employer information.

### 15. Jobs And Employment
Subtopics:
- Job search
- Interviews
- Changing careers
- Education and training
- Workplace motivation
- Starting a business

Boundaries:
- Do not provide legal, tax, immigration, or financial advice as professional guidance.
- Do not promise employment or business opportunities.

### 16. News And Current Events
Subtopics:
- Local news
- International news
- Entertainment news
- Technology
- Culture
- Positive human-interest stories

Freshness and safety:
- Current events must use a verified, time-stamped source.
- Do not rely on static prepared text for factual breaking-news claims.
- Clearly separate verified facts from opinions or conversation questions.
- Avoid presenting unverified rumors as facts.
- High-risk political, conflict, health, legal, or financial topics require stricter sourcing and moderation.

## Content Metadata
Each prepared text item should include:
- PreparedTextId
- Category
- Subcategory
- Language
- Locale
- Tone
- RelationshipStage
- IntimacyLevel
- CustomerMood
- ValueGoal
- HumorStyle
- FollowUpStyle
- EndingAllowed
- SeedPersonaTags
- TextTemplate
- RequiredVariables
- ConsentRequired
- CurrentDataRequired
- HumanApprovalRequired
- RobotAllowed
- SafetyLevel
- Version
- Status
- ApprovedByEmployeeId
- ApprovedTime
- EffectiveStartTime
- EffectiveEndTime
- CreateTime
- UpdateTime

## Tones
- Friendly
- Warm
- Playful
- Romantic
- Supportive
- Curious
- Calm
- Humorous
- Respectful
- Intimate, with consent

## Relationship Stages
- First contact
- New conversation
- Familiar conversation
- Ongoing connection
- Romantic conversation
- Intimate conversation, with consent
- Re-engagement
- Closing conversation

## Prepared Text Lifecycle
1. Draft
2. Safety review
3. Language and quality review
4. Approval
5. Active use
6. Performance and complaint monitoring
7. Revision or retirement

## Employee UI
- Search prepared text by category, subtopic, tone, and keyword.
- Show context-relevant suggestions beside each chat.
- Display whether a suggestion is prepared text or AI-assisted.
- Allow editing before sending.
- Provide one-click topic change and conversation-close options.
- Show consent state for adult intimate topics.
- Prevent use of expired, retired, or unapproved text.
- Record which prepared-text version contributed to a sent message.

## Robot Use
- Robot employees may use only content marked `RobotAllowed`.
- Robot replies must pass safety and context checks.
- Current-data topics require verified tool data at send time.
- Low-confidence or sensitive conversations transfer to a human employee.
- Adult intimate conversation requires verified adult status and explicit topic consent.
- Robot output must remain consistent with the approved seed persona and must
  not fabricate real-world identity.

## Quality Measures
- Response acceptance and continuation rate
- Employee edit rate
- Repeated-text rate
- Safety escalation rate
- Customer complaint rate
- Topic-change rate
- Robot-to-human transfer rate
- Average response time
- Prepared-text retirement rate

## Later Design Work
- Write actual text templates for every category.
- Define allowed variables and personalization rules.
- Define customer consent storage for intimate topics.
- Define news, sports, and weather data sources.
- Define prohibited phrases and manipulation checks.
- Define translation and localization review.
