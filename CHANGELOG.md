# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.41.0] - 2026-11-11

### Added

- Split view for Care Needs and Visitors: a compact list on the left and the selected record's full detail on the right, without leaving the page
  - Selection lives in the URL (`?selected=<id>`) and only the detail panel reloads, so the list keeps its scroll position and filters
  - `j` / `k` move to the next / previous record and `Esc` closes the panel; previous/next buttons and an "open full page" link in the panel
  - On phones the list and detail show one at a time
  - Full detail pages still work and share the same component (`CareNeedDetail`, `VisitorDetail`)
- In-app confirmation dialog (`confirmAction()` + `ConfirmDialogHost`) replacing all 35 browser `confirm()` popups, with red buttons for destructive actions
- Shared UI building blocks: `EmptyState` / `TableEmptyRow`, `Timeline`, `AvatarStack`, `ChartSkeleton`, `DetailSkeleton`, `SplitView`, `useListSelection`, `useChartData`, and an `AlertDialog` UI component
- Friendly empty states with module icons on 26 admin tables
- Avatar stack of household members on the Households list
- Loading skeletons on every Analytics chart instead of a brief "no data" message

### Changed

- Care need timeline, visitor follow-up history, and member status history use the shared `Timeline` component with contact-method icons
- Visitor delete moved from the list row into the visitor detail header
- Header buttons (Go to Member Home / Go to Admin / Visit Public Site) show icons only on small screens

### Fixed

- Visitor status badges were blank and changing a visitor's status from the detail page was silently ignored (the page read and sent `status` while the server used `follow_up_status`); visitors now go through `VisitorResource`
- Header buttons overflowed the screen on phones

## [0.40.0] - 2026-11-11

### Added

- Separate admin area home at `/admin` with church-wide stats grouped into Needs Attention, People, Community, and Content & Growth (adds an Active Members count)
- "Go to Member Home" button in the header of admin pages and "Go to Admin" button on member pages (leaders and above)
- Role-based landing after login (including two-factor): admins go to `/admin`, everyone else to `/dashboard`; a requested page still takes priority

### Changed

- The sidebar now shows only admin navigation on `/admin` pages and only personal navigation everywhere else
- The member dashboard is now personal only; the "Admin Overview" section moved to the admin dashboard
- Personal "Settings" link removed from the admin Administration group (it lives in the member sidebar)
- `StatCard` moved to a shared component

### Fixed

- The CMS catch-all page route no longer captures `/admin`, and pages titled "Admin" get the slug `admin-page`

## [0.39.0] - 2026-11-11

### Added

- Care Needs (Phase 23C) at `/admin/care-needs` for pastoral care that isn't financial or counseling
  - Ten need types (prayer, hospital visit, meals, transportation, bereavement, new baby, home visit, practical, absence follow-up, other), four priorities, and an Open / In Progress / Resolved / Closed / Escalated lifecycle
  - Quick filters for "needs action", "assigned to me", and "overdue", plus type, priority, status, and search; overdue rows are highlighted
  - Timeline of notes, calls, texts, emails, and visits; logging a contact on an open need moves it to In Progress
  - Practical help tasks (e.g. a meal roster) that volunteers can be assigned to or sign up for with "I'll do it"
  - Escalate to Benevolence (creates a pending request with mapped category and urgency) or to Counseling (opens a case and makes the need confidential)
  - Confidential needs are visible only to the assignee, the creator, and admins; leaders see needs assigned to them and non-confidential needs for people in their ministries and groups
- "My Care Needs" page for members to ask for help for themselves or their household, with private and prayer wall options
- Members-only Prayer Wall showing shared, non-confidential, open requests from the last 60 days with first names only and an "I prayed" counter
- Notifications: care need assigned, new member care request (admins only when confidential), and care task assigned
- Care Needs tab on member profiles and "My Care Needs" / "Overdue Care Needs" dashboard cards
- `CareNeedService` holding creation, assignment, status, timeline, escalation, task, and prayer logic
- Demo data: six care needs including a meal roster, a prayer wall request with prayers, a confidential request, and an absence follow-up

### Changed

- The weekly `DetectAbsentMembers` job now also opens an "Absence follow-up" care need for each newly flagged member (skipped if one is already open)

## [0.38.0] - 2026-11-11

### Added

- Attendance tracking (Phase 23B) at `/admin/attendance`
  - Sessions for a service time, event, or ministry group on a given date (one per source per day), with a guest count for people not checked in by name
  - Roll call screen with search, "not checked in" filter, one-tap check-in, excused status, undo, and whole-household check-in
  - QR code self check-in at `/check-in/{token}`: members check in themselves and their household, only on the day of the session
  - Group leaders can take attendance for groups they lead; staff manage everything
  - Session CSV export
- Attendance tab on member profiles with a 12-week attendance rate and recent check-ins
- Service attendance chart on the Attendance page and the Analytics dashboard
- Weekly `DetectAbsentMembers` job (Mondays 06:00) that notifies admins and staff about active members who missed the last N service dates in a row
  - Threshold is configurable on the Attendance page (default 3)
  - Only members who have attended before are considered, and each absence streak alerts once
  - "Missing Members" list on the Attendance page
- `AttendanceService` holding check-in, totals, trend, member summary, and absence detection logic
- Demo data: 12 weeks of Sunday Main Service attendance with one lapsed member

## [0.37.0] - 2026-11-11

### Added

- Member directory (Phase 23A) backed by a new `members` table that is separate from login accounts, so children and people without accounts can be recorded
  - Profile fields: preferred name, contact details, date of birth, gender, marital status, address, emergency contact, join and baptism dates, staff-only notes, photo
  - `MembershipStatus` lifecycle (Visitor, Regular, Member, Inactive, Transferred, Deceased) with a full status history (`member_status_changes`)
  - Admin directory at `/admin/members` with search, status, and age band filters, archive (soft delete) and restore
  - Member profile page with Overview, Household, Involvement (ministries, groups, events, duties, courses, reading plans), and History tabs
  - "Invite to account" creates a login for a member and emails a password reset link
  - Leaders only see members of ministries and groups they lead; staff notes are hidden from leaders
- Households at `/admin/households`: create, edit, delete, add and remove people with a household role (Head, Spouse, Child, Other)
- Self-service "Member Details" page under Settings for members to update their own contact details
- Members CSV and PDF export
- Members in global search (leader and above, respecting visibility)
- New "People" sidebar group containing Members, Households, and Visitors
- `MemberService` that centralises member creation, user linking, invites, and status changes
- Demo data: four households, five children without accounts, and a member record for every demo user

### Changed

- Every existing user is backfilled with a member record by migration
- Creating an account through Fortify and converting a visitor now also create or link a member record

## [0.36.0] - 2026-03-21

### Added

- Comprehensive `DemoSeeder` with realistic records across 41 tables
  - 25 users: 5 demo shortcut accounts + 20 realistic church members
  - Dedicated `counselor@example.test` (Staff role) with 3 assigned counseling cases
  - 4 service times, 28 categories across 7 types, 4 speakers
  - 2 sermon series (1 active, 1 completed) with 12 sermons
  - 6 posts (5 published, 1 draft), 4 active highlights
  - 3 reading plans with enrollments and progress tracking
  - 3 courses with modules, lessons, quizzes, and enrollments
  - 3 forms with responses, 8 library books with lendings
  - 7 events with registrations, 8 ministries with groups and members
  - 8 volunteer roles with 3-week schedules
  - 5 visitors at various follow-up stages
  - 8 documents, 3 hero slides, 5 menu items with sub-menu
  - 5 benevolence requests across all statuses with reviews and disbursements
  - 4 counseling cases with sessions, goals, and referrals
- Demo credentials on login page updated to `@example.test` with Counselor account

### Changed

- `DatabaseSeeder` now calls `SiteSettingSeeder`, `PageSeeder`, and `DemoSeeder`
- All demo user emails changed from `@gracecommunity.test` to `@example.test`

## [0.35.0] - 2026-03-09

### Added

- **Global Search (Command Palette)**: Cmd+K powered cross-module search
- SearchController with role-based filtering across Sermons, Events, Documents, Courses, Books, Posts, Pages, Users
- Document visibility respects Public/Members/Admin tiers per user role
- User search restricted to admin users only
- Search trigger button with keyboard shortcut hint in sidebar header
- 12 new tests (782 total)

### Fixed

- SearchController: Event query used non-existent `published_at` column, corrected to `is_published` boolean

## [0.34.0] - 2026-03-09

### Added

- **Bulk Data Export (CSV/PDF)**: Admin data export across 7 modules
- Export classes for Users, Event Registrations, Form Responses, Visitors, Book Lendings, Benevolent Requests, Counseling Cases
- CounselingCasesExport intentionally redacted — only case number, type, status exported (no personal details)
- PDF report templates for Users, Event Registrations, Visitors, Benevolence
- ExportDropdown reusable component added to 7 admin pages
- All exports logged for audit trail
- 14 new tests (770 total)

### Fixed

- VisitorsExport and visitors-report Blade: corrected field name from `converted_user_id` to `converted_to_user_id`
- ExportController return types updated to support both BinaryFileResponse (CSV) and Response (PDF)

## [0.33.0] - 2026-03-07

### Added

- **Reporting & Analytics**: Admin analytics dashboard with 6 chart types
- AnalyticsController with date-range-filtered JSON endpoints
- Membership growth (LineChart), Event attendance (BarChart), Ministry distribution (PieChart)
- Course completion (BarChart), Visitor funnel (BarChart), Benevolence overview (AreaChart)
- Analytics page with date range picker, accessible to admin/staff
- Analytics nav item in sidebar Administration group
- 11 new tests (756 total)

## [0.32.0] - 2026-03-07

### Added

- **Event Calendar View**: Visual month/week/day calendar for events
- EventCalendarDataController returning JSON events for date range with category filtering
- EventCalendar component using react-big-calendar with category-based colors
- List/calendar toggle on events index with localStorage preference persistence
- Calendar route placed before wildcard slug route to prevent route capture
- 6 new tests (745 total)

## [0.31.0] - 2026-03-07

### Added

- **Notification System**: Database + email notifications with 6 notification types
- VolunteerAssignedNotification, EventRegistrationConfirmation, CounselingSessionReminder
- BenevolenceStatusUpdate, ReadingPlanReminder, FormResponseReceived
- NotificationController with index, markAsRead, markAllAsRead
- NotificationBell component with unread badge and dropdown preview
- Notifications page with pagination and mark-all-read
- Unread count and recent notifications shared globally via Inertia
- Notifications dispatched from volunteer, event, benevolence, and form controllers
- 10 new tests (739 total)

## [0.30.0] - 2026-03-07

### Added

- **Event Form Builder Frontend Integration**: Form fields rendered in event registration
- FormFieldRenderer component extracted from forms/show.tsx (10 field types)
- FormValidationService extracts shared validation/scoring logic
- Guest and member event registration now accepts form answers, creates FormResponse
- Dynamic validation rules in RegisterForEventRequest when event has linked form
- 9 new tests (729 total)

## [0.29.1] - 2026-03-06

### Changed

- **Counseling**: Renamed "client" terminology to "person" across the counseling module for a warmer, more pastoral tone
- Database columns renamed: `client_name` → `person_name`, `client_contact` → `person_contact`, `client_email` → `person_email`
- Updated all admin forms, display pages, validation rules, API resource, factory, and tests

## [0.29.0] - 2026-03-06

### Added

- **Counseling Ministry**: Full case management with strict confidentiality
- CounselingCase model with auto-generated case numbers (CC-YYYY-NNNN format)
- Confidentiality: assigned counselor + admin only visibility (scopeVisibleTo, isVisibleTo)
- CounselingSession model with duration, mood rating, session type, progress notes
- CounselingGoal model with priority ordering, status tracking, achievement indicator
- CounselingReferral model with referral type, outcome tracking, document attachments
- 5 new enums: CaseType, CaseStatus, SessionType, GoalStatus, ReferralType
- Admin CRUD with tabbed show page (Overview, Sessions, Goals, Referrals)
- Document attachments via Spatie MediaLibrary on cases, sessions, and referrals
- Auto-sets closed_at timestamp when case status transitions to a closed value
- 25 new tests covering confidentiality, CRUD, sessions, goals, referrals, document upload (720 total)

## [0.28.0] - 2026-03-06

### Added

- **Benevolence Management**: Financial/material assistance request workflow
- BenevolentRequest model with committee review and approval workflow
- BenevolentReview model with upsert support (reviewers can revise their review)
- BenevolentDisbursement model with auto-transition to Disbursed status when total meets approved amount
- 5 new enums: BenevolentCategory, BenevolentStatus, BenevolentUrgency, ReviewRecommendation, DisbursementMethod
- Admin CRUD with two-column show page: request details, evidence files, reviews, disbursements
- Multi-file evidence upload via Spatie MediaLibrary
- Committee review workflow with recommendation, amount recommendation, and comments
- Final decision workflow (Approve/Partially Approve/Deny/Close) with amount approved
- Disbursement tracking with method, reference number, and automatic status transition
- 24 new tests covering role gates, CRUD, reviews, decisions, disbursements, file upload (695 total)

## [0.27.0] - 2026-03-06

### Added

- **Site Logo Management**: Upload and manage a site logo from the Site Settings page
- Logo upload via Storage facade with automatic local/S3 compatibility
- ImageUploader component in General Info tab for drag-and-drop logo upload
- Logo replaces the default SVG icon in admin sidebar (`AppLogo`) and public layout (header + footer)
- `logoUrl` shared globally via Inertia for all pages
- Logo removal with file cleanup from storage
- Backend validation for file type (JPEG, PNG, GIF, WebP, SVG) and size (max 2MB)
- 8 new tests for logo upload, replacement, removal, validation, and Inertia sharing (671 total)

## [0.26.4] - 2026-03-05

### Added

- **Page redirect URL**: CMS pages can now optionally redirect visitors to an external URL instead of displaying page content
- `redirect_url` field on Page model, edit/create forms, and admin index
- External redirect indicator on pages index table for pages with a redirect URL set
- `isRedirect()` helper method on `Page` model
- `redirect()` factory state for creating redirect pages in tests
- 8 new tests covering redirect creation, update, validation, and public redirect behavior (663 total)

## [0.26.3] - 2026-03-05

### Added

- **QR Code page section type**: New `qr_code` section type for CMS page builder — admins can place QR codes anywhere in the page structure
- QR code defaults to the page's own public URL, with option to set a custom URL
- Live QR code preview in admin section editor
- `page_url` field added to `PageResource` and `pageUrl` Inertia prop for public page views
- Backend validation for `url_mode` (page/custom) and `custom_url` fields

## [0.26.2] - 2026-03-05

### Changed

- **Sidebar reorganization**: Replaced flat 18-item admin list with 5 collapsible groups (Worship & Teaching, Content, Community, Growth, Administration) for better navigation
- **Collapsible nav groups**: Groups auto-expand when the current page belongs to that group, using Radix Collapsible + shadcn sidebar sub-menus
- **Moved profile Settings into Administration group**: Consolidated settings access instead of a separate footer link
- **Removed "Platform" label**: Dashboard stands alone without a redundant section header
- **Section label**: Admin section renamed from "Admin" to "Manage"

### Added

- `NavGroup` type in `navigation.ts` for grouped navigation items
- `NavGroupCollapsible` component (`nav-group.tsx`) — reusable collapsible sidebar group with active-route detection

## [0.26.1] - 2026-03-05

### Added

- **Browse library on all admin ImageUploaders**: All 20 admin create/edit forms now support selecting images from the media library via the "browse library" link, matching the pattern already used in hero slides and pages
- **Backend `library_media_id` support**: All 11 admin controllers and form requests now handle `library_media_id` to copy media library items to model collections (cover, photo, thumbnail)

## [0.26.0] - 2026-03-05

### Changed

- **Site Settings consolidation**: Moved Volunteer Roles, Menu Items, and Service Times management into the Site Settings page as additional tabs (6 tabs total: General Info, Hero Section, Social Links, Service Times, Volunteer Roles, Menu Items)
- **Sidebar navigation**: Removed standalone sidebar links for Service Times, Volunteer Roles, and Menu Items; moved Site Settings from admin-only to staff-visible section
- **Controller redirects**: `store()`, `update()`, and `destroy()` actions on all three controllers now redirect back to Site Settings instead of standalone index pages
- **Breadcrumbs and back links**: Create/edit pages for all three features now reference Site Settings as parent
- **Route redirects**: Old index URLs (`/admin/volunteer-roles`, `/admin/menu-items`, `/admin/service-times`) redirect to Site Settings to preserve named routes

### Removed

- Standalone index pages for volunteer roles, menu items, and service times (`index()` controller methods and React index components)

## [0.25.4] - 2026-03-05

### Added

- **Upcoming Sunday Roster Highlight**: Admin roster page now shows a prominent summary card listing all volunteers scheduled for the next Sunday, grouped by role with status badges and service times
- **`scopeForNextSunday`**: New query scope on `VolunteerSchedule` model — returns today if Sunday, otherwise the next Sunday
- **Admin roster props**: `nextSundaySchedules` and `nextSundayDate` passed from `VolunteerScheduleController@index`
- **Member duties Sunday highlight**: Rows matching the next Sunday get a highlighted background (`bg-primary/5`) and a "This Sunday" badge next to the date
- **Member duties prop**: `nextSundayDate` passed from `VolunteerController@myDuties`
- **Logging**: Added roster view and duties view log entries with contextual metadata
- **3 feature tests**: Next-Sunday props verified on both admin roster and member duties pages — 647 total tests

## [0.25.3] - 2026-03-05

### Added

- **Media Library Browser on Hero Slides**: Create and edit hero slide forms now show "or browse library" link on the image uploader
- **`HeroSlideController`**: Handles `library_media_id` in both store and update — copies media via `Media::copy()` to the slide's image collection
- **`StoreHeroSlideRequest`**: Added `library_media_id` validation; image is no longer required on create when a library media ID is provided

## [0.25.2] - 2026-03-05

### Changed

- **Consolidated Hero Slides into Site Settings**: Hero slide management now lives inside the "Hero Section" tab on the Site Settings page instead of a separate admin section
- **Removed standalone Hero Slides pages**: Deleted index page; create/edit pages now navigate back to Site Settings
- **Removed sidebar link**: Hero Slides no longer appears as a separate item in the admin sidebar
- **Route cleanup**: Removed `index` action from hero-slides resource route
- **`SiteSettingController`**: Now passes `heroSlides` collection to the edit view
- **18 feature tests**: Updated assertions to redirect to site-settings; added integration test for slides in settings page — 645 total tests

## [0.25.1] - 2026-03-05

### Changed

- **Hero section text now configurable via Site Settings**: Tagline, heading, and subheading pulled from `general` settings group instead of hardcoded
- **Admin Site Settings page**: Added "Hero Section" tab with tagline, heading, and subheading fields
- **`UpdateSiteSettingsRequest`**: Added `hero_tagline`, `hero_heading`, `hero_subheading` validation rules
- **`SiteSettingController`**: Saves hero fields alongside other general settings
- **`SiteSettingSeeder`**: Seeds default hero text values (`Join us this Sunday`, `Welcome Home`, etc.)
- **`welcome.tsx`**: Reads hero text from shared `siteSettings` with sensible fallbacks; SEO meta tags also dynamic
- **2 new feature tests**: Hero settings update and nullable hero fields — 647 total tests

## [0.25.0] - 2026-03-05

### Added

- **Media Library Browser**: Reusable dialog component for browsing and selecting existing media from the Spatie Media Library
- **MediaLibraryController**: JSON API with search (file_name/name), mime type filtering, pagination (24 per page), ordered by newest first
- **MediaBrowser component**: Dialog with thumbnail grid, search with debounce, single/multi-select mode, load more pagination, skeleton loading
- **Library integration in image uploaders**: `MultiImageUploader` gets a "Browse" button; `ImageUploader` gets an "or browse library" link — both render `MediaBrowser` when `onSelectFromLibrary` prop is provided
- **Page form library selection**: Create and edit page forms can select existing media as cover images via `library_media_ids`; backend uses `Media::copy()` to create independent copies
- **PageResource**: Added `cover_media` field with media IDs for proper ID-based cover management in edit form
- **TypeScript types**: `MediaItem` and `MediaPaginatedResponse` in `resources/js/types/media.ts`
- **11 feature tests**: Auth guards, search, mime filter, pagination, model type basename, library-to-page copy (create + update), validation, ordering — 645 total tests

## [0.24.0] - 2026-03-04

### Added

- **Page Management / CMS Page Builder** (Phase 18): Full custom page builder with flexible content sections and live preview
- **Page model**: JSON `sections` column, multi-image cover (carousel support), Spatie Media Library + Tags, auto-slug generation
- **pages table**: Migration with title, slug (unique), description, layout, sections (json), is_published, category_id, created_by, sort_order
- **3 new enums**: `PageSectionType` (RichText, FormEmbed, Image, CallToAction, VideoEmbed), `PageLayout` (FullWidth, SidebarRight, SidebarLeft, TwoColumn, Landing), `SectionAlignment` (Left, Right, Center, Full)
- **PageResource**: API resource with cover URLs (multi-image), tags, category
- **StorePageRequest**: Nested section validation with SanitizesHtml trait for XSS prevention
- **Admin PageController**: Full CRUD with multi-image cover management, section image handling, logging
- **Public PageController**: Slug-based display, embedded form resolution with field/settings data
- **Admin page builder UI**: Split editor/preview layout (desktop grid, mobile tabs), section list with dnd-kit drag-and-drop, per-section alignment picker, visual layout selector with SVG thumbnails, real-time preview panel
- **5 section editor components**: Rich text (Tiptap), form embed (dropdown), image (URL/alt/caption), call to action (heading/body/button), video embed (YouTube/Vimeo preview)
- **Multi-image uploader**: Extends ImageUploader pattern for multiple files with preview grid and individual remove
- **Hero carousel component**: Auto-scrolling (5s), pause on hover, dot indicators, CSS transitions; single image renders static hero
- **Public section renderer**: Renders all 5 section types including inline form submission to existing `/forms/{slug}/submit` endpoint
- **Menu integration**: New `MenuItemType::Page` case, `page_id` FK on menu_items with nullOnDelete, page selector in menu item create/edit forms
- **PageFactory**: States for `published()`, `draft()`, `withSections()`
- **PageSeeder**: 3 sample pages (About Us, What We Believe, Contact Us)
- **28 feature tests**: Admin CRUD (17), public display (7), menu item integration (4) — 634 total tests

### Changed

- **`MenuItemType` enum**: Added `Page` case with label
- **`CategoryType` enum**: Added `Page` case with label
- **`MenuItem` model**: Added `page_id` fillable, `page()` relationship, `resolvedUrl()` Page type handling
- **`MenuItemController`**: Passes `publishedPages` to create/edit forms
- **`StoreMenuItemRequest` / `UpdateMenuItemRequest`**: Added `page_id` validation (required_if type is page)
- **`HandleInertiaRequests`**: Eager loads `page` relationship at all navigation nesting levels
- **`config/menu.php`**: Added Documents to available_pages list
- **Menu item create/edit pages**: Added page selector dropdown for Page type menu items
- **`routes/admin.php`**: Added pages resource route
- **`routes/public.php`**: Added `/pages/{page:slug}` route

## [0.23.0] - 2026-03-04

### Added

- **Hero Image Carousel** (Phase 18): Full-width hero image carousel on the homepage landing page
- **HeroSlide model**: Spatie Media Library `image` collection (singleFile), `scopeActive()`, sortable
- **hero_slides table**: Migration with title, subtitle, link_url, link_text, sort_order, is_active columns
- **HeroSlideFactory**: Default active state with `active()` and `inactive()` factory states
- **StoreHeroSlideRequest**: Image required on create (nullable on update), 5MB max, JPEG/PNG/GIF/WebP
- **HeroSlideController**: Full CRUD (index, create, store, edit, update, destroy) with logging
- **HeroCarousel component**: Embla Carousel with autoplay (5s), pause on hover, dot indicators, arrow navigation
- **Admin hero slides pages**: Index (table with thumbnails), create form with ImageUploader, edit form
- **Admin sidebar**: "Hero Slides" link with GalleryHorizontalEnd icon for staff+ users
- **20 feature tests**: Access control, CRUD, image upload/replace, validation, welcome page integration

### Changed

- **`HomeController`**: Queries active hero slides with images, passes `heroSlides` prop to welcome page
- **`welcome.tsx`**: Renders `<HeroCarousel>` when hero slides exist, falls back to text hero section
- **`app-sidebar.tsx`**: Added Hero Slides navigation link in admin section
- **`routes/admin.php`**: Added `hero-slides` resource route (except show)
- **`package.json`**: Added `embla-carousel-react` and `embla-carousel-autoplay` dependencies

## [0.22.1] - 2026-03-04

### Added

- **Global Flash Toasts**: Installed `sonner` and wired flash messages as toast notifications across all layouts
- **`use-flash-messages` hook**: Listens to Inertia shared `flash` props and fires Sonner toasts with dedup tracking
- **`Toaster` component**: shadcn/ui-styled Sonner wrapper with theme-aware colors (`components/ui/sonner.tsx`)
- **All 3 layouts updated**: `app-layout.tsx` (admin), `public-layout.tsx` (public), `auth-layout.tsx` (auth) now render toasts globally
- Flash messages from all 29+ controllers now display automatically without per-page handling

## [0.22.0] - 2026-03-04

### Added

- **Site Settings** (Phase 16-Settings): Centralized key-value site configuration with admin management
- **SiteSetting model**: Group/key storage with static `getValue()`, `setValue()`, `getByGroup()` helpers
- **site_settings table**: Migration with `group` + `key` unique constraint, nullable text `value` column
- **SiteSettingFactory**: States for `general()` and `social()` groups
- **SiteSettingSeeder**: Default values for church_name, tagline, address, phone, email, and empty social links
- **Admin settings page**: Tabbed interface (General Info + Social Links) with dynamic add/remove social link rows
- **UpdateSiteSettingsRequest**: Admin-only authorization, validates general fields and social link array
- **SiteSettingController**: Edit/update actions with cache invalidation and logging
- **SocialIcon component**: Maps platform keys (facebook, instagram, youtube, etc.) to lucide-react icons
- **Inertia middleware sharing**: `siteSettings` and `serviceTimes` shared globally via `HandleInertiaRequests` with 5-minute cache
- **TypeScript types**: `SiteSettings`, `SocialLink`, `ServiceTimeShared` added to shared page props
- **17 feature tests**: Access control (member/staff/leader denied, admin allowed), general CRUD, social links validation, Inertia sharing, logging

### Changed

- **`routes/admin.php`**: Added `GET/PUT admin/site-settings` routes
- **`HandleInertiaRequests.php`**: Shares `siteSettings` and `serviceTimes` globally to all pages
- **`public-layout.tsx`**: Footer now uses dynamic tagline, address, phone, email, service times, and social media icons
- **`welcome.tsx`**: Uses shared `serviceTimes` prop from Inertia middleware instead of page-specific prop
- **`HomeController.php`**: Removed `serviceTimes` query (now shared globally via middleware)
- **`app-sidebar.tsx`**: Added "Site Settings" link in admin-only section with Sliders icon
- **`global.d.ts`**: Added `siteSettings` and `serviceTimes` to shared page props interface

## [0.21.0] - 2026-03-04

### Added

- **Document Management** (Phase 17): Upload, organize, and share church documents with visibility controls
- **Document model**: HasMedia + HasTags traits, two media collections (file + thumbnail), auto-slug, visibility scopes
- **DocumentVisibility enum**: Public, Members, Admin/Staff visibility tiers
- **CategoryType::Document**: New category type for document organization
- **DocumentFactory**: States for published/unpublished, public/membersOnly/adminOnly
- **Admin CRUD pages**: Index with search, category filter, visibility filter; create/edit with file upload, tags, thumbnails
- **Public pages**: Card grid listing with search/category filter, detail page with in-browser preview
- **DocumentPreview component**: Inline iframe for PDFs, image display, download card for Office documents
- **StoreDocumentRequest**: SanitizesHtml trait, 20MB file limit, supports PDF/Word/Excel/PowerPoint/images
- **DocumentResource**: File metadata (url, name, size, mime_type), isPdf/isImage helpers
- **Visibility enforcement**: Guests see Public only, members see Public+Members, staff/admin see all
- **24 tests**: 12 admin + 12 public tests covering CRUD, visibility, search, filters

### Changed

- **`app/Enums/CategoryType.php`**: Added `Document` case
- **`app-sidebar.tsx`**: Added "Documents" link to admin sidebar
- **`routes/admin.php`**: Added `documents` resource route
- **`routes/public.php`**: Added `/documents` listing and `/documents/{slug}` detail routes

## [0.20.0] - 2026-03-04

### Added

- **Menu Management** (Phase 16): Database-driven public navigation menu so admins can manage header nav without code changes
- **MenuItem model**: Self-referencing tree with parent/children relationships, 2-level nesting support, cache invalidation on save/delete
- **MenuItemType enum**: `InternalPage` and `CustomUrl` link types
- **MenuItemTarget enum**: `Self` (_self) and `Blank` (_blank) window targets
- **Admin CRUD pages**: Index with tree display, create/edit forms with conditional fields based on link type
- **Dynamic navigation**: Public header desktop dropdown menus (hover-triggered) and mobile accordion submenus
- **Footer Quick Links**: Now renders from dynamic navigation data instead of hardcoded array
- **Navigation caching**: 5-minute cache with automatic invalidation via model events
- **`config/menu.php`**: Predefined list of 13 internal pages for admin selection
- **Migration seeds**: Default nav items matching the previous hardcoded navigation

### Changed

- **`public-layout.tsx`**: Replaced hardcoded `navLinks` array with shared `navigation` prop from database
- **`HandleInertiaRequests.php`**: Added `navigation` to shared Inertia data with cached menu tree
- **`app-sidebar.tsx`**: Added "Menu Items" link to admin sidebar
- **`global.d.ts`**: Added `navigation` to shared page props type
- **`routes/admin.php`**: Added `menu-items` resource route

## [0.19.0] - 2026-03-04

### Added

- **Drag-and-Drop Form Builder**: Redesigned the admin form create/edit pages with a modern two-panel layout — editor on the left, live preview on the right
- **Field Palette** (`form-builder/field-palette.tsx`): Visual grid of 10 field type buttons with icons and tooltips for quick field addition
- **Sortable Field Cards** (`form-builder/sortable-field-card.tsx`): Collapsible, draggable field cards with GripVertical handle, inline editing, duplicate and delete actions
- **Live Preview Panel** (`form-builder/form-preview-panel.tsx`): Real-time form preview that mirrors the public form view, updating as fields are configured
- **Field Preview Renderer** (`form-builder/field-preview-renderer.tsx`): Renders disabled preview of all 10 field types (text, textarea, email, number, date, select, radio, checkbox, rating, scale)
- **useFormBuilder Hook** (`hooks/use-form-builder.ts`): Centralized hook for all field operations — add, remove, update, move, duplicate, and options management
- **Shared Form Types** (`types/forms.ts`): Extracted `FieldOption`, `FormField`, `FormSettings`, `FormData` types and helper functions into a shared module
- **Responsive Layout**: Desktop shows side-by-side editor + sticky preview; mobile uses tabbed interface (Editor/Preview tabs)

### Changed

- **`admin/forms/create.tsx`**: Refactored from single-column form to split-panel form builder layout
- **`admin/forms/edit.tsx`**: Same split-panel refactoring with drag-and-drop reordering support

### Dependencies

- **NPM**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

## [0.18.0] - 2026-03-04

### Added

- **Tiptap Rich Text Editor**: Replaced all plain `<Textarea>` components in 26 admin forms (13 create + 13 edit) with a new `RichEditor` component powered by Tiptap
- **RichEditor Component** (`components/admin/rich-editor.tsx`): Toolbar with Bold, Italic, Underline, Strikethrough, H2, H3, Bullet List, Ordered List, Blockquote, Link, Undo/Redo using shadcn/ui `Toggle` buttons
- **HTML Sanitization Trait** (`SanitizesHtml`): Backend trait using `mews/purifier` to sanitize HTML input, strip script tags, and normalize empty editor output to null
- **`stripHtml` Utility**: Frontend helper for extracting plain text from HTML content (used in meta tags and calendar exports)
- **Tailwind Typography Plugin**: Added `@tailwindcss/typography` for `prose` class styling on public pages
- **HTML Sanitization Tests**: 3 new tests verifying XSS prevention, empty content normalization, and valid HTML passthrough (522 total tests)

### Changed

- **13 Form Requests**: All admin form requests now use `SanitizesHtml` trait for fields that accept rich text (description, body, notes, bio, excerpt)
- **5 Public Show Pages**: Updated to render HTML content with `dangerouslySetInnerHTML` + `prose` classes instead of `whitespace-pre-wrap` plain text (updates, events, library, ministries, sermons)
- **Meta Tags**: Public pages now use `stripHtml()` to extract plain text for SEO meta descriptions
- **StorePostRequest**: Increased excerpt `max` validation from 500 to 2000 to accommodate HTML tags

### Dependencies

- **NPM**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tailwindcss/typography`
- **Composer**: `mews/purifier` v3.4

## [0.17.1] - 2026-03-04

### Fixed

- **Visitor Registration Form**: Flash messages (success/error) were not being shared with Inertia, so the "Thank You" screen never appeared after submission
- **HandleInertiaRequests Middleware**: Added `flash` data sharing so all controllers using `->with('success', ...)` or `->with('error', ...)` now work correctly across the app

### Changed

- **Visitor Form**: Removed address field from public registration form, validation rules, and form data
- **Wayfinder Route**: Replaced hardcoded `/visit` POST URL with Wayfinder route import

## [0.17.0] - 2026-03-04

### Changed

- **Spatie Media Library Integration**: Replaced custom media system (`MediaService`, custom `Media` model, FK columns) with `spatie/laravel-medialibrary` v11
- **16 Models Updated**: All models now implement `Spatie\MediaLibrary\HasMedia` with `InteractsWithMedia` trait and `registerMediaCollections()` defining typed, single-file collections
- **10 Admin Controllers**: Store/update methods now handle file uploads via `addMediaFromRequest()` and removals via `clearMediaCollection()`
- **10 Form Requests**: Validation changed from `exists:media,id` to `image|max:10240|mimes:jpg,jpeg,png,gif,webp` with `remove_cover` boolean
- **10 Eloquent Resources**: Media URLs now use `getFirstMediaUrl('collection')` instead of `whenLoaded()` BelongsTo pattern
- **10 Public Controllers**: Eager loading updated from old relationship names (`cover`, `photo`, `audio`) to Spatie's `media` relationship
- **User Profile**: Avatar upload/removal on profile settings page with `PATCH` method spoofing for file upload support

### Added

- **ImageUploader Component**: Reusable `resources/js/components/admin/image-uploader.tsx` with drag-and-drop, preview, remove, and Inertia upload progress
- **Image Upload on All Admin Forms**: 20 create/edit pages (speakers, series, sermons, posts, highlights, reading plans, courses, books, events, ministries) now include ImageUploader with progress bar
- **User Avatar Support**: Avatar upload/removal on profile page, `avatar_url` shared via Inertia middleware
- **Media Upload Tests**: `tests/Feature/Admin/MediaUploadTest.php` — 9 tests covering upload, replace, remove, validation, auth
- **Database Migration**: Drops 15 FK columns from old media system, creates Spatie polymorphic media table

### Removed

- **Custom Media Infrastructure**: Deleted `app/Models/Media.php`, `app/Services/MediaService.php`, `app/Jobs/ProcessMediaUpload.php`, `app/Models/Traits/HasMedia.php`, `database/factories/MediaFactory.php`

## [0.16.0] - 2026-03-04

### Changed

- **Spatie Tags Integration**: Replaced custom tag system (`App\Models\Traits\HasTags`, `syncTagsByName()`) with `spatie/laravel-tags` v4 (`Spatie\Tags\HasTags`, `syncTags()`)
- **Tag Model**: Now extends `Spatie\Tags\Tag` with translatable JSON name/slug columns
- **EventResource**: Tags now returned as `string[]` instead of `{id, name}[]` objects for consistency with SermonResource and PostResource
- **Admin Controllers**: Sermon, Post, and Event controllers now pass `allTags` prop to create/edit pages for autocomplete suggestions

### Added

- **TagInput Component**: Reusable `resources/js/components/tag-input.tsx` with badge chips, X remove buttons, Enter/comma to add, backspace to remove last, and filtered autocomplete dropdown from existing tags
- **Tags UI on All Admin Forms**: Sermon create/edit, Post create/edit, and Event create/edit all now render the TagInput component in a dedicated Tags FormSection
- **Database Migration**: Converts existing tag name/slug values to Spatie-compatible JSON format, adds `type` and `order_column` columns

### Removed

- **Custom HasTags Trait**: Deleted `app/Models/Traits/HasTags.php` (replaced by `Spatie\Tags\HasTags`)

## [0.15.0] - 2026-03-04

### Changed

- **Admin Form Layout Redesign**: Replaced narrow Card-based centered layout (`max-w-2xl mx-auto`) with a consistent sectioned full-width layout across all 29 admin Create/Edit pages
- **FormSection Component**: New `resources/js/components/admin/form-section.tsx` for grouping form fields with title and description headings
- **Textarea Component**: New `resources/js/components/ui/textarea.tsx` shadcn-style component replacing raw `<textarea>` elements with inline styles
- **Page Structure**: All admin form pages now use a `flex flex-col gap-6 p-4` container with back link, h1 title, description, and `max-w-3xl space-y-8` form body
- **Error Display**: Standardized error messages using `InputError` component instead of inline `<p>` tags
- **Section Dividers**: Added `Separator` components between logical form sections for visual clarity

## [0.14.0] - 2026-03-04

### Changed

- **Landing Page Redesign**: Complete visual overhaul of the public landing page and layout with warm earth-tone aesthetic
- **Typography**: Replaced Instrument Sans with Playfair Display (serif headings) and DM Sans (body text) for a refined editorial feel
- **Color Scheme**: Replaced monochrome palette with warm earth tones -- off-white backgrounds, warm charcoal text, bronze/golden accents throughout light and dark modes
- **Hero Section**: New hero with "Welcome Home" serif heading, bronze "Plan Your Visit" CTA, uppercase "Join us this Sunday" label, and decorative gradient backdrop
- **Service Times Bar**: Moved service times from a feature card into a prominent dark banner below the hero with golden labels
- **Navigation**: "Visit" link restyled as a bronze CTA button in the header; breakpoint adjusted to `lg` for better tablet layout
- **Explore & Grow Section**: Replaced service times card with Ministries card; golden-tinted icon backgrounds with bronze accents and inline link text
- **CTA Section**: Dark earth background with golden accent button, heart icon, and Playfair heading
- **Footer**: Dark charcoal background with 4-column layout (Brand, Quick Links, Service Times, Connect), golden heading accents, and warm hover states
- **Cards**: Bronze-tinted hover shadows and border transitions across all card sections (highlights, updates, courses, events)
- **CSS Variables**: New custom Tailwind theme tokens (`bronze`, `golden`, `warm-cream`, `earth-dark`, `earth-light`) for consistent warm accents

## [0.13.1] - 2026-03-04

### Added

- **Calendar Save (.ics)**: After registering for an event, users can download an .ics file or open Google Calendar with pre-filled event details
- **EventCalendarController**: Invokable controller generating RFC 5545 iCalendar files with proper all-day/timed event handling and text escaping
- **Route**: `GET /events/{event:slug}/calendar.ics` for .ics file downloads
- **Test Coverage**: 8 new tests covering content type, iCal fields, date formats, 404 on unpublished, special character escaping (511 total)

## [0.13.0] - 2026-02-25

### Changed

- **Service Times now database-driven**: Replaced hardcoded `ServiceTime` enum with a `service_times` database table and full admin CRUD at `/admin/service-times`, allowing dynamic creation, editing, and deletion of service times
- **ServiceTime Model**: New model with auto-slug, start/end times, sort order, active/inactive status, and schedule relationship
- **Admin Service Time Management**: Index with search and time display, create/edit forms with time pickers and validation (end time must be after start time), delete protection when schedules exist
- **VolunteerSchedule updated**: Now uses `service_time_id` FK instead of `service_time` string column, with data migration preserving existing Morning/Evening records
- **Roster page**: Service time dropdown now loads dynamically from database instead of hardcoded Morning/Evening
- **Sidebar**: Added "Service Times" link under Admin section
- **Test Coverage**: 10 new tests for service time CRUD, access control, search, delete protection; updated volunteer schedule and duty tests (503 total)

## [0.12.0] - 2026-02-25

### Added

- **Visitor Model**: Visitor registration with follow-up tracking, status workflow (`FollowUpStatus` enum: New, Contacted, FollowUp, Connected, Closed), assignment to staff, and conversion to member with password reset email
- **VisitorFollowUp Model**: Follow-up records with `FollowUpType` enum (Call, Email, Visit, Text), notes, and timestamps
- **Admin Visitor Management**: Visitor listing at `/admin/visitors` with search (name/email), status filter, follow-up counts, visitor detail with two-column layout (info card + follow-up timeline), status/assignment updates, add follow-up, and convert to member
- **Public Visitor Registration**: Clean registration form at `/visit` with name, email, phone, address, visit date, "how heard" select, and prayer requests
- **Test Coverage**: 19 new tests covering admin access control, CRUD, search, filter, follow-up, convert (with email guard and duplicate guard), public registration and validation

## [0.11.0] - 2026-02-25

### Added

- **VolunteerRole Model**: Volunteer roles with optional ministry association, auto-slug, and active/inactive scopes
- **VolunteerSchedule Model**: Duty assignments with `ServiceTime` enum (Morning, Evening), `ScheduleStatus` enum (Scheduled, Confirmed, Declined, Absent), unique constraint on role+user+date+time, week/date/user scopes
- **Admin Volunteer Role CRUD**: Full role management at `/admin/volunteer-roles` with search, ministry association, and active filter
- **Admin Volunteer Roster**: Weekly grid view at `/admin/volunteer/roster` with role rows, 7-day columns, week navigation, role/user filters, single and bulk schedule creation, status updates
- **Member Duty Management**: My duties page at `/volunteer/my-duties` with upcoming assignments, confirm/decline buttons, and ownership enforcement
- **Test Coverage**: 26 new tests covering role CRUD, roster view, schedule creation (single and bulk with duplicate skip), status updates, member duties, confirm/decline with ownership check

## [0.10.0] - 2026-02-25

### Added

- **Ministry Model**: Church ministries with auto-slug, leader assignment, cover image, groups/members relationships, active scope, and BelongsToMany users through pivot
- **MinistryGroup Model**: Small groups within ministries with leader, meeting schedule (day/time/location), max member capacity, full/available detection, and active scope
- **MinistryMember Model**: Ministry membership with `MinistryRole` enum (Leader, Member, Volunteer) and join date tracking
- **GroupMember Model**: Group membership with join date and unique user-group constraint
- **Admin Ministry CRUD**: Full ministry management at `/admin/ministries` with search, leader selection, member listing, and group count display
- **Admin Group CRUD**: Full group management at `/admin/ministry-groups` with ministry filter, search, meeting schedule fields, max members, and member listing
- **Public Ministry Pages**: Ministry listing at `/ministries` with card grid, search, cover images; detail page at `/ministries/{slug}` with groups list and join buttons
- **Group Finder**: Filterable group discovery at `/groups/finder` with meeting day select, location search, availability toggle, and join button for authenticated users
- **Member Enrollment**: Join/leave ministry and group endpoints with duplicate and capacity guards
- **Test Coverage**: 32 new tests covering admin CRUD for ministries and groups, public listing/detail/finder, member join/leave with duplicate and full-group guards

## [0.9.0] - 2026-02-25

### Added

- **Event Model**: Events with auto-slug, `EventRecurrence` enum (None, Daily, Weekly, Monthly), published/upcoming/past scopes, max attendees with capacity tracking, category/tag support, optional Form Builder integration for custom registration fields, and cover image
- **EventRegistration Model**: Registrations with `RegistrationStatus` enum (Registered, Waitlisted, Cancelled), guest support (nullable user_id), unique email-per-event constraint, and optional form response linkage
- **CategoryType Extension**: Added `Event` case to `CategoryType` enum for event categorization
- **Admin Event CRUD**: Full event management at `/admin/events` with search (title/location), category filter, registration counts, registrations sub-page with status/type badges
- **Public Event Pages**: Event listing at `/events` with search, category filter, date/location badges, and card grid; event detail at `/events/{slug}` with guest registration form (or member RSVP button), capacity display, and category/tag badges
- **Member Event Registration**: Authenticated RSVP at `POST /events/{event}/rsvp` with published/full/duplicate guards, cancellation at `POST /events/{event}/rsvp/cancel`
- **Guest Event Registration**: Public guest registration at `POST /events/{slug}/register` with name/email/phone validation and optional Form Builder answers
- **Test Coverage**: 26 new tests covering admin CRUD with search/filter, public listing/show/guest registration with validation/duplicate/full guards, member RSVP with auth/published/full/duplicate/cancel guards

### Added (Cross-cutting)

- **Sidebar**: Added Events and Ministries to Browse section; added Events, Ministries, Groups, Volunteer Roles, Roster, and Visitors to Admin section
- **Public Layout**: Added Events, Ministries, and Visit links to public navigation
- **Dashboard (Member)**: Added Upcoming Events, My Ministries, and Upcoming Duties widgets
- **Dashboard (Admin)**: Added Events, Ministries, Groups, Upcoming Schedules, New Visitors, and Total Visitors stat cards
- **Home Page**: Added upcoming events section with date/location cards

## [0.8.0] - 2026-02-24

### Added

- **QR Code Endpoint**: SVG QR code generation at `/qr/{path}` using BaconQrCode, with configurable size (50-500px), cache headers, and catch-all path support for any page URL
- **QR Code Component**: React `<QrCode>` component with lazy loading for embedding QR codes in any page
- **Dashboard Widgets (Member)**: Replaced placeholder dashboard with personalized member widgets — active course enrollments with progress bars, reading plan progress, borrowed books with overdue badges, and recent published sermons
- **Dashboard Widgets (Admin)**: Admin overview section for leaders/staff/admins showing counts for users, sermons, courses, reading plans, books, posts, forms, form responses, active lendings, overdue lendings, and enrollments
- **Dynamic Home Page**: Enhanced landing page with current sermon spotlight (auto-fallback to latest), active highlights grid, recent published posts, and featured courses sections — all conditional on data availability
- **SEO Meta Tags**: Open Graph meta tags (`og:title`, `og:description`, `og:type`) and description meta tags added to sermon, post, course, reading plan, and book detail pages
- **Test Coverage**: 24 new tests covering QR code generation (SVG output, size clamping, nested paths, cache headers), dashboard member data (enrollments, lendings, sermons) and admin stats, home page dynamic content (sermon spotlight fallback, highlight ordering/limits, post/course filtering) — 390 total tests

### Changed

- Dashboard route now uses `DashboardController` instead of inline closure
- Home page controller now queries published content for dynamic sections
- Used existing `bacon/bacon-qr-code` v3 package directly instead of `simplesoftwareio/simple-qrcode` due to dependency conflicts

## [0.7.0] - 2026-02-24

### Added

- **Book Model**: Library books with auto-slug, published scope, category relationship, cover image, copy tracking (total/available), location field, and availability check
- **BookLending Model**: Lending records with active/overdue scopes, borrower/lender/returner relationships, date tracking (borrowed, due, returned), and overdue detection
- **Admin Book CRUD**: Full book management at `/admin/books` with search, category filter, availability/published badges, copy counts, and delete support
- **Lending Management (Admin)**: Lending listing at `/admin/books-lendings` with status filter (all/active/overdue/returned), lend book to user (`POST /admin/books/{book}/lend`) with availability check and copy decrement, mark as returned (`PATCH /admin/lendings/{lending}/return`) with copy increment
- **Public Library Pages**: Book catalog at `/library` with search (title/author), category filter, cover image grid with availability badges; book detail at `/library/{slug}` with cover, metadata card (publisher, ISBN, location), and description
- **Member My Lendings**: Borrowed books listing at `/library/my-lendings` with book/date/status columns and overdue/active/returned badges
- **API Resources**: `BookResource` (cover URL, category, availability, lending count) and `BookLendingResource` (book/user/lender info, overdue/returned computed)
- **Form Request**: `StoreBookRequest` with title/author required, optional ISBN/publisher/description/copies/location
- **Factories**: `BookFactory` (published/unpublished/unavailable states), `BookLendingFactory` (returned/overdue states)
- **Test Coverage**: 35 new tests covering model relationships and scopes, admin CRUD with search/filter, lending flow (lend/return/availability check/duplicate return prevention), public catalog with search and category filter, unpublished book 404, member lending isolation (366 total tests)

### Fixed

- Route loading order: member routes now load before public routes to prevent wildcard slug routes from capturing named member paths (e.g., `/library/my-lendings`)

## [0.6.0] - 2026-02-24

### Added

- **Form Model**: Dynamic form builder with JSON field definitions, auto-slug, published/active scopes, expiration dates, max response limits, anonymous submission support, per-user response limits, and scoring system
- **FormResponse Model**: Response tracking with JSON answers, optional user association, IP/user agent logging, score calculation, and submission timestamps
- **Form Builder (Admin)**: Full form management at `/admin/forms` with search, status filter, field builder (10 field types: text, textarea, email, number, date, select, radio, checkbox, rating, scale), option management with correct answer marking, scoring configuration, notification emails, and settings panel
- **Response Viewer (Admin)**: Response listing per form at `/admin/forms/{form}/responses` with user/anonymous display, answer grid, score badges, and pagination
- **Public Form Renderer**: Dynamic form page at `/forms/{slug}` that renders forms from JSON field definitions, handles all field types (including interactive rating stars and scale selectors), validates required fields, records submissions with IP and user agent, and shows confirmation messages
- **Form Settings**: Configurable confirmation message, expiration date, max responses, one-response-per-user enforcement, anonymous submission toggle, scoring with points per field, and notification email list
- **API Resources**: `FormResource` (with active status, response count, creator) and `FormResponseResource` (with user info, answers, score)
- **Form Request**: `StoreFormRequest` with nested field/option validation, settings validation, and custom error messages
- **Factories**: `FormFactory` (published/unpublished/expired/anonymous/withScoring/onePerUser/maxResponses states), `FormResponseFactory` (anonymous/scored states)
- **Test Coverage**: 39 new tests covering model scopes and methods, admin CRUD with search/filter, form validation, public form display and submission, anonymous access, response limits, expiration, required field validation, and IP tracking (331 total tests)

## [0.5.0] - 2026-02-24

### Added

- **Course Model**: Academy courses with auto-slug, `CourseDifficulty` enum (Beginner, Intermediate, Advanced), published scope, modules/lessons via HasManyThrough, enrollment tracking, and max enrollment limits
- **CourseModule Model**: Sections within courses with sort ordering and cascading lesson management
- **Lesson Model**: Course lessons with `LessonContentType` enum (Video, Text, Mixed), auto-slug, video URL/media support, duration tracking, free preview flag, and resource attachments
- **LessonResource Model**: Downloadable materials attached to lessons with media association
- **Quiz Model**: Quizzes linked to lessons or courses with passing score threshold, time limits, and max attempts
- **QuizQuestion Model**: Questions with `QuizQuestionType` enum (MultipleChoice, TrueFalse, ShortAnswer), JSON options/correct answers, point values, and explanations
- **QuizAttempt Model**: User quiz submissions with JSON answers, score calculation, and pass/fail tracking
- **CourseEnrollment Model**: User enrollment with progress percentage, auto-completion when all lessons done, and `recalculateProgress()` method
- **LessonCompletion Model**: Per-user lesson completion tracking with unique constraint
- **Certificate Model**: Auto-generated UUID and certificate number, issued on course completion
- **Assignment / AssignmentSubmission Models**: Lesson assignments with user submissions, scoring, and grading workflow
- **Admin Course CRUD**: Full course management at `/admin/courses` with search, difficulty/status filters, module/lesson inline management (add/edit/delete modules and lessons within course detail page)
- **Public Academy Pages**: Course catalog with search, difficulty/category filters (`/academy`), course detail with curriculum, progress sidebar, and enrollment button (`/academy/{slug}`)
- **Member Enrollment Flow**: Enroll in courses (`POST /academy/{course}/enroll`), lesson viewer with sidebar navigation and progress bar (`/academy/{course}/learn/{lesson}`), mark lessons complete with auto-certificate issuance
- **Quiz System**: Quiz display with multiple question types, score calculation, pass/fail determination, max attempts enforcement (`POST /academy/quizzes/{quiz}/attempt`)
- **Certificate Viewer**: Decorative certificate page with user name, course title, date, and certificate number (`/academy/certificates/{uuid}`)
- **API Resources**: `CourseResource`, `CourseModuleResource`, `LessonResource`, `QuizResource`, `QuizQuestionResource` (admin-only correct answers)
- **Form Requests**: `StoreCourseRequest`, `StoreCourseModuleRequest`, `StoreLessonRequest`, `StoreQuizRequest` with validation rules
- **Factories**: 12 new factories with states (published/unpublished, beginner/intermediate/advanced, video/freePreview, passed/failed, completed, graded)
- **Test Coverage**: 50 new tests covering model relationships and scopes, admin CRUD and nested resource management, public page rendering with filters, member enrollment flow, lesson completion, quiz scoring, max attempts, and certificate issuance (292 total tests)

## [0.4.0] - 2026-02-24

### Added

- **ReadingPlan Model**: Bible reading plans with auto-slug, published scope, cover image, duration tracking, and enrollment relationship
- **ReadingPlanDay Model**: Daily readings with day number, title, scripture reference, and optional reflection, ordered by day number
- **ReadingPlanEnrollment Model**: User enrollment tracking with started_at/completed_at timestamps, completion percentage calculation, and auto-completion detection
- **ReadingPlanProgress Model**: Per-day progress tracking linked to enrollments with completed_at timestamps
- **Admin Reading Plan CRUD**: Full plan management at `/admin/reading-plans` with search, published badge, enrollment counts, and inline day management (add/edit/delete days)
- **Public Reading Plan Pages**: Plan listing with search and card grid (`/reading-plans`), detail page with daily readings list, progress sidebar with percentage bar, and enrollment button (`/reading-plans/{slug}`)
- **Member Enrollment**: Enroll in published plans (`POST /reading-plans/{plan}/enroll`), mark daily progress (`PATCH /reading-plans/{plan}/progress/{day}`), auto-complete plan when all days finished
- **API Resources**: `ReadingPlanResource` and `ReadingPlanDayResource` with enrollment counts and cover URL
- **Form Requests**: `StoreReadingPlanRequest` and `StoreReadingPlanDayRequest` with validation rules and custom messages
- **Factories**: `ReadingPlanFactory` (published/unpublished states), `ReadingPlanDayFactory`, `ReadingPlanEnrollmentFactory` (completed state), `ReadingPlanProgressFactory`
- **Test Coverage**: 44 new tests covering model relationships and scopes, admin CRUD and day management, public page rendering, member enrollment and progress tracking, auto-completion logic (242 total tests)

## [0.3.0] - 2026-02-23

### Added

- **Post Model**: Blog-style updates with auto-slug, published/draft states, featured flag, category and tag support, author relationship, and cover image
- **Highlight Model**: Long-running announcements with `HighlightType` enum (Announcement, Event, Campaign, Testimony), priority ordering, active scope (date range + is_active flag), and cover image
- **HighlightType Enum**: Four highlight types with labels for consistent categorization
- **Admin Post CRUD**: Full post management at `/admin/posts` with search, category filter, tag syncing, featured toggle, and publish scheduling
- **Admin Highlight CRUD**: Full highlight management at `/admin/highlights` with search, type filter, priority, date range, and active/inactive toggle
- **Public Updates Pages**: Post listing with search and category filter (`/updates`), detail page with cover image, author, tags, and related posts sidebar (`/updates/{slug}`)
- **Public Highlights Page**: Active highlights listing ordered by priority (`/highlights`) with type badges and date ranges
- **API Resources**: `PostResource` and `HighlightResource` with whenLoaded relationships and computed fields
- **Form Requests**: `StorePostRequest` and `StoreHighlightRequest` with validation rules, custom messages, and authorization checks
- **Factories**: `PostFactory` (published/draft/featured states), `HighlightFactory` (inactive/expired states)
- **Test Coverage**: 48 new tests covering model scopes, relationships, admin CRUD, validation, search, filtering, public page rendering, and access control (198 total tests)

## [0.2.0] - 2026-02-23

### Added

- **Speaker Model**: Speakers with auto-slug generation, photo media relationship, and sermons association
- **Sermon Series Model**: Series with cover images, active/inactive state, date ranges, and ordered sermons
- **Sermon Model**: Full sermon management with speaker, series, tags, scripture references (JSON), audio/video media, published/draft states, and current week flagging
- **Sermon Resources Model**: Downloadable attachments for sermons (PDFs, study guides, etc.)
- **Admin Speaker CRUD**: Full speaker management at `/admin/speakers` with search, create, edit, delete
- **Admin Series CRUD**: Full series management at `/admin/series` with active status, date ranges
- **Admin Sermon CRUD**: Full sermon management at `/admin/sermons` with speaker/series filters, tag syncing, scripture references, publish scheduling
- **Public Sermon Pages**: Sermon listing with search and series filter (`/sermons`), detail page with embedded video player, audio player, notes, scripture badges, related sermons, and downloadable resources (`/sermons/{slug}`)
- **Public Series Pages**: Series listing (`/series`) filtered to only show series with sermons, series detail with paginated sermons (`/series/{slug}`)
- **API Resources**: `SermonResource`, `SpeakerResource`, `SermonSeriesResource`, `SermonResourceItemResource` for consistent data transformation
- **Form Requests**: `StoreSermonRequest`, `StoreSpeakerRequest`, `StoreSermonSeriesRequest` with validation rules and authorization checks
- **MarkCurrentWeekSermon Job**: Scheduled weekly job (Monday 1:00 AM) to auto-flag the most recent Sunday sermon as current week
- **Factories**: `SermonFactory` (published/draft/currentWeek states), `SpeakerFactory`, `SermonSeriesFactory` (inactive/completed states), `SermonResourceFactory`
- **Test Coverage**: 58 new tests covering model relationships, admin CRUD operations, public page rendering, search filters, validation, and the scheduled job (150 total tests)

### Fixed

- Factory slug generation now defers to model boot events for consistent auto-slug behavior
- Series listing uses `whereHas` instead of `having` for SQLite compatibility
- MarkCurrentWeekSermon uses `whereDate` for reliable date comparison across database engines

## [0.1.0] - 2026-02-23

### Added

- **Role System**: Custom enum-based role system (`UserRole` enum) with Admin, Staff, Leader, Member roles and hierarchical access levels
- **Role Middleware**: `EnsureUserHasRole` middleware for route-level role protection with `role:` alias
- **Authorization Gates**: `manage-system`, `manage-content`, `manage-groups`, `view-admin` gates in AppServiceProvider
- **Media Model**: Polymorphic `Media` model with UUID, multi-disk support (local/S3), `HasMedia` trait, and `MediaService` for uploads
- **ProcessMediaUpload Job**: Queue job for post-upload processing and metadata extraction
- **Category Model**: Self-referencing categories with `CategoryType` enum (sermon, post, media, book, academy)
- **Tag System**: Polymorphic `Tag` / `Taggable` models with `HasTags` trait and `findOrCreateByName` helper
- **Route Structure**: Split routes into `public.php`, `member.php`, `admin.php` for clean access separation
- **Public Layout**: `public-layout.tsx` with sticky header nav, mobile hamburger menu, and shared footer
- **Church Landing Page**: Rewrote `welcome.tsx` as feature-rich landing page with hero, feature cards, and CTA sections
- **Admin Sidebar**: Role-aware sidebar navigation with Browse and Admin sections based on user role
- **User Management**: Admin user listing with search/role filters and role editing (`/admin/users`)
- **Shared Components**: Reusable `Pagination` and `SearchFilter` components
- **User Factory States**: `admin()`, `staff()`, `leader()` factory states for testing
- **Media Factory States**: `audio()`, `video()`, `pdf()` factory states
- **Frontend Types**: Added `UserRole` type to TypeScript auth types
- **Test Suite**: 92 tests covering roles, middleware, gates, models, admin pages, and landing page
