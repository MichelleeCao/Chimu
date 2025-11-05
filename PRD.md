# Product Requirements Document

## Project Purpose
Create a web-based platform that enables instructors to monitor and improve teamwork collaboration in academic settings through pulse surveys, team agreements, and data visualization. The platform helps students build stronger working relationships through structured icebreakers and transparent feedback mechanisms while giving instructors actionable insights into team dynamics.

## User Stories

### Instructor User Stories
- As an instructor, I want to create classes and generate unique class codes so I can control who enrolls
- As an instructor, I want to view all teams in my class with their collaboration scores so I can identify struggling teams early
- As an instructor, I want to be able to add other instructors or TAs to the class
- As an instructor, I want to send weekly pulse surveys so I can gather feedback on team dynamics
- As an instructor, I want to be able to edit when pulse surveys are released and due every week
- As an instructor, I want to view analytics on team performance so I can make data-driven decisions about interventions
- As an instructor, I want to view team agreements and icebreaker responses so I understand team dynamics
- As an instructor, I want to manage team membership (add/remove/move students) so I can optimize team composition
- As an instructor, I want to archive past classes so I can reference historical data

### Student User Stories
- As a student, I want to join a class using a class code so I can access team features
- As a student, I want to create or join a team so I can collaborate with classmates
- As a student, I want to complete weekly pulse surveys quickly (under 3 minutes) so I can provide feedback without disrupting my workflow
- As a student, I want to view my teammates' contact information (email, phone) so I can easily communicate with them
- As a student, I want to answer icebreaker questions so my teammates can get to know me better
- As a student, I want to create a team agreement collaboratively so we have clear expectations
- As a student, I want to view my team's performance compared to other teams so I understand where we stand

## Key Features

### 1. SSO Login
**Description:** Secure authentication with role-based access control
**Functionality:**
- Support for institution Single Sign-On (SSO) integration
- Alternative email/password authentication
- Test login options for quick role switching (Instructor/Student) during development
- Role-based permissions (Instructor, TA, Student)
- Multi-role support: users can be TAs in some classes and students in others
**User Flow:**
- User navigates to login page
- User authenticates via SSO or email/password
- System displays dashboard based on user's role(s)

### 2. Creating a Class
**Description:** Instructors create and configure classes for team-based coursework
**Functionality:**
- Create class with: name, quarter, section, year, description
- System auto-generates unique class code (alphanumeric, 8-12 characters)
- Invite co-instructors and TAs via email
- Instructors can archive classes at end of quarter (maintains read-only access to historical data)
**User Flow:**
- Instructor clicks "Create Class"
- Fills out class information form
- Optionally invites co-instructors/TAs
- System generates class code
- Instructor shares code with students

### 3. Joining a Class and Team
**Description:** Students enroll in classes and form/join teams
**Class Enrollment Functionality:**
- Enter unique class code to join
- System validates code and enrolls student
- View the dashboard list of enrolled classes
**Team Formation Functionality:**
- Browse available teams within class
- Create new team
- Request to join existing team
- Students can be on teams in multiple classes simultaneously
- Students cannot join multiple teams in the same class
**Team Management:**
- Instructors can move students between teams, create teams, or delete teams
**User Flow (Student):**
- Student logs in and clicks "Join Class"
- Enters class code
- System validates and enrolls student
- Student browses available teams or creates new team
- If joining: joins
- If creating: names team
- Complete icebreakers and sign team agreement

### 4. Completing Weekly Pulse Surveys
**Description:** Quick feedback mechanism to monitor team collaboration
**Survey Editing (Instructor):**
- Surveys use default standard questions to ensure consistency across teams and time periods
- Members provide timely response to communications
- Members are present at scheduled meetings
- Members have equitable workload distribution
- Our team has good morale and energy
- Our team is making good progress on our project
- Question type: Likert scale (😞 Strongly Disagree, 😕 Disagree, 😐 Neutral, 🙂 Agree, 😄 Strongly Agree)
- Select days of the week and times for when surveys are released and due
**Survey Completion (Student):**
- Receive notification when survey available
- Complete survey (5 questions, under 3 minutes)
- One question displayed at a time (mobile-optimized)
- Responses are anonymous to teammates
- Progress bar shows completion status
**Survey Analytics (Instructor):**
- Track completion rates per team
- View aggregate results as charts/infographics
- Export data as CSV
- Filter by class, team, time period (e.g., week), or question
**User Flow:**
- Instructor schedules survey release and due date
- Surveys are automatically sent to teams
- Students receive notification
- Students complete survey on desktop or mobile
- System aggregates anonymous results
- Instructor views results on analytics dashboard
- Instructor takes action

### 5. Team Management
**Description:** Tools for viewing team information and managing membership
**Dashboard Views:**
**Student Home Dashboard ("My Classes"):**
- Displays class cards showing:
  - Class name, quarter, section, year
  - Team name
  - Pending surveys, icebreakers, or team agreement notification
- Quick link to team dashboard
- Shows pending surveys across all classes
- Filter list by active, inactive, or upcoming classes
- "Join Class" quick action buttons
**Instructor Dashboard (After Selecting Class):**
- Two main tabs: "Teams" and "Survey Results"
**Teams Tab:**
- Grid of team cards showing:
  - Team name
  - Team size (e.g., "4/6 members")
  - Latest survey completion status
  - "View Details" button
- At-risk teams highlighted with visual indicators
- Quick actions: "Create Team", "Export Data"
- Team management capabilities for each team
**Survey Results Tab:**
- Filter dropdowns at top: "Term and Date", "Course", "Query" with sort and additional options icons
- Visual legend showing response scale with emojis:
  - 😃 Strongly Agree (dark green)
  - 🙂 Agree (light green)
  - 😐 Neutral (yellow)
  - 😞 Disagree (light orange)
  - 😠 Strongly Disagree (dark orange)
- Horizontal stacked bar charts for each survey question showing distribution of responses
- Questions displayed on left side (e.g., "Members are present at scheduled meetings", "Our team is making good progress on our project")
- Each bar segmented by response type with proportional color coding
- Ability to filter by specific terms, courses, or custom queries
- Overview metrics: overall completion rate, average collaboration score, at-risk team count
**Team Dashboard Features:**
- View team roster with member information
- Display contact information (photo, email, phone) with copy buttons
- View team agreement status (signed/unsigned)
- Access performance charts (survey completion, team vs class comparison)
- View icebreaker responses from all team members
**Instructor/TA Team Management:**
- View all teams in class
- See complete team rosters with contact information
- Move students between teams
- Add/remove team members
- Delete teams
- View team agreements and icebreaker responses for all teams
**User Flow (Viewing Team):**
- User navigates to team dashboard
- If survey is pending, prominent "Complete Weekly Survey" button displayed above tabs
- Views tabs: Icebreakers, Team Agreement, Survey Results, Member Info
- Member Info tab shows member cards with contact info prominently displayed
- Survey Results tab shows charts and metrics
- Team Agreement tab displays team agreement document
- Icebreakers tab shows Q&A for all members

### 6. Icebreakers
**Description:** Team-building feature to help members get to know each other
**Functionality:**
- Icebreaker question generator with categories: fun facts, work styles, goals, skills, preferences
- Library of 50+ questions
- Team member selects which questions their team will answer
- Students answer 10 icebreaker initial questions (required before full team participation)
- Responses visible to all team members and instructors/TAs
- Students can update their responses
- Questions categorized and randomized to prevent repetition
**Icebreaker Initial Questions for when members join a team:**
- What is your favorite holiday tradition?
- What is a skill or talent you have that you are proud of?
- What do you love most about the city or town you are from?
- What is something you bought or received recently that made you happy?
- What is something people wouldn’t guess about you?
- If you could swap roles or lives with anyone for one day, who would it be?
- Do you prefer to work in the morning or evenings?
- What role do you typically like to have on a team? (Example: leader, organizer, researcher, designer, etc.)
- What is something you struggle with when working in a team? (Example: procrastination, communication, etc.)
- What is your worst team/group project experience?
**Icebreaker Content Examples:**
- "How do you prefer to communicate (text, call, in-person)?"
- "What's your ideal work schedule/time of day?"
- "What's a skill you have that might surprise your teammates?"
- "What's your approach to handling disagreements?"
- "What's a goal you have for this team/project?"
**User Flow:**
- All team members complete initial default icebreaker questions when joining team
- All team members receive notification to complete any new icebreakers
- Students answer questions
- Responses become visible on team dashboard
- Team members can view each other's responses to build rapport

### 7. User Profile Management
**Description:** Users can view and edit their personal profile information
**Functionality:**
- Accessible from profile avatar dropdown in top navigation bar
- Edit profile information:
  - Profile photo (upload/change image)
  - Email address
  - Phone number (optional)
  - Password change
- Profile displays to teammates on team dashboards
**User Flow:**
- User clicks profile avatar in top navigation
- Selects "Edit Profile" from dropdown (dropdown also has logout option)
- Views current profile information
- Updates desired fields (photo, email, phone, password)
- Clicks "Save Changes"
- System validates and updates information
- Confirmation message displayed

## Non-Functional Requirements

### Responsive Design
- Mobile-First Survey Experience: Surveys must be quick and easy on mobile devices with large touch targets (minimum 44x44px)
- Responsive Layouts: All pages adapt to desktop (1440px+), tablet (768px-1439px), and mobile (<768px) viewports
- Touch-Friendly: Interactive elements optimized for touch on mobile/tablet
- Progressive Disclosure: Hamburger menus and collapsible sections on mobile to reduce clutter

### Performance
- Page Load Times: Under 2 seconds for all pages
- Survey Submission: Complete within 1 second
- Dashboard Visualizations: Render within 3 seconds
- Role Context Switching: Complete within 500 milliseconds
- Concurrent Users: Support 1,000+ concurrent users
- Scalability: Architecture supports growth to 50,000+ users

### Usability
- Intuitive Interface: Non-technical users should navigate without training
- Clear Visual Hierarchy: Important information (class information, class codes, contact info) prominently displayed
- Consistent Design: Same patterns and components used throughout
- Accessibility: WCAG 2.1 AA compliant with proper contrast ratios, keyboard navigation, screen reader support
- Help Documentation: Tooltips and help text available throughout
- Onboarding: Clear first-time user guidance for students and instructors

### Security & Privacy
- Data Encryption: All data encrypted in transit (HTTPS) and at rest
- FERPA Compliance: Student data handled according to federal education privacy regulations
- Role-Based Access: Users only access data they have permission to view based on role
- Survey Anonymity: Student survey responses anonymous to teammates
- Multi-Role Privacy: Student data not accessible when user is in TA/Instructor context
- Audit Logging: All data access and modifications logged
- Authentication: Secure SSO integration with token-based session management

### Reliability
- System Uptime: 99.5% or higher availability
- Data Backup: Daily automated backups
- Error Handling: Graceful error messages with suggested actions
- Session Management: Secure context preservation during role switching

## Tech Stack

### Frontend
- Framework: React 18+ with TypeScript
- Styling: Tailwind CSS for utility-first styling
- State Management: React Context API (start simple)
- Routing: React Router v6
- Charts/Visualizations: Recharts
- Forms: React Hook Form with Zod validation
- Icons: Lucide React
- HTTP Client: Supabase JavaScript Client

### Backend & Database
- Platform: Supabase (managed PostgreSQL + Auth + Storage + Real-time)
- Authentication: Supabase Auth with email/password and OAuth providers
- Database: PostgreSQL (managed by Supabase)
- File Storage: Supabase Storage for profile photos
- Real-time: Supabase Realtime for live updates (optional for notifications)
- API: Supabase auto-generated REST API + PostgreSQL Row Level Security (RLS)

### Hosting & Deployment
- Frontend Hosting: Vercel (automatic deployments from Git)
- Backend: Supabase (fully managed)
- Email Service: Supabase Auth emails + optional SendGrid for custom notifications
- Domain & SSL: Vercel handles automatically

### Development Tools
- AI Assistant: Cursor IDE for AI-powered development
- Version Control: Git with GitHub
- Package Manager: npm or pnpm
- Code Quality: ESLint, Prettier
- Environment Variables: Vercel environment variables + Supabase project settings

### Security
- Authentication: Supabase Auth with JWT tokens
- Database Security: PostgreSQL Row Level Security (RLS) policies
- SSL/TLS: Automatic via Vercel and Supabase
- Input Validation: Zod for schema validation
- Rate Limiting: Supabase built-in rate limiting

### Why This Stack?
- Rapid Development: Supabase eliminates backend infrastructure setup
- Cursor-Friendly: All technologies have excellent AI assistance in Cursor
- Type Safety: TypeScript + Zod throughout the stack
- Scalability: Supabase scales automatically, Vercel handles frontend scaling
- Cost-Effective: Free tiers available for development and small deployments
- Integrated Auth: No need to build authentication from scratch
- Real PostgreSQL: Full SQL database power with type-safe queries

## Data Model (High-Level)

### Core Entities
- **Users:** id, name, email, phone, role
- **Classes:** id, name, quarter, section, year, description, max_team_size, class_code, archived, created_by
- **ClassRoles:** class_id, user_id, role (instructor/TA/student), active
- **Teams:** id, class_id, name, creator_id
- **TeamMembers:** team_id, user_id, joined_date
- **Surveys:** id, class_id, created_by, sent_date, questions (JSON)
- **Responses:** id, survey_id, user_id, team_id, answers (JSON), timestamp
- **TeamAgreements:** id, team_id, content, created_by, created_date, locked
- **AgreementSignatures:** agreement_id, user_id, signed_date
- **IcebreakerQuestions:** id, question_text, category
- **IcebreakerResponses:** id, user_id, team_id, question_id, answer, completed
- **DepartureRequests:** id, team_id, user_id, reason, status, requested_date
- **UserContexts:** user_id, last_active_class_id, last_active_role
