# Wedding Planner App: Build Specification (v1)

Nov 17, 2026 · @what is a web socket?

This is the build specification for v1: three stages, ten modules plus a rooms table, the default catalogue, the data model, business rules and text wireframes. It is written to be exported as Markdown and used for spec-driven development.

## 1. Product summary

The app lets a wedding planner capture what a client wants, plan every function with vendors, quantities and budgets, and run each wedding day from a mobile checklist. It is a multi-tenant product: many planning companies, each with its own catalogue, vendors and events.

**Primary user.** One wedding planner per company in v1. The planner does everything inside the app.

**Other actors.** The client (couple or family) only fills a web form through a link; no login. Vendors have no access; they exist as records. One central admin team manages a shared inventory catalogue that every planning company can browse.

**Three stages:**

1. **Capture (Stage 1):** the planner creates an event and shares its unique link. The client ticks the services they want and adds notes.
2. **Plan (Stage 2):** the planner adds functions, then service lines with vendor, quantities and budget, and creates tasks.
3. **Execute (Stage 3):** on each function day, the planner works through a mobile checklist and gets a reminder for each task not yet done.

**Modules:**

| #   | Module                  | Stage | Platform                            |
| --- | ----------------------- | ----- | ----------------------------------- |
| 1   | Client requirement form | 1     | Mobile web, public link             |
| 2   | Service catalogue       | Setup | Web (desktop first)                 |
| 3   | Vendors                 | Setup | Web                                 |
| 4   | Events and functions    | 2     | Web                                 |
| 5   | Service plan            | 2     | Web                                 |
| 6   | Roll-ups and summary    | 2     | Web                                 |
| 7   | Tasks                   | 2     | Web and mobile                      |
| 8   | Day-of checklist        | 3     | Mobile app                          |
| 9   | Dashboard (proposed)    | All   | Web and mobile                      |
| 10  | Inventory               | Setup | Web (planner browse, admin console) |

**v1 scope:**

| Area      | In v1                                         | Out of v1                                                    |
| --------- | --------------------------------------------- | ------------------------------------------------------------ |
| Users     | One planner per company                       | Team roles, coordinators, permissions                        |
| Client    | Stage 1 form only, unique link, no login      | Client portal or event view                                  |
| Vendors   | Records managed by the planner                | Vendor login, portal, confirmations                          |
| Money     | Planner-entered budgets, rolled up in ₹       | Quotes, invoices, margins, payments                          |
| Tasks     | Manual tasks only                             | Auto-generated tasks, task templates                         |
| Alerts    | One push reminder per task, planner only      | Repeat reminders, WhatsApp or SMS                            |
| Portfolio | One link field per vendor                     | Galleries, uploads                                           |
| Rooms     | One editable rooms and guests table per event | Room board, arrivals view, mobile check-in, automatic checks |
| Inventory | Shared catalogue; enquire by call or WhatsApp | Tracked enquiries, date-based availability, add to event     |

## 2. Glossary and core rules

| Term              | Meaning                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| Company           | A wedding planning business; the tenant. All data belongs to one company.                                             |
| Planner           | The single user of a company in v1.                                                                                   |
| Event             | One wedding, for one client.                                                                                          |
| Function          | One occasion within an event (Mehendi, Sangeet, Muhurtham, Reception). Has its own date, time, venue and guest count. |
| Category          | A group of services (Food and Beverage, Decor). Used for grouping, browsing and budget envelopes.                     |
| Service           | A specific offering inside a category (Candid Photography, DJ / VDJ).                                                 |
| Parameter         | How a service is quantified: Pax, Hours, Minutes, Size or Work. Defined per category, overridable per service.        |
| Requested service | A service the client ticked on the Stage 1 form, with their note.                                                     |
| Service line      | One service booked for an event, with a default vendor, covering one or more functions.                               |
| Function row      | The part of a service line for one function: quantities, optional vendor override, optional budget.                   |
| Envelope          | An optional budget cap for a category within an event.                                                                |
| Shared            | A service line budget not split by function, covering more than one function.                                         |
| Task              | A dated to-do created by the planner, optionally linked to a function and a service line.                             |
| Day-of checklist  | All tasks dated on a function day, shown on the mobile app.                                                           |

**Core rules (apply everywhere):**

1. Every record carries a company id. No query may return another company's data.
2. A vendor is linked to services, never directly to categories. A vendor's categories are derived from its services.
3. A service is added to an event once, then covers one or more functions through function rows.
4. One vendor applies to all rows of a service line by default. A per-line toggle allows a different vendor per row.
5. Guest count lives on the function. Guest-type parameters pre-fill from it and stay editable.
6. Only money rolls up. Quantities are never summed across services.
7. Budgets are always typed by the planner. Vendor rates only suggest a figure.
8. Tasks are always created manually. A task's date decides whether it is a day-of or pre-event task.
9. Each task triggers at most one reminder in v1.

## 3. Navigation and screen map

The planner web app has four top-level sections; the mobile app focuses on today. The client form is a separate public page.

```text
PLANNER WEB APP
├── Dashboard
├── Events
│   ├── Event list (upcoming / past)
│   └── Event detail
│       ├── Overview (client, functions, form link, requested services)
│       ├── Plan · By category      ← main editing screen
│       │   └── Rooms and guests    ← opened from the Accommodation line
│       ├── Plan · By function
│       ├── Summary                 ← budget roll-up
│       └── Tasks (pre-event + day-of)
├── Vendors
│   ├── Directory (category sidebar + service filter)
│   └── Vendor profile
├── Inventory (browse shared stock, enquire)
└── Settings
    ├── Service catalogue (categories, services, parameters)
    ├── Function types
    └── Company profile (name, logo for client form)

PLANNER MOBILE APP
├── Today (day-of checklist, function switcher)
├── Upcoming tasks (pre-event)
└── Events (read-mostly, task add/edit)

CLIENT (public, no login)
└── /f/{form_token}  → requirement form → thank-you page

ADMIN CONSOLE (one central admin team)
├── Inventory items
└── Inventory categories
```

**Screen IDs** used in later sections:

| ID  | Screen                            | Module |
| --- | --------------------------------- | ------ |
| S1  | Client requirement form           | 1      |
| S2  | Catalogue settings                | 2      |
| S3  | Vendor directory                  | 3      |
| S4  | Vendor profile and edit           | 3      |
| S5  | Event list and create event       | 4      |
| S6  | Event overview and functions      | 4      |
| S7  | Plan by category                  | 5      |
| S8  | Add or edit service line (drawer) | 5      |
| S9  | Plan by function                  | 6      |
| S10 | Summary                           | 6      |
| S11 | Tasks list and add task           | 7      |
| S12 | Mobile Today checklist            | 8      |
| S13 | Dashboard                         | 9      |
| S14 | Rooms and guests table            | 4      |
| S15 | Inventory catalogue and enquire   | 10     |
| S16 | Inventory admin console           | 10     |

## 4. Quantity parameters

Each category has default parameters that its services inherit; a service can override them in Settings. A category can have more than one parameter (for example, Pax and Hours). All parameter fields are optional on a function row.

**Parameter types:**

| Key     | Label   | Input                                                          | Unit shown | Pre-fill                                                                 |
| ------- | ------- | -------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| pax     | Pax     | Whole number ≥ 0                                               | pax        | From the function's guest count, when the category's pre-fill flag is on |
| hours   | Hours   | Decimal ≥ 0, step 0.5                                          | hrs        | None                                                                     |
| minutes | Minutes | Whole number ≥ 0                                               | min        | None                                                                     |
| size    | Size    | One or more labelled measurements, each length × width in feet | ft × ft    | None                                                                     |
| work    | Work    | Free text describing the scope                                 | —          | None                                                                     |

**Default parameters by category:**

| Category                                    | Parameters               | Pax pre-fill from guests | Notes                                               |
| ------------------------------------------- | ------------------------ | ------------------------ | --------------------------------------------------- |
| Venue and Accommodation                     | Pax                      | On                       |                                                     |
| Food and Beverage                           | Pax                      | On                       |                                                     |
| Decor                                       | Size (Stage, Hall, Lawn) | —                        | Each row can hold up to three labelled measurements |
| Photography and Videography                 | Pax, Hours               | Off                      |                                                     |
| Beauty and Attire                           | Pax                      | Off                      | Pax means people styled, not guests                 |
| Hospitality, Logistics and Event Management | Pax, Hours               | On                       |                                                     |
| Entertainment                               | Hours                    | —                        |                                                     |
| Activities and DIY Stalls                   | Pax, Hours               | Off                      | Pax means participants                              |
| Technicals and Special Effects              | Minutes, Hours           | —                        | Effects in minutes, equipment in hours              |
| Legal and Compliance                        | Pax                      | Off                      |                                                     |
| Miscellaneous                               | Work                     | —                        | Scope described in text                             |

The pre-fill flags are proposed defaults; the planner can change them per category. For Decor, the three size labels (Stage, Hall, Lawn) are the defaults; the planner can rename or add labels.

## 5. Default catalogue (seed data)

Every new company is seeded with these 11 categories and 77 services; the planner can rename, hide, reorder or add. Services marked Hidden are planner-only and do not appear on the client form. Parameters follow section 4.

| Category                                    | Service                                        | Description                                                                           | Client form |
| ------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- | ----------- |
| Venue and Accommodation                     | Venue Booking                                  | Mandapams / Hotels and Resorts / Convention Hall / Outdoor Lawn / Beach House         | Shown       |
| Venue and Accommodation                     | Accommodation                                  | Hotels and Resorts / Service Apartments / Beach House / Guest House                   | Shown       |
| Venue and Accommodation                     | Green Room / Changing Room Setup               | Dedicated spaces for bride, groom and family                                          | Shown       |
| Venue and Accommodation                     | Tents / Tables / Chairs                        | Essential furniture and shading                                                       | Shown       |
| Venue and Accommodation                     | AC / Fans                                      | Climate control for the venue                                                         | Shown       |
| Food and Beverage                           | Catering (Veg / Non-Veg / Multi-Cuisine)       | Full menu planning and service                                                        | Shown       |
| Food and Beverage                           | Food Stalls and Live Counters                  | Interactive and themed live stations                                                  | Shown       |
| Food and Beverage                           | Bartending and Beverage Service                | Drinks and mocktail / cocktail service                                                | Shown       |
| Food and Beverage                           | Dessert / Fruit / Paan Counters                | Sweet endings and traditional digestives                                              | Shown       |
| Food and Beverage                           | Wedding / Event Cake                           | Custom thematic celebration cakes                                                     | Shown       |
| Food and Beverage                           | Food Tasting / Trials                          | Pre-event menu verification                                                           | Hidden      |
| Decor                                       | Stage Decor                                    | Grand backdrop and stage setup                                                        | Shown       |
| Decor                                       | Entrance Decor                                 | Welcoming floral / prop installations                                                 | Shown       |
| Decor                                       | Aisle / Pathway Decor                          | Decorated walkways to the stage                                                       | Shown       |
| Decor                                       | Side Wall / Atmosphere Decor / Photobooth      | General venue ambience and interactive sets                                           | Shown       |
| Decor                                       | Hanging / Roof Decor                           | Overhead installations, trusses and rigging                                           | Shown       |
| Decor                                       | Lighting                                       | Disco lights, chandeliers, fairy lights                                               | Shown       |
| Decor                                       | Table and Chair Setup, Linen / Centrepieces    | Detailed table settings and upholstery                                                | Shown       |
| Decor                                       | Garlands                                       | Traditional and designer floral garlands                                              | Shown       |
| Photography and Videography                 | Candid Photography                             | Natural, unposed moments                                                              | Shown       |
| Photography and Videography                 | Traditional Photography                        | Standard group and event coverage                                                     | Shown       |
| Photography and Videography                 | Cinematic Videography                          | Film-style edited highlights                                                          | Shown       |
| Photography and Videography                 | Traditional Videography                        | Full event documentary coverage                                                       | Shown       |
| Photography and Videography                 | Drone Coverage                                 | Aerial shots of the wedding location                                                  | Shown       |
| Photography and Videography                 | Live Streaming                                 | Real-time broadcast for remote guests                                                 | Shown       |
| Photography and Videography                 | Photo Booth                                    | 360, themed or digital setups                                                         | Shown       |
| Photography and Videography                 | Same-Day Highlight Reel                        | Video edited and shown on the same day                                                | Shown       |
| Photography and Videography                 | Albums / Calendar / Photoframe                 | Physical deliverables                                                                 | Shown       |
| Beauty and Attire                           | Bride / Groom Makeup Artists and Hair Stylists | Primary bridal / groom styling                                                        | Shown       |
| Beauty and Attire                           | Guest Makeup Artists and Hair Stylists         | Family and guest styling                                                              | Shown       |
| Beauty and Attire                           | Bride / Groom Saree and Veshti Drapist         | Traditional attire draping                                                            | Shown       |
| Beauty and Attire                           | Guest Saree and Veshti Drapist                 | Assistance for guests                                                                 | Shown       |
| Beauty and Attire                           | Bride Mehendi Artists                          | Detailed bridal henna                                                                 | Shown       |
| Beauty and Attire                           | Guest Mehendi Artists                          | Henna for attendees                                                                   | Shown       |
| Beauty and Attire                           | Outfit Designers / Stylists                    | Custom tailoring and styling coordination                                             | Shown       |
| Hospitality, Logistics and Event Management | Hospitality Desk                               | Primary arrival and info hub                                                          | Shown       |
| Hospitality, Logistics and Event Management | RSVP                                           | Attendance tracking                                                                   | Shown       |
| Hospitality, Logistics and Event Management | Hospitality / F&B Executives                   | On-ground guest management                                                            | Shown       |
| Hospitality, Logistics and Event Management | Logistics Executives                           | Guest arrival coordinators                                                            | Shown       |
| Hospitality, Logistics and Event Management | Event Coordinators / Shadows                   | Dedicated support for bride / groom                                                   | Shown       |
| Hospitality, Logistics and Event Management | Hostesses / Ushers                             | Seating and directional assistance                                                    | Shown       |
| Hospitality, Logistics and Event Management | Security / Bouncers                            | Venue safety and management                                                           | Shown       |
| Hospitality, Logistics and Event Management | Runner Boys                                    | On-call errands and utility                                                           | Shown       |
| Hospitality, Logistics and Event Management | Transportation (Car / Tempo / Bus)             | Guest transit                                                                         | Shown       |
| Hospitality, Logistics and Event Management | Valet / Drivers                                | Parking management                                                                    | Shown       |
| Hospitality, Logistics and Event Management | Cloak Room / Storage                           | Safe storage for guest belongings                                                     | Shown       |
| Entertainment                               | DJ / VDJ                                       | Musical entertainment and visual mixing                                               | Shown       |
| Entertainment                               | Live Band / Choir / Instrumental               | Live musical acts                                                                     | Shown       |
| Entertainment                               | Singers / Performers                           | Solo or group vocal acts                                                              | Shown       |
| Entertainment                               | Nadaswaram                                     | Traditional musical instruments                                                       | Shown       |
| Entertainment                               | Dhol / Chenda Melam                            | Percussion performance                                                                | Shown       |
| Entertainment                               | Emcee / Host / Anchor                          | Event host for flow and games                                                         | Shown       |
| Entertainment                               | Dance Troupe / Choreography                    | Performances and sangeet prep                                                         | Shown       |
| Entertainment                               | Celebrity / Influencer Appearance              | Special guest bookings                                                                | Shown       |
| Entertainment                               | Special Acts                                   | Magicians, fire artists, entry performance                                            | Shown       |
| Activities and DIY Stalls                   | Kids Sit-Down Art                              | Mosaic art, paint and plant, fluid art, canvas painting, tote bag painting            | Shown       |
| Activities and DIY Stalls                   | Kids Sit-Down Crafts                           | Stuffed toy making, woodworking, mosaic mirror, truck making, cap decorating          | Shown       |
| Activities and DIY Stalls                   | Kids DIY Station                               | Soap, candle, sunglasses decor, slime, sparkle pour, bracelet making                  | Shown       |
| Activities and DIY Stalls                   | Kids Creative Station                          | DIY dreamcatcher, drawstring bag, bag charms, headbands                               | Shown       |
| Activities and DIY Stalls                   | Kids Science Party                             | Elephant toothpaste, pop rockets, tie-dye, fizzy snowman, cipher codes, giant bubbles | Shown       |
| Activities and DIY Stalls                   | Adult Game Station                             | Sling hockey, block balance, rope shot, barrel toss, air stabiliser, casino games     | Shown       |
| Activities and DIY Stalls                   | Adult DIY Station (Potli / Perfume)            | Candle bar, bracelet / necklace making, potli making, perfume bar                     | Shown       |
| Activities and DIY Stalls                   | Art and Experiences                            | Caricature, tarot reading, live wedding painter, memory canvas, fingerprint tree      | Shown       |
| Technicals and Special Effects              | Audio System / Tech Riders                     | Sound distribution and tech requirements                                              | Shown       |
| Technicals and Special Effects              | LED Wall / Projectors                          | Visual displays for the venue                                                         | Shown       |
| Technicals and Special Effects              | Generators                                     | Power backup                                                                          | Hidden      |
| Technicals and Special Effects              | Cold Pyros / Confetti / CO2 Guns               | Stage special effects                                                                 | Shown       |
| Technicals and Special Effects              | Fog / Bubble Machines                          | Atmospheric effects                                                                   | Shown       |
| Legal and Compliance                        | Music License (Novex / PPL / RMPL)             | Rights for playing recorded music                                                     | Hidden      |
| Legal and Compliance                        | Performance License (IPRS / ISRA)              | Rights for live performances                                                          | Hidden      |
| Legal and Compliance                        | Marriage Registration Lawyer                   | Legal paperwork assistance                                                            | Shown       |
| Legal and Compliance                        | Police NOC                                     | Official clearances                                                                   | Hidden      |
| Miscellaneous                               | Website                                        | Digital presence for the wedding                                                      | Shown       |
| Miscellaneous                               | Social Media Team                              | Content curation and real-time updates                                                | Shown       |
| Miscellaneous                               | Invites / Monogram                             | Digital and physical design                                                           | Shown       |
| Miscellaneous                               | Trousseau Packing / Return Gifts               | Gift management and welcome hampers                                                   | Shown       |
| Miscellaneous                               | Resin Art Work and Preserves                   | Floral preservation and keepsakes                                                     | Shown       |

**Default function types** (editable in Settings): Engagement / Nichayathartham, Mehendi, Haldi, Sangeet, Nalangu, Janavasam, Muhurtham / Wedding, Reception, Cocktail, Other (custom name).

## 6. Data model

The model below is technology-neutral. All ids are UUIDs, money is stored as whole rupees (integer), timestamps in UTC, and dates and times displayed in the company's time zone (default Asia/Kolkata). Every table except `company` has `company_id`, `created_at`, `updated_at`; soft delete via `archived_at` where noted.

```text
company            id, name, logo_url?, timezone (default Asia/Kolkata), created_at
user               id, company_id, name, email, phone, role ('planner'), push_tokens[]

parameter_def      key ('pax'|'hours'|'minutes'|'size'|'work'), label, input_type, unit_label   -- system table

category           id, company_id, name, sort_order, parameters[] (parameter keys),
                   pax_prefill (bool), size_labels[] (e.g. ['Stage','Hall','Lawn']), archived_at?
service            id, company_id, category_id, name, description?, show_on_client_form (bool),
                   parameters_override[]? (null = inherit category), sort_order, archived_at?

function_type      id, company_id, name, sort_order, archived_at?

vendor             id, company_id, name, contact_person, phone, alt_phone?, city, address,
                   portfolio_url?, notes?, archived_at?
vendor_contact     id, vendor_id, name, role, phone
vendor_service     vendor_id, service_id, rate_amount? (₹), rate_parameter? (parameter key), rate_note?
                   PK (vendor_id, service_id)

event              id, company_id, name, client_name, client_phone, client_email?,
                   overall_budget? (₹), status ('created'|'requested'|'planning'|'completed'|'cancelled'),
                   form_token (unique, random, ≥ 128-bit), form_locked (bool), form_submitted_at?
event_function     id, event_id, function_type_id, custom_name?, date, start_time, end_time?,
                   venue_name?, venue_address?, guest_count (int ≥ 0), sort_order
requested_service  id, event_id, service_id, client_note?    UNIQUE (event_id, service_id)

service_line       id, event_id, service_id, default_vendor_id?, per_function_vendor (bool, default false),
                   line_budget? (₹), notes?
function_row       id, service_line_id, event_function_id, vendor_id? (override; used only if per_function_vendor),
                   quantities (JSON: {pax?, hours?, minutes?, size?: [{label, length_ft, width_ft}], work?}),
                   pax_edited (bool), budget? (₹)
                   UNIQUE (service_line_id, event_function_id)
category_envelope  event_id, category_id, amount (₹)       PK (event_id, category_id)

task               id, event_id, event_function_id?, service_line_id?, title, due_date, due_time?,
                   remind_before_min (default 15), status ('pending'|'done'|'issue'), issue_note?,
                   completed_at?, reminder_sent_at?

event_hotel        id, event_id, name, area?, contact?          -- typed per event, not a vendor or service
room_guest_row     id, event_id, sort_order, g_id?, sr_no?, cluster?, group_id?, name, contact?,
                   event_hotel_id?, room_no?, status? ('Expected'|'Checked in'|'C/O'|'No-show'|'Cancelled'),
                   pax?, rc?, hamper?, check_in_date?, arrival_time? (free text), departure_date?

-- Platform-wide (no company_id): readable by all planners, writable only by admins
admin_user         id, name, email, phone
inventory_category id, name, sort_order, archived_at?
inventory_item     id, category_id, name, description?, specs?, unit ('piece'|'set'|'sq_ft'|'running_ft'),
                   photos[] (≤ 5), indicative_rate? (₹), visible (bool), sort_order
admin_contact      id, label, phone, whatsapp_number      -- used by Enquire
```

**Relationships:**

- Category 1 → n Service; Service n ↔ n Vendor through vendor\_service.
- Event 1 → n Event function, Requested service, Service line, Category envelope, Task.
- Service line 1 → n Function row (one per covered function); Service line n → 1 Service.
- Task n → 0..1 Event function and 0..1 Service line.

**Derived values (never stored):**

- A vendor's categories = distinct categories of its services.
- A service's effective parameters = parameters\_override or its category's parameters.
- A requested service is Planned when the event has a service line for the same service.
- A function row's effective vendor = vendor\_id if per\_function\_vendor is on and set, else the line's default\_vendor\_id.
- Budget roll-ups (section 12).

**Deletion rules:** a service, vendor or function type in use by an event is archived, not deleted. Deleting a function deletes its function rows and unlinks its tasks (the planner is warned first).

## 7. Module 1: Client requirement form (S1)

The client opens a unique link, ticks the services they want, adds optional notes and submits. The response attaches to the event that generated the link.

**Flow:**

1. Planner creates the event (S5) with client name and phone; the system generates `form_token`.
2. Planner copies the link `/f/{form_token}` or taps Share (WhatsApp share sheet on mobile).
3. Client opens the link; no login. Page shows the company's name and logo.
4. Client ticks services, adds notes, taps **Send to planner**.
5. System saves requested services, sets `form_submitted_at`, moves event status to Requested, and notifies the planner (push).
6. Thank-you page confirms submission.

**Content rules:**

- Sections = active categories in catalogue order; items = active services with `show_on_client_form` = true.
- A category with no visible services is not shown.
- Each service shows name and description; ticking it reveals a note field (max 500 characters).
- A selected-count appears per category header.
- No quantities, functions, dates or budgets are asked.

**Resubmission:** until the planner locks the form, the client can reopen the link, see their previous answers and resubmit; the latest submission replaces the earlier one. Once locked, the link shows a read-only summary. (Proposed default.)

**Wireframe (mobile):**

```text
┌──────────────────────────────────┐
│ [Logo] Company name              │
│ Plan your wedding                │
│ Tick what you'd like us to       │
│ arrange. Add a note if needed.   │
├──────────────────────────────────┤
│ FOOD AND BEVERAGE   1 selected ▾ │
│ ┌──────────────────────────────┐ │
│ │ [✓] Catering                 │ │
│ │     Full menu planning       │ │
│ │     [Mostly veg, 1 non-veg ] │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ [ ] Live counters            │ │
│ │     Interactive stations     │ │
│ └──────────────────────────────┘ │
│ ENTERTAINMENT       0 selected ▸ │
│ DECOR               0 selected ▸ │
│ ...                              │
├──────────────────────────────────┤
│ [      Send to planner       ]   │
└──────────────────────────────────┘
```

**Design ideas:** collapsible category sections; sticky bottom button with total selected; large tap targets; optional category images; a short privacy notice above the button.

**In the planner app (S6):** a **Requested by client** panel lists each requested service with its note and a Planned / Not planned badge. Tapping Not planned opens S8 pre-filled with that service.

**Acceptance criteria:**

- [ ] Link works without login on mobile browsers and is unguessable.
- [ ] Hidden services never appear on the form.
- [ ] Submission creates one requested\_service per ticked service, with notes.
- [ ] Resubmission replaces previous answers; locked form is read-only.
- [ ] Planner receives a push notification on submission.
- [ ] Requested services show Planned once a matching service line exists.

## 8. Module 2: Service catalogue (S2)

The planner maintains categories, services and their parameters in Settings; every other module reads from here. A new company starts with the seed data in section 5.

**Category fields:** name, order, parameters (multi-select from section 4), pax pre-fill flag, size labels (Decor-style categories only), archived.

**Service fields:** name, description, show on client form (toggle), parameter override (default: inherit), order, archived.

**Actions:** add, rename, reorder (drag), archive and restore categories and services; move a service to another category; reset catalogue to template (only when no events exist).

**Wireframe (web):**

```text
┌──────────────────┬───────────────────────────────────────────────────────┐
│ CATEGORIES       │ Photography and Videography          [+ Add service] │
│ Venue & Accom. 5 │ Parameters: [Pax ✓] [Hours ✓]   Pax pre-fill: [off]  │
│ Food & Bev.    6 ├───────────────────────────────┬────────────┬──────────┤
│ Decor          8 │ Service                       │ Parameters │ Client   │
│▶Photo & Video  9 ├───────────────────────────────┼────────────┼──────────┤
│ Beauty & Att.  7 │ ⠿ Candid Photography          │ Inherit    │ Shown    │
│ Hospitality   11 │ ⠿ Traditional Photography     │ Inherit    │ Shown    │
│ Entertainment  9 │ ⠿ Drone Coverage              │ Hours only │ Shown    │
│ Activities     8 │ ⠿ Albums / Calendar / Frame   │ Work       │ Shown    │
│ Tech & SFX     5 │ ⠿ Same-Day Highlight Reel     │ Inherit    │ Shown    │
│ Legal          4 │                                                       │
│ Misc           5 │                                                       │
│ [+ Add category] │                                                       │
└──────────────────┴───────────────────────────────────────────────────────┘
```

**Rules:**

- Changing a category's parameters affects new function rows only; existing quantities are kept.
- Archiving a service hides it from the client form and the add-service picker; existing service lines keep it.
- Service names must be unique within a category.

**Acceptance criteria:**

- [ ] New company is seeded with 11 categories and 77 services.
- [ ] Planner can add, rename, reorder and archive categories and services.
- [ ] Parameter override on a service takes precedence over the category's parameters.
- [ ] Client form visibility toggle is reflected immediately on open forms.

## 9. Module 3: Vendors (S3, S4)

Vendors are records the planner keeps, linked to the exact services they offer. A category is only a browsing folder, so "all singers" means every vendor offering Singers / Performers.

**Vendor profile, four parts:**

1. **Basic information (required: name, phone):** vendor name, point of contact, phone, alternate phone, city, full address, portfolio link.
2. **Team contacts:** name, role, phone, any number. Used for one-tap calls on the day-of checklist.
3. **Services offered (at least one required):** pick services from any category. Each can carry an optional rate: amount in ₹, the parameter it is per (per pax, per hour, per minute, per size, or package), and a note such as "min 3 hrs".
4. **Planner notes:** private free text (reliability, special needs).

**Directory (S3):** category list on the left with vendor counts; service filter chips on top with counts; search by name, city or phone; list rows show name, contact, city and service tags. A vendor appears under every category its services belong to.

**Wireframe, directory (web):**

```text
┌──────────────────┬──────────────────────────────────────────────────────┐
│ CATEGORIES       │ Entertainment vendors        [Search…] [+ Add vendor]│
│ Food & Bev.    9 │ [All 12] [DJ 4] [Singers 6✓] [Emcee 3] [Nadaswaram 2]│
│ Decor          7 ├──────────────────────────────────────────────────────┤
│▶Entertainment 12 │ Vendor H   Agency · Chennai   [DJ][Singers][Emcee]   │
│ Photo & Video  8 │ Vendor K   Solo singer · Chennai        [Singers]    │
│ Beauty        10 │ Vendor L   Playback trio · Madurai      [Singers]    │
│ Tech & SFX     4 │ Vendor P   Wedding band   [Singers][Nadaswaram]      │
└──────────────────┴──────────────────────────────────────────────────────┘
```

**Wireframe, profile (web):**

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Vendor H                                                      [Edit]  │
│ Entertainment · Chennai · used in 6 events                            │
├── Basic information ───────────────────────────────────────────────────┤
│ Contact: Owner name     Phone: +91 9xxxx xxxxx    City: Chennai        │
│ Address: Street, area   Portfolio: instagram.com/…                     │
├── Team ────────────────────────────────────────────────────────────────┤
│ Lead DJ · +91 9xxxx xxxxx        Sound engineer · +91 9xxxx xxxxx      │
├── Services and rates (rates optional) ─────────────────────────────────┤
│ DJ / VDJ              ₹8,000 per hour     Min 3 hrs                    │
│ Singers / Performers  + add rate                                       │
│ Emcee / Host          ₹25,000 package     Per function                 │
├── Planner notes ───────────────────────────────────────────────────────┤
│ Reliable, brings own sound. Confirm generator for outdoor venues.      │
├── Events ──────────────────────────────────────────────────────────────┤
│ Priya & Arjun · Feb 2027 · DJ (Sangeet, Reception)                     │
└────────────────────────────────────────────────────────────────────────┘
```

**Rate suggestion:** on S8, when the selected vendor has a rate for the service, show "Rate suggests ₹X" next to the budget field, where X = rate × quantity (or the package amount). One tap copies it into the budget; it never overwrites a typed budget.

**Design ideas:** click-to-call and WhatsApp buttons on phone numbers; duplicate-phone warning when adding a vendor; "used in N events" as a quick trust signal.

**Acceptance criteria:**

- [ ] Vendor can offer services across multiple categories and appears under each.
- [ ] Service filter shows only vendors offering that service.
- [ ] Rates are optional; a vendor with no rates is fully usable.
- [ ] Rate suggestion appears only when a rate exists and never auto-fills.
- [ ] Vendors used in events can be archived, not deleted.

## 10. Module 4: Events and functions (S5, S6)

An event is one wedding; its functions hold the details that change day to day. Creating an event needs only the client's name and phone, so the form link can go out immediately.

**Create event (S5), minimal:** event name (default "{client name} wedding"), client name, client phone, client email (optional). On save, the form link is ready to copy or share.

**Event overview (S6):**

- Client details and overall budget (optional, ₹).
- Form link with Copy, Share and Lock form actions, plus submission status.
- Functions table with add, edit, reorder and delete.
- Requested by client panel (Module 1).
- Quick counts: services planned, open tasks, planned ₹ vs overall budget.

**Function fields:** function type (from Settings, or Other with a custom name), date, start time, end time (optional), venue name, venue address, guest count. Several functions may share a date.

**Event status:**

| Status    | Set when                                                            |
| --------- | ------------------------------------------------------------------- |
| Created   | Event saved; form not yet submitted                                 |
| Requested | Client submitted the form                                           |
| Planning  | First function or service line added (also allowed before the form) |
| Completed | Planner marks it, or automatically the day after the last function  |
| Cancelled | Planner marks it; tasks and reminders stop                          |

**Wireframe, event overview (web):**

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Priya & Arjun wedding                 Status: Planning     [⋯ More]   │
│ Client: Priya · +91 9xxxx xxxxx        Budget: ₹25,00,000              │
│ [Overview] [Plan · By category] [By function] [Summary] [Tasks]       │
├── Form link ───────────────────────────────────────────────────────────┤
│ …/f/k3J9…   [Copy] [Share]  Submitted 2 Feb, 6:10 PM   [Lock form]     │
├── Functions ─────────────────────────────────────────── [+ Add function]┤
│ Mehendi     12 Feb  11:00–15:00  Venue hall   150 pax       [Edit]    │
│ Sangeet     12 Feb  18:30–23:00  Venue hall   400 pax       [Edit]    │
│ Muhurtham   13 Feb  06:00–10:00  Venue hall   800 pax       [Edit]    │
│ Reception   14 Feb  18:30–22:30  Venue hall 1,200 pax       [Edit]    │
├── Requested by client (14) ────────────────────────────────────────────┤
│ Catering · "Mostly veg, one non-veg dinner"          ● Planned        │
│ Nadaswaram                                          ○ Not planned [+] │
└────────────────────────────────────────────────────────────────────────┘
```

**Rules:**

- Changing a function's guest count updates pax on rows where `pax_edited` is false and the category's pax pre-fill is on; edited rows keep their value.
- Changing a function's date moves its function-linked tasks to the new date (planner is told how many moved).
- Deleting a function warns with counts of affected function rows and tasks.

**Acceptance criteria:**

- [ ] Event can be created with name and phone only; link generated at once.
- [ ] Functions support all listed fields; multiple functions per date allowed.
- [ ] Guest count change propagates only to unedited pax rows.
- [ ] Status moves as per the table.

### Rooms and guests (S14)

The planner manages the guest and room list inside the platform instead of a separate Excel sheet. It is a simple, spreadsheet-style table per event; nothing about it lives in the catalogue.

**Entry point:** on the Plan screen (S7), the Accommodation service line shows a **Manage rooms and guests** button that opens S14 for that event. The button appears whenever the event has an Accommodation line.

**Hotels:** typed per event in a small list at the top of S14 (name, area, front-desk contact). Hotels are not services or vendors, because they change with every event. Each guest row picks its hotel from this list.

**Columns (the planner's current sheet, kept as is, plus Hotel):**

| Column         | Type     | Notes                                         |
| -------------- | -------- | --------------------------------------------- |
| G ID           | Text     | Guest ID, e.g. G01                            |
| Sr No          | Text     |                                               |
| Cluster        | Text     | Meaning set by the planner                    |
| ID             | Text     | Meaning set by the planner (e.g. AC)          |
| Name           | Text     | Required                                      |
| Contact        | Text     | Phone                                         |
| Hotel          | Dropdown | From this event's hotel list                  |
| Room No        | Text     | Several rows can share a room                 |
| Status         | Dropdown | Expected, Checked in, C/O, No-show, Cancelled |
| PAX            | Number   |                                               |
| RC             | Number   |                                               |
| Hamper         | Number   |                                               |
| Check-in date  | Date     |                                               |
| Arrival time   | Text     | Free text, e.g. "8th midnight"                |
| Departure date | Date     |                                               |

**Behaviour:**

- Inline editing of every cell; add and delete rows.
- Paste a block of rows copied from Excel or Google Sheets; columns map in order.
- Sort and filter by any column; quick filters for hotel and status.
- Import and export XLSX (export doubles as the rooming list sent to hotels).
- Saves automatically; no formulas inside the table.

**Wireframe (web):**

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Plan / Accommodation / Rooms and guests                                │
│ 5 guest rows        [Import XLSX] [Export XLSX] [+ Add row]            │
├── Hotels for this event: [Hotel A · ECR] [Hotel B · Guindy] [+ Add] ───┤
│ [Filter…] [All hotels ▾] [All statuses ▾]                              │
├─────┬────┬───────┬────┬──────────┬─────────┬───────┬─────┬──────┬───┬──┤
│G ID │Sr  │Cluster│ID  │Name      │Contact  │Hotel  │Room │Status│PAX│… │
├─────┼────┼───────┼────┼──────────┼─────────┼───────┼─────┼──────┼───┼──┤
│G01  │1   │C      │AC  │[Guest]   │98xxx…   │Hotel A│206  │C/O   │2  │… │
│G02  │1   │       │    │[Guest]   │98xxx…   │Hotel A│206  │      │   │… │
│G03  │2   │B      │    │[Guest]   │98xxx…   │Hotel A│208  │In    │3  │… │
└─────┴────┴───────┴────┴──────────┴─────────┴───────┴─────┴──────┴───┴──┘
```

**Not in v1:** room board, arrivals and departures view, mobile check-in, configurable columns, and automatic checks (unassigned guests, over-capacity rooms).

**Acceptance criteria:**

- [ ] Button on the Accommodation line opens the event's table.
- [ ] Hotels are added per event and offered in the Hotel column.
- [ ] Rows can be added, edited, deleted, sorted and filtered.
- [ ] Pasting rows from Excel creates rows in column order.
- [ ] XLSX import and export round-trip without losing data.

## 11. Module 5: Service plan (S7, S8)

The planner adds each service once, ticks the functions it covers, picks one vendor, and adjusts per function only where needed. This is the main working screen of the app.

**Add or edit service line (S8, a side drawer):**

1. **Category and service.** Searchable picker; the service's parameters show as chips. A service already on the event opens that line instead of creating a duplicate.
2. **Vendor.** Dropdown of vendors offering this service, with "+ New vendor" inline.
3. **Functions.** Chips for every function on the event; tick one or more.
4. **Different vendor per function.** Toggle, off by default. When on, each function row gets a vendor dropdown pre-set to the top vendor.
5. **Quantities.** A row per ticked function with one input per parameter. A **Same for all** row at the top copies its values to every row. Pax pre-fills from guest count when the category's flag is on.
6. **Budget.** Either one line budget, or a budget per function row (see rules). Rate suggestion shown when available.
7. **Tasks.** Optional "+ Add task" (Module 7), pre-filled with this line's vendor and functions.
8. **Notes.** Free text for the line.

**Inputs by parameter:**

| Parameter | Row input                              | Example                      |
| --------- | -------------------------------------- | ---------------------------- |
| Pax       | Number, pre-filled or blank            | 400                          |
| Hours     | Number, step 0.5                       | 5                            |
| Minutes   | Number                                 | 10                           |
| Size      | One length × width pair per size label | Stage 40 × 20, Hall 120 × 80 |
| Work      | Short text                             | Website with RSVP page       |

**Budget rules:**

- A line has either a line budget or row budgets, not both. Entering a row budget disables the line field and makes line total = sum of row budgets.
- A line budget on a line covering one function counts for that function. On a line covering several functions it is **Shared**.
- Category envelopes are set from the category header on S7.

**Wireframe, plan by category (S7):**

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Priya & Arjun · Plan by category      Planned ₹23,30,000 of ₹25,00,000│
│ Mehendi 150 · Sangeet 400 · Muhurtham 800 · Reception 1,200            │
│                                                     [+ Add service]    │
├── CATERING ── Envelope ₹12,00,000 · Planned ₹11,10,000 · ₹90,000 left ─┤
│ ▾ Catering (Veg) · Vendor D                              ₹11,10,000   │
│     Function     Vendor          Pax              Budget               │
│     Mehendi      Vendor D        150 (guests)     ₹75,000              │
│     Sangeet      Vendor D        400 (guests)     ₹2,00,000            │
│     Muhurtham    Vendor E [chg]  750 [edited]     ₹3,35,000            │
│     Reception    Vendor D      1,000 [edited]     ₹5,00,000            │
├── PHOTOGRAPHY ── Envelope ₹3,00,000 · Planned ₹2,40,000 · ₹60,000 left ┤
│ ▸ Candid Photography · Vendor A   Sangeet, Muhurtham, Reception        │
│   Package · Shared                                        ₹1,80,000   │
│ ▸ Drone Coverage · Vendor A   Muhurtham · 3 hrs              ₹60,000   │
├── DECOR ── Envelope ₹7,00,000 · Planned ₹7,50,000 · ₹50,000 over ⚠ ────┤
│ ▸ Stage Decor · Vendor F   4 functions                    ₹7,50,000   │
└────────────────────────────────────────────────────────────────────────┘
```

**Wireframe, add service drawer (S8):**

```text
┌──────────────────────────────────────────────┐
│ Add service                              [×] │
│ Category  [Entertainment ▾]                  │
│ Service   [DJ / VDJ ▾]        Params: Hours  │
│ Vendor    [Vendor H ▾]                       │
│ Functions [ Mehendi ] [✓Sangeet] [ Muhurtham]│
│           [✓Reception]                       │
│ ( ) Different vendor per function            │
│ ┌─────────────┬──────────┬────────────────┐  │
│ │ Same for all│ [4] hrs  │ [Apply]        │  │
│ ├─────────────┼──────────┼────────────────┤  │
│ │ Sangeet     │ [5] hrs  │ ₹ [40,000]     │  │
│ │ Reception   │ [4] hrs  │ ₹ [35,000]     │  │
│ └─────────────┴──────────┴────────────────┘  │
│ Rate suggests ₹72,000 (9 hrs × ₹8,000) [Use] │
│ Total ₹75,000                                │
│ [+ Add task]                                 │
│                       [Cancel] [Save service]│
└──────────────────────────────────────────────┘
```

**Design ideas:** keyboard-friendly row entry; "edited" and "changed" tags in amber; collapsed lines show a one-line summary; adding a requested service from S6 opens S8 pre-filled.

**Acceptance criteria:**

- [ ] A service is added once and covers any subset of functions.
- [ ] Vendor dropdown lists only vendors offering the service.
- [ ] Per-function vendor toggle is off by default and reveals a vendor column when on.
- [ ] Inputs match the service's effective parameters; pax pre-fills per category flag.
- [ ] Same for all copies values to every row without overwriting later edits.
- [ ] Line budget and row budgets are mutually exclusive; totals update live.
- [ ] Edited pax and changed vendors are visibly tagged.

## 12. Module 6: Roll-ups and summary (S9, S10)

The same service-plan data is shown by function and as an event summary. Only money rolls up; quantities stay on their rows.

**Calculation rules:**

| Value                       | Formula                                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Row budget                  | function\_row.budget, or 0                                                                                                       |
| Line total                  | Sum of row budgets if any row has a budget; else line\_budget; else 0                                                            |
| Line attribution            | Row budgets → their functions. Line budget on a one-function line → that function. Line budget on a multi-function line → Shared |
| Function total              | Sum of amounts attributed to that function                                                                                       |
| Shared total                | Sum of amounts attributed to Shared                                                                                              |
| Category planned (event)    | Sum of line totals for services in the category                                                                                  |
| Category planned (function) | Sum of that category's amounts attributed to the function                                                                        |
| Category left               | Envelope − category planned; negative = over, flagged red                                                                        |
| Event planned               | Sum of all line totals = sum of function totals + Shared total                                                                   |
| Event left                  | overall\_budget − event planned                                                                                                  |

**By function (S9):** a function switcher at the top; for the chosen function, categories with each service, effective vendor, quantities and budget. Shared lines covering this function appear in a separate **Shared across event** group, without an amount split. A Tasks panel shows that function's tasks.

**Summary (S10):** headline cards (event budget, planned, left, categories over envelope), then the category × function grid with Shared, Total and Envelope columns and a Total row. Clicking a function header opens S9; clicking a category row opens S7 scrolled to it.

**Wireframe, summary (web), amounts in ₹ thousands:**

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [Budget ₹25,00,000]  [Planned ₹23,30,000]  [Left ₹1,70,000] [1 over ⚠] │
├──────────────┬────────┬────────┬─────────┬─────────┬──────┬─────┬──────┤
│ Category     │Mehendi │Sangeet │Muhurtham│Reception│Shared│Total│Envel.│
├──────────────┼────────┼────────┼─────────┼─────────┼──────┼─────┼──────┤
│ Catering     │     75 │    200 │     335 │     500 │    — │1,110│1,200 │
│ Decor        │     50 │    150 │     250 │     300 │    — │ 750⚠│  700 │
│ Photography  │      — │      — │      60 │       — │  180 │  240│  300 │
│ Entertainment│      — │     40 │       — │      35 │    — │   75│  100 │
│ Makeup       │      — │     25 │      40 │      30 │    — │   95│    — │
│ Transport    │      — │      — │       — │       — │   60 │   60│    — │
├──────────────┼────────┼────────┼─────────┼─────────┼──────┼─────┼──────┤
│ Total        │    125 │    415 │     685 │     865 │  240 │2,330│2,500 │
└──────────────┴────────┴────────┴─────────┴─────────┴──────┴─────┴──────┘
```

**Wireframe, by function (web):**

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [Mehendi] [Sangeet] [Muhurtham] [●Reception]   14 Feb · 1,200 pax      │
│ Reception total ₹8,65,000                                              │
├── Catering ₹5,00,000 ──────────────────────────────────────────────────┤
│ Catering (Veg) · Vendor D · 1,000 pax                    ₹5,00,000    │
├── Decor ₹3,00,000 ─────────────────────────────────────────────────────┤
│ Stage Decor · Vendor F · Stage 40×20 ft                  ₹3,00,000    │
├── Shared across event ─────────────────────────────────────────────────┤
│ Candid Photography · Vendor A · package                  (shared)     │
└────────────────────────────────────────────────────────────────────────┘
```

**Design ideas:** on smaller screens, show the summary as category cards with progress bars and a function switcher instead of the grid (this is the open UI decision in section 19).

**Acceptance criteria:**

- [ ] All totals follow the formulas above and reconcile: sum of function totals + Shared = event planned.
- [ ] Shared lines never split automatically.
- [ ] Over-envelope categories are flagged on S7 and S10.
- [ ] Grid cells, headers and rows link to the right screens.

## 13. Module 7: Tasks (S11)

All tasks are created manually by the planner. A task's date decides where it shows: on a function day it is part of that day's checklist; on any other date it is a pre-event task.

**Task fields:**

| Field         | Required | Behaviour                                                |
| ------------- | -------- | -------------------------------------------------------- |
| Title         | Yes      | Max 120 characters                                       |
| Function      | No       | Picking one sets the date to that function's date        |
| Date          | Yes      | Typed when no function is picked                         |
| Time          | No       | Without a time, the reminder fires at 09:00 on that date |
| Service line  | No       | Shows the vendor and enables one-tap call                |
| Remind before | No       | Minutes before due time; default 15                      |
| Status        | —        | Pending, Done or Issue (with a note)                     |

**Where tasks are created:**

1. **From a service line (S8):** "+ Add task" pre-fills the line and its functions. With several functions ticked, **One task per function** creates one task each, dated per function, same time.
2. **From a function (S9) or the Tasks tab (S11):** for tasks without a vendor.
3. **From the mobile app:** quick add on Today or Upcoming.

**Classification (derived):**

- **Day-of:** due\_date equals the date of any function in the event.
- **Pre-event:** any other date before the last function.
- Grouping inside a day: by function if linked, else General.

**Tasks tab (S11):** two lists, Pre-event (by date) and Day-of (by function, then time), with filters for status, function and vendor.

**Wireframe, task list (web):**

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Tasks                [Status ▾] [Function ▾] [Vendor ▾]   [+ Add task] │
├── PRE-EVENT ───────────────────────────────────────────────────────────┤
│ ○ 1 Feb 11:00   Confirm playlist with couple   DJ · Vendor H           │
│ ○ 3 Feb         Food tasting                   Catering · Vendor D     │
│ ● 5 Feb         Pay advance                    DJ · Vendor H     Done  │
├── DAY-OF · Sangeet · 12 Feb ───────────────────────────────────────────┤
│ ○ 16:00         DJ team arrives                DJ · Vendor H           │
│ ○ 17:00         Sound check                    DJ · Vendor H           │
├── DAY-OF · Reception · 14 Feb ─────────────────────────────────────────┤
│ ○ 16:30         Stage decor complete           Decor · Vendor F        │
│ ○ 18:00         Wheelchair at entrance         General                 │
└────────────────────────────────────────────────────────────────────────┘
```

**Acceptance criteria:**

- [ ] No task is ever created without the planner's action.
- [ ] Picking a function sets the task date; one-task-per-function creates correctly dated tasks.
- [ ] Day-of vs pre-event is derived from the date, never chosen.
- [ ] Tasks can be added from S8, S9, S11 and the mobile app.

## 14. Module 8: Day-of mobile app (S12)

On a function day, the planner runs the day from the phone: tasks in time order, one-tap Done, one-tap call to the vendor, and one reminder for each task still pending.

**Today screen:**

- Function switcher when several functions fall on today; defaults to the next or current one.
- Header: function name, date, start time, venue, progress bar (done / total).
- Groups in order: **Overdue**, **Next up** (due within 60 minutes), **Later**, **Anytime today** (no time set), **Done**.
- Each task card: title, vendor and service, due time, actions **Call** (vendor contacts list), **Issue** (note), **Done**.
- Undo for 5 seconds after Done.

**Reminder (one per task):**

- Fires at due time minus remind\_before (or 09:00 for date-only tasks).
- Sent only if the task is still Pending at that moment; never repeated in v1.
- Push notification text: "{task} · {function} · {vendor} · due {time}". Tapping opens the task.
- An Issue status pins the task to the top until marked Done.

**Offline:**

- The app caches all tasks and contacts for the next 48 hours on open and on every sync.
- Status changes work offline and sync later; last write wins with the device timestamp.
- Reminders are scheduled as local notifications on the device, so they fire without network. Server push is a backup for tasks created on the web after the last sync.

**Time shift:** if a function starts late, "Shift tasks" moves all pending timed tasks of that function by a chosen number of minutes and reschedules their reminders.

**Wireframe (mobile):**

```text
┌──────────────────────────────────┐
│ 🔔 Overdue: Stage decor complete │
│    Reception · Vendor F · 16:30  │
├──────────────────────────────────┤
│ Reception                        │
│ Sat 14 Feb · 18:30 · Venue hall  │
│ [Muhurtham] [●Reception]         │
│ Progress 12 / 20 ███████░░░░     │
│ [Shift tasks]                    │
├── OVERDUE ───────────────────────┤
│ Stage decor complete             │
│ Vendor F · due 16:30             │
│ [Call] [Issue] [✓ Done]          │
├── NEXT UP ───────────────────────┤
│ DJ sound check                   │
│ Vendor H · 17:30                 │
│ [Call] [Issue] [✓ Done]          │
│ Catering counters set            │
│ Vendor D · 18:00                 │
│ [Call] [Issue] [✓ Done]          │
├── DONE ──────────────────────────┤
│ ✓ Photo team arrived · 16:30     │
├──────────────────────────────────┤
│ [Today]  [Upcoming]  [Events]    │
└──────────────────────────────────┘
```

**Upcoming tab:** pre-event tasks for the next 14 days across all events, grouped by date, with the same actions.

**Design ideas:** large tap targets for use while walking; high-contrast mode for outdoor light; haptic feedback on Done; red badge on the app icon for overdue count.

**Acceptance criteria:**

- [ ] Today shows only tasks dated today, grouped and ordered as specified.
- [ ] Exactly one reminder per pending task, at the right time, including offline.
- [ ] Done, Issue and Undo work offline and sync without duplicates.
- [ ] Call shows the vendor's contacts and dials on tap.
- [ ] Shift tasks moves times and reminders for that function only.

## 15. Module 9: Dashboard (S13, proposed)

The dashboard answers "what needs me now?" across all events. It was not detailed in the flow discussion; this is a proposed minimal version to confirm.

**Widgets, in order:**

1. **Today:** functions happening today with progress, and overdue task count. Tapping opens S12 or S9.
2. **Overdue and due this week:** tasks across events, sorted by due date and time.
3. **New client submissions:** events in Requested status with count of Not planned services.
4. **Upcoming events:** next 60 days, with first function date, planned ₹ vs budget, and open task count.
5. **Over budget:** events with any category over its envelope or planned above overall budget.

**Wireframe (web):**

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Good morning                                    Tue 17 Nov 2026        │
├── TODAY ───────────────────────────┬── NEW SUBMISSIONS ────────────────┤
│ Reception · Priya & Arjun          │ Meera & Karthik · 12 not planned  │
│ 12/20 done · 1 overdue      [Open] │ Divya & Rahul   ·  9 not planned  │
├── DUE THIS WEEK ───────────────────┴───────────────────────────────────┤
│ ⚠ 16:30 Stage decor complete    Priya & Arjun · Reception              │
│   18 Nov Food tasting           Meera & Karthik                        │
│   20 Nov Pay DJ advance         Divya & Rahul                          │
├── UPCOMING EVENTS (60 days) ───────────────────────────────────────────┤
│ Meera & Karthik   5 Dec   ₹18.2L / ₹22L   14 tasks                     │
│ Divya & Rahul    19 Dec   ₹9.5L / ₹12L     6 tasks   ⚠ Decor over      │
└────────────────────────────────────────────────────────────────────────┘
```

**Acceptance criteria:**

- [ ] Each widget links to the screen that resolves it.
- [ ] Counts match the underlying event and task data.

## 16. Module 10: Inventory (S15, S16)

One central admin team maintains a shared catalogue of rental inventory that every planning company can browse. Planners cannot edit it; they enquire, and the admin team confirms availability outside the system.

**Roles:**

| Role                             | Can do                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------- |
| Admin (platform-level, one team) | Add, edit, hide and reorder inventory items and categories; manage admin contacts |
| Planner (any company)            | Browse, search, filter and enquire                                                |

**Default categories (admin-editable):** Sheds and Tents (AC / Non-AC); Stage Platforms and Carpeting; Fabrication, Side Covering and Backdrops; Chandeliers and Hanging Decor; Mirrors and Frames; Pathway Stands and Aisle Decor; Wedding Props (mandap pillars, oonjal, urlis, lamps); Chairs and Sofas; Tables and Linen; Food Counters; Catering Equipment (hotel, resort, outdoor); Buffet and Banana-Leaf Service Gear; Air Conditioners and Air Coolers; Pedestal and Mist Fans; Lighting; PA Systems; Generators; Barricades and Temporary Hoardings.

**Item fields:** name, category, photos (up to 5), short description, size or specs (free text), unit (piece, set, sq ft, running ft), indicative rental rate (optional), visible to planners (toggle).

**Planner flow (S15):**

1. **Inventory** in the side menu, below Catalogue, opens the catalogue: category chips, search, item cards with photo, name, specs and unit.
2. Tapping **Enquire** on an item opens an enquiry panel: quantity, and an optional event and function that fills the date and venue.
3. The panel offers **Call admin** (dials the admin contact) or **WhatsApp** with a pre-filled message: "Is {item} × {qty} available on {date} for {venue}?"
4. Nothing is stored about the enquiry in v1; the admin team replies by phone or WhatsApp.

**Admin console (S16):** a separate login and menu (Inventory items, Categories, Admin contacts). The items list shows photo, name, category, unit, rate and visibility; an edit panel holds all item fields with photo upload. Hidden items never appear to planners.

**Wireframe, planner catalogue (web):**

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Inventory                                           [Search items…]    │
│ [All] [●Chandeliers] [Mirrors] [Pathway stands] [Sheds] [+12 more]     │
├────────────────┬────────────────┬────────────────┬─────────────────────┤
│ [Photo]        │ [Photo]        │ [Photo]        │ Enquire             │
│ Crystal        │ Brass tiered   │ Floral hanging │ Crystal chandelier  │
│ chandelier     │ chandelier     │ ring           │ Qty [6]             │
│ Ø 4 ft · piece │ Ø 3 ft · piece │ Ø 6 ft · set   │ Event [Priya & A ▾] │
│ [Enquire]      │ [Enquire]      │ [Enquire]      │ [Call] [WhatsApp]   │
└────────────────┴────────────────┴────────────────┴─────────────────────┘
```

**Later (not v1):** tracked enquiries with an Available / Not available reply in the app, date-based stock availability, and an "Add to event" shortlist on the plan.

**Acceptance criteria:**

- [ ] Every planner sees the same visible items; hidden items never show.
- [ ] Only admins can create or change items and categories.
- [ ] Enquire pre-fills quantity, date and venue when an event is picked.
- [ ] Call and WhatsApp open with the admin contact and the pre-filled message.
- [ ] Items support up to 5 photos and all listed fields.

## 17. Non-functional requirements

These apply across all modules and should be built in from the first milestone, not added later.

**Multi-tenancy and access:**

- Every table carries company\_id; enforce isolation at the data layer (for example, row-level security), not only in application code. Inventory tables are the one exception: platform-wide, readable by every planner and writable only by admins.
- Planner login with email or phone OTP (method to be decided); sessions expire after inactivity.
- Client form access only through the unguessable form\_token; rate-limit form views and submissions per token and IP.

**Security (OWASP Top 10):**

- Validate and sanitise all input on the server; parameterised queries only.
- No secrets in code; use environment variables or a secrets manager.
- HTTPS everywhere; secure, HttpOnly cookies; CSRF protection on web forms.
- Audit log for create, update and delete on events, service lines and tasks.

**Privacy (India DPDP Act 2023):**

- Client and vendor names and phone numbers are personal data. Show a short notice on the client form stating why data is collected.
- Encrypt data at rest and in transit; restrict exports.
- Support deleting a client's personal data on request while keeping anonymised event totals.

**Formats and localisation:**

- Currency ₹ with Indian digit grouping (₹1,80,000; ₹12,00,000); "L" short form (₹18.2L) only in compact widgets.
- Dates as "14 Feb 2027"; times in 12-hour or 24-hour per company setting; time zone default Asia/Kolkata.
- English in v1; keep all UI strings in resource files for Tamil later.

**Performance and reliability:**

- Plan screens (S7, S10) load within 2 seconds for an event with 10 functions and 80 service lines.
- Mobile app usable fully offline for cached days (section 14).
- Daily backups with point-in-time restore.

**Quality:**

- Unit tests for every calculation rule in section 12 and the date rule in section 13.
- End-to-end tests for: create event → submit form → add service → add task → receive reminder → mark done.
- Structured logging with no personal data in logs.

**Design system:** clean and minimal, with one accent colour, generous spacing, light and dark mode, and mobile-first for S1 and S12.

## 18. Build order

Build in this order so each milestone produces something usable and the later modules have the data they depend on. Each milestone is done when its modules' acceptance criteria pass.

1. **Foundations:** project setup, company and planner accounts, login, tenancy isolation, design system shell, navigation (section 3).
2. **Catalogue (Module 2):** parameter definitions, categories, services, seed data from sections 4 and 5, Settings screen S2, function types.
3. **Vendors (Module 3):** vendor CRUD, contacts, services offered with optional rates, directory S3 and profile S4.
4. **Events and functions (Module 4):** create event S5, event overview S6, functions, status rules.
5. **Service plan (Module 5):** service lines, function rows, parameters, vendor toggle, budgets, S7 and S8.
6. **Roll-ups (Module 6):** calculation service with unit tests, S9 and S10.
7. **Client form (Module 1):** public form S1, submission, requested services panel, lock and resubmit.
8. **Tasks (Module 7):** task CRUD, date rule, creation from S8, S9 and S11.
9. **Mobile app (Module 8):** Today and Upcoming, offline cache and sync, local reminders, push, time shift.
10. Rooms and guests table, Inventory (Module 10) with admin console, **Dashboard (Module 9)** and polish.

**Tips for building with Claude:**

- Feed one milestone at a time, with sections 2, 4 and 6 always included as shared context.
- Ask for the data model and migrations first, then the calculation service with tests, then screens.
- Use the wireframes as layout guides, not pixel specs; the acceptance criteria are the contract.
- Keep the seed catalogue in a separate JSON or SQL seed file generated from section 5.

## 19. Open decisions and future scope

These items are not yet decided or are deliberately left out of v1. Proposed defaults are used in this spec until confirmed.

**Open decisions:**

- [ ] Summary as one category × function grid, or two screens (event overview and function view)
- [ ] Mobile app as native (for example, React Native) or an installable web app; offline and on-device reminders are required either way
- [ ] Planner login method: email, phone OTP or both
- [ ] Pax pre-fill defaults per category (section 4)
- [ ] Client form resubmission until locked (section 7)
- [ ] Dashboard widgets (section 15)
- [ ] Tech stack and hosting

**Future scope (after v1):**

| Feature                                   | Notes                                       |
| ----------------------------------------- | ------------------------------------------- |
| Copy tasks from a previous event          | Re-dates tasks to the new event's functions |
| Team roles and coordinators               | Assign tasks, per-role views                |
| Repeat reminders, WhatsApp and SMS alerts | Escalation if a task stays pending          |
| Vendor portfolio                          | Galleries and uploads                       |
| Client view of their event                | Read-only plan and timeline                 |
| Quotes, invoices and payments             | Client receivables, vendor advances         |
| Even split of shared costs                | Optional toggle in roll-ups                 |
| Tamil language                            | UI strings already externalised             |
