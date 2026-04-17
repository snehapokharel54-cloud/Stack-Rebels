# Backend Testing Documentation - Grihastha Platform
## Unit Testing & Manual Testing Guide (Business Analyst Perspective)

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Platform:** Grihastha (Property Booking Platform)  
**Backend Stack:** Node.js, Express.js, PostgreSQL, Cloudinary  

---

## TABLE OF CONTENTS
1. [Testing Strategy Overview](#testing-strategy-overview)
2. [Unit Testing Plan](#unit-testing-plan)
3. [Manual Testing Plan](#manual-testing-plan)
4. [Business Workflow Test Cases](#business-workflow-test-cases)
5. [API Test Cases Reference](#api-test-cases-reference)
6. [Testing Checklist](#testing-checklist)

---

## TESTING STRATEGY OVERVIEW

### Testing Pyramid Approach
```
          GUI Tests (10%)
        Integration (30%)
      Unit Tests (60%)
```

### Key Testing Areas (Priority Order)
1. **Critical Path Testing** - Booking workflow, Payment calculations, Host earnings
2. **Data Integrity** - Date overlaps, pricing calculations, booking status transitions
3. **Authorization** - Role-based access control (Host/Guest/Admin)
4. **Edge Cases** - Boundary values, malformed inputs, concurrent operations
5. **Performance** - Search with large datasets, pagination limits

### Testing Environment Requirements
- **Database:** PostgreSQL test instance (clean state before each suite)
- **File Storage:** Cloudinary sandbox account for image uploads
- **Email Service:** Test email service (nodemailer with test account)
- **Authentication:** JWT token generation utilities
- **API Testing Tools:** Postman, Jest, Supertest, or REST Client

### Testing Data Strategy
- Use **transactional rollback** for unit tests (create → assert → rollback)
- Use **factory patterns** for test data generation
- Maintain **test fixtures** for repeated test scenarios
- Clean up test data after each test suite execution

---

## UNIT TESTING PLAN

### 1. LISTING CONTROLLER TESTS

#### Test Suite: Listing Creation & Draft Management

| Test Case | Input | Expected Output | Business Rule Validated |
|-----------|-------|-----------------|------------------------|
| **Create Listing - Valid** | Host ID, basic fields (title, description) | Draft listing created with status="DRAFT", can edit | Host can create unlimited draft listings |
| **Create Listing - Missing Host ID** | No auth token | 401 Unauthorized | Only authenticated hosts can create |
| **Create Listing - Non-Host User** | User role (not host) | 403 Forbidden | Only users with host permissions can create |
| **Update Draft - All Fields** | Valid draft ID, all listing fields | Listing updated, status remains "DRAFT" | All fields can be modified before publish |
| **Update Draft - Invalid Field Values** | Invalid price (negative), invalid capacity | 400 Bad Request with field errors | Price ≥ 0, capacity > 0 |
| **Update Published Listing** | Published listing ID, modified fields | 400 Bad Request or partial update | Restrictions on what can be edited after publish |
| **Delete Draft Listing** | Valid draft ID, host ownership | Listing soft-deleted or marked inactive | Only draft listings can be deleted |
| **Delete Published Listing** | Published listing ID | 403 Forbidden | Published listings cannot be deleted |
| **Delete Non-Owned Listing** | Listing ID, different host | 403 Forbidden | Hosts can only delete their own listings |

#### Test Suite: Listing Photo Management

| Test Case | Input | Expected Output | Business Rule Validated |
|-----------|-------|-----------------|------------------------|
| **Upload 1-10 Photos** | Valid images (<5MB each, JPEG/PNG) | Photos stored in Cloudinary, URLs returned | Max 10 photos per listing |
| **Upload 11th Photo** | 11th image to same listing | 400 Bad Request | Photo limit enforced |
| **Upload Oversized Photo** | Image > 5MB | 413 Payload Too Large | File size limit enforced |
| **Upload Invalid Format** | PDF, TXT, or other non-image | 415 Unsupported Media Type | Only image formats accepted |
| **WebP Conversion** | JPG/PNG image | Stored in Cloudinary as WebP | Images converted for optimization |
| **Missing Photo URL** | Upload successful but URL not returned | Verify public_id stored in DB | All photo metadata captured |

#### Test Suite: Listing Publication

| Test Case | Input | Expected Output | Business Rule Validated |
|-----------|-------|-----------------|------------------------|
| **Publish Complete Listing** | All required fields filled: title, address, price, photos, amenities | Status changes to "PUBLISHED", published_at set | Publish requires complete information |
| **Publish Incomplete Listing** | Missing title or price or address | 400 Bad Request with missing fields | Required field validation enforced |
| **Publish Listing Twice** | Already published listing, publish again | 400 Bad Request or 200 (idempotent) | Clarify publish idempotency requirement |
| **Publish with Zero Photos** | All fields valid but no photos | Accept or Reject? | Define minimum photo requirement (typically 1+) |
| **Publish Draft Listing** | Mark valid draft as published | Status="PUBLISHED", published_at=NOW | Timestamp shows publication date |

#### Test Suite: Listing Search & Discovery

| Test Case | Input | Expected Output | Business Rule Validated |
|-----------|-------|-----------------|------------------------|
| **Search All Published Listings** | No filters | Return paginated list of published listings | Default sort/pagination works |
| **Search by Location** | city="Mumbai", state="Maharashtra" | Only listings with matching address | Location search works accurately |
| **Search by Date Range** | check_in="2026-05-01", check_out="2026-05-10" | Only listings without bookings in range | Date availability checked against confirmed/pending bookings |
| **Search by Price Range** | min_price=1000, max_price=5000 | Listings with price_per_night within range | Price filtering works |
| **Search by Amenities** | parking=true, wifi=true | Only listings with all selected amenities | Multi-amenity filtering logic |
| **Search by Guest Capacity** | guests=4 | Listings with capacity ≥ 4 | Capacity match enforced |
| **Combined Complex Search** | Location + date + price + amenities + capacity | Correct intersection of all filters | All filters work together |
| **Draft Listing Visibility** | Search as guest | Draft listings NOT returned | Drafts hidden from public search |
| **Draft Listing Owner Visibility** | Owner searches own listings | Own draft listings visible | Owner can see own drafts |
| **Pagination - Default** | No limit param | Return 20 results | Default limit applied |
| **Pagination - Max Limit** | limit=100 | Return max 50 results | Limit capped at 50 |
| **Pagination - Offset** | offset=20, limit=20 | Return records 20-40 | Offset/limit work together |
| **Search Empty Results** | Filters match no listings | Return empty array with pagination info | Edge case handled gracefully |
| **Sorting by Price ASC** | sort="price_asc" | Listings ordered by price_per_night ascending | Price sort works |
| **Sorting by Price DESC** | sort="price_desc" | Listings ordered by price_per_night descending | Reverse sort works |
| **Sorting by Newest** | sort="newest" | Listings ordered by created_at DESC | Newest sort works |

#### Test Suite: Listing Retrieval

| Test Case | Input | Expected Output | Business Rule Validated |
|-----------|-------|-----------------|------------------------|
| **Get Single Listing - Published** | Valid published listing ID, unauthenticated | Full listing details + host info (name, avatar, superhost status) | Public can view published |
| **Get Single Listing - Draft by Owner** | Valid draft ID, authenticated as owner | Listing details | Owner can view own draft |
| **Get Single Listing - Draft by Non-Owner** | Valid draft ID, authenticated as other user | 403 Forbidden or 404 Not Found | Non-owners can't see drafts |
| **Get Non-Existent Listing** | Invalid listing ID | 404 Not Found | Invalid IDs handled |
| **Host Listings List** | Authenticated host | Return all host's listings (draft + published) | Paginated list of own listings |
| **Guest View Host Info** | Anonymous viewing published listing | Host name, avatar, superhost badge | Host credibility info visible |

---

### 2. BOOKING CONTROLLER TESTS

#### Test Suite: Booking Creation & Validation

| Test Case | Input | Expected Output | Business Rule Validated |
|-----------|-------|-----------------|------------------------|
| **Create Valid Booking** | Valid listing_id, guest_id, check_in, check_out (non-overlapping) | Booking created with status="pending", price_breakdown calculated | Core booking workflow |
| **Create Booking - Guest = Host** | Guest and Host IDs identical | 400 Bad Request | Self-booking prohibited |
| **Create Booking - Non-Existent Listing** | Invalid listing_id | 404 Not Found | Listing must exist |
| **Create Booking - Unpublished Listing** | Draft listing_id | 400 Bad Request | Can't book unpublished listings |
| **Create Booking - Date Overlap (Confirmed)** | Dates overlapping confirmed booking | 400 Bad Request "Dates unavailable" | Confirmed bookings block dates |
| **Create Booking - Date Overlap (Pending)** | Dates overlapping pending booking | 400 Bad Request or allow (clarify rules) | Define pending booking date blocking rules |
| **Create Booking - Check-Out Before Check-In** | check_in="2026-05-10", check_out="2026-05-05" | 400 Bad Request "Invalid date range" | Date logic enforced |
| **Create Booking - Same Day (0 nights)** | check_in=check_out | 400 Bad Request | Minimum 1 night stay |
| **Create Booking - Below Minimum Stay** | nights < minimum_night_stay | 400 Bad Request "Below minimum stay" | Minimum night requirement enforced |
| **Create Booking - Exceeds Maximum Stay** | nights > maximum_night_stay | 400 Bad Request "Exceeds maximum stay" | Maximum night limit enforced |
| **Create Booking - Guest Over Capacity** | guests=10, listing max_capacity=6 | 400 Bad Request "Exceeds capacity" | Capacity validation enforced |
| **Create Booking - Unauthenticated** | No JWT token | 401 Unauthorized | Only authenticated guests |
| **Create Booking - Non-Guest User** | Admin or host role attempting book | 403 Forbidden | Only guest role can book |

#### Test Suite: Pricing Calculation

| Test Case | Input | Expected Output | Business Rule Validated |
|-----------|-------|-----------------|------------------------|
| **Price Calc - Base Price** | price_per_night=2000, nights=5 | base_price=10000 (5×2000) | Nights × rate calculation |
| **Price Calc - With Cleaning Fee** | base_price=10000, cleaning_fee=500 | subtotal=10500 | Cleaning fee added |
| **Price Calc - Platform Fee (10%)** | subtotal=10500 | platform_fee=1050 | 10% of subtotal |
| **Price Calc - VAT (13%)** | base_with_platform=11550 | vat=1501.5 | 13% of (base + platform) |
| **Price Calc - Total** | all components | total=13051.5 | Sum all components correctly |
| **Price Calc - Stored in DB** | Create booking | price_breakdown JSON contains all fields | All calculations persist |
| **Price Calc - Decimal Precision** | Edge case prices | No rounding errors | Numeric precision maintained |

#### Test Suite: Booking Status Management

| Test Case | Input | Expected Output | Business Rule Validated |
|-----------|-------|-----------------|------------------------|
| **New Booking - Default Status** | Valid booking created | status="pending", payment_status="unpaid" | Initial statuses correct |
| **Accept Booking** | Host accepts pending booking | status="confirmed" | Transition valid |
| **Accept Non-Pending Booking** | Host accepts confirmed booking | 400 Bad Request | Only pending can be accepted |
| **Decline Booking** | Host declines pending booking | status="rejected" | Rejection transition |
| **Decline Non-Pending Booking** | Host declines confirmed booking | 400 Bad Request | Only pending can be declined |
| **Guest Cancel - Pending** | Guest cancels pending booking | status="cancelled", reason recorded | Guest can cancel unconfirmed |
| **Guest Cancel - Confirmed** | Guest cancels confirmed booking | status="cancelled", refund calculated | Guest can cancel confirmed (with possible fees) |
| **Guest Cancel - Already Cancelled** | Guest cancels cancelled booking | 400 Bad Request | Can't cancel twice |
| **Host Cancel - Confirmed** | Host cancels confirmed booking | status="cancelled", reason recorded | Host can cancel confirmed (possibly with refund due) |
| **Host Cancel - Pending** | Host cancels pending booking | 400 Bad Request | Only confirmed can be host-cancelled |
| **Status Transition Flow** | pending → confirmed → cancelled | All transitions succeed | Complete workflow valid |

#### Test Suite: Booking Retrieval & History

| Test Case | Input | Expected Output | Business Rule Validated |
|-----------|-------|-----------------|------------------------|
| **Get Guest Bookings** | Authenticated guest | All guest's bookings (pending, confirmed, cancelled) | Complete history visible |
| **Guest Sees Other's Booking** | Guest queries non-owned booking ID | 403 Forbidden | Privacy enforced |
| **Get Host Incoming Requests** | Authenticated host | All pending bookings for host's listings | Queue of unresponded requests |
| **Host Sees Only Own Listings' Bookings** | Host queries, filters applied | Only bookings for host's listings | Data isolation |
| **Get Booking Details** | Guest/Host queries booking | Full details: listing, guest, host, pricing | All info present |
| **Pagination** | limit=10, offset=20 | Return 10 bookings starting from 20 | Pagination works |
| **Sorting** | sort="created_at_desc" | Newest bookings first | Chronological order |
| **Filtering by Status** | status="confirmed" | Only confirmed bookings | Filter by status |
| **Filtering by Date Range** | date_from, date_to | Bookings in date range | Date range filter |

#### Test Suite: Pricing Breakdown Endpoint

| Test Case | Input | Expected Output | Business Rule Validated |
|-----------|-------|-----------------|------------------------|
| **Get Price Breakdown** | Valid booking ID | Itemized: base, cleaning, platform fee, tax, total | Guest sees cost components |
| **Verify Breakdown Math** | Retrieved breakdown | Verify: subtotal + platform_fee + vat = total | Math checks out |
| **Breakdown Before Accept** | Pending booking | Breakdown provided | Available pre-confirmation |
| **Breakdown After Cancel** | Cancelled booking | Still retrievable for refund info | Historical pricing available |

---

### 3. HOST CONTROLLER TESTS

#### Test Suite: Host Dashboard & Analytics

| Test Case | Input | Expected Output | Business Rule Validated |
|-----------|-------|-----------------|------------------------|
| **Get Stats - New Host** | Host with 0 listings, 0 bookings | 0 listings, 0 earnings, 0 pending bookings | Empty state handled |
| **Get Stats - Active Host** | Host with 5 listings, 10 confirmed bookings | Correct counts, total earnings calculated | Stats aggregation works |
| **Get Stats - Unauthorized** | Non-host accessing | 403 Forbidden | Only hosts access own stats |
| **Get Stats - Wrong Host** | Host A accessing Host B's stats | 403 Forbidden | Data isolation enforced |
| **Get Dashboard** | Authenticated host | Stats + recent bookings (e.g., last 5) | Combined dashboard data |
| **Get Earnings - Monthly Breakdown** | 12 months of booking data | Breakdown by month with amounts | Monthly granularity |
| **Get Earnings - Total** | All bookings | Sum matches manual calculation | Accuracy verified |
| **Get Earnings - Pending Bookings** | Confirmed only vs. all | Pending excluded from earnings | Only confirmed = revenue |
| **Listing Analytics** | Valid listing ID | Views, inquiries, ratings counters | Per-listing metrics |
| **Listing Analytics - Non-Owned** | Non-host accessing | 403 Forbidden | Host can't see other's analytics |

#### Test Suite: Host Profile Management

| Test Case | Input | Expected Output | Business Rule Validated |
|-----------|-------|-----------------|------------------------|
| **Update Profile - All Fields** | Valid host object (name, email, phone, bio, avatar) | Profile updated, changes reflected | All editable fields work |
| **Update Profile - Invalid Email** | Invalid email format | 400 Bad Request | Email validation |
| **Update Profile - Duplicate Email** | Email used by another user | 400 Bad Request or allowed (clarify) | Email uniqueness rules |
| **Update Profile - Non-Existent Host** | Invalid host ID | 404 Not Found | Validation before update |
| **Get Profile** | Authenticated host | Full profile data returned | Profile retrievable |
| **Superhost Status** | Auto-calculated from ratings | If avg_rating ≥ 4.8 and min_reviews ≥ 10 | Superhost badge earned |

#### Test Suite: Property Verification (KYC)

| Test Case | Input | Expected Output | Business Rule Validated |
|-----------|-------|-----------------|------------------------|
| **Submit Verification - First Time** | KYC docs uploaded (Aadhar/PAN/Passport) | status="pending_review" | KYC workflow initiated |
| **Submit Verification - Duplicate** | Already submitted listing | 400 Bad Request "Already submitted" | Prevent re-submit |
| **Check Verification Status** | Valid listing ID | Return current status (pending/approved/rejected) | Status tracking |
| **Verification Auto-Approve** | Valid documents match rules | status="approved" | Automatic approval (if applicable) |
| **Verification Manual Review** | Incomplete/unclear documents | status="under_review", admin needs review | Human review workflow |
| **Verification for Listing Search** | Unverified listing in search | May show warning badge or hide (clarify) | Verification affects visibility |

---

### 4. GEOCODE CONTROLLER TESTS

| Test Case | Input | Expected Output | Business Rule Validated |
|-----------|-------|-----------------|------------------------|
| **Search Location - Valid City** | "Mumbai" | Return city coordinates, districts, suggestions | Location data returned |
| **Search Location - Full Address** | "123 Main St, Mumbai, Maharashtra" | Coordinates + formatted address | Address parsing works |
| **Search Location - Typo Tolerance** | "Mumbay" | Suggestions for "Mumbai" | Typo handling |
| **Search Location - Multi-Language** | "मुंबई" | Return English transliteration + coordinates | Multi-language support |
| **Search Empty** | "" | 400 Bad Request or empty array | Validation |
| **Nominatim Rate Limiting** | Rapid requests | Respect rate limits (1 req/sec) | External API usage respected |

---

## MANUAL TESTING PLAN

### Testing Methodology
- **Environment:** Staging server with production-like data (anonymized)
- **Volume:** Min 50 test cases per feature
- **Browsers:** Chrome, Firefox, Safari (for frontend integration)
- **Devices:** Desktop, Tablet, Mobile
- **Tools:** Postman, Swagger UI, Browser DevTools

### Execution Priority
1. **P0 (Critical):** Booking creation, payment, host earnings → Execute daily
2. **P1 (High):** Search, listing management, auth → Execute before release
3. **P2 (Medium):** Analytics, verification, edge cases → Execute weekly
4. **P3 (Low):** UI polish, performance optimization → Execute during sprint

---

## BUSINESS WORKFLOW TEST CASES

### Complete User Journey: Guest Booking a Property

**Duration:** 15-20 minutes | **Test Data Preparation:** 10 minutes

#### Step 1: Guest Account & Login
```
Pre-Condition: Guest account already created (can skip if testing existing user)

Test Case 1.1 - Guest Login
├─ Action: Login with valid (email, password)
├─ Expected: JWT token received, dashboard displayed
├─ Verification: User profile visible, role=guest confirmed

Test Case 1.2 - Guest Account Details Valid
├─ Action: View profile
├─ Expected: Full name, email, phone visible
├─ Verification: Match signup data
```

#### Step 2: Property Search
```
Test Case 2.1 - Search with Location Filter
├─ Action: Search city="Mumbai", state="Maharashtra"
├─ Expected: Multiple listings shown (e.g., 12-50 properties)
├─ Verification: All returned listings in Mumbai

Test Case 2.2 - Filter by Available Dates
├─ Action: Set check_in="2026-05-15", check_out="2026-05-22"
├─ Expected: Only properties with no booking overlap
├─ Verification: Manually verify against booking calendar

Test Case 2.3 - Filter by Budget
├─ Action: Set min_price=1500, max_price=4000
├─ Expected: Properties within price range
├─ Verification: All listings ≥1500 and ≤4000 per night

Test Case 2.4 - Filter by Amenities
├─ Action: Select: wifi, parking, kitchen
├─ Expected: Only listings with all 3 amenities
├─ Verification: Amenities list includes selected

Test Case 2.5 - Combined Filter
├─ Action: Apply location + date + price + amenities
├─ Expected: Intersection matching all criteria
├─ Verification: Manually cross-check results

Test Case 2.6 - Sort by Price (Ascending)
├─ Action: Click sort by "Price: Low to High"
├─ Expected: Listings ordered price_per_night ascending
├─ Verification: First price ≤ Second ≤ Third...

Test Case 2.7 - Pagination & Load More
├─ Action: View page 1 (20 results) → Click "Next"
├─ Expected: Load 20 more results (offset=20)
├─ Verification: No duplicate listings between pages

Test Case 2.8 - View Listing Details
├─ Action: Click on property card
├─ Expected: Full details page: description, photos, amenities, host info, reviews
├─ Verification: All sections load without errors
```

#### Step 3: Review Listing & Host Info
```
Test Case 3.1 - Host Credibility Check
├─ Action: View host card (name, avatar, superhost badge, ratings)
├─ Expected: Host info prominently displayed
├─ Verification: Superhost (if applicable) shown accurately

Test Case 3.2 - Photo Gallery
├─ Action: Click photo gallery, view all 8-10 photos
├─ Expected: High-quality WebP images load quickly
├─ Verification: No broken image errors

Test Case 3.3 - Amenity Verification
├─ Action: Review amenity list from listing details
├─ Expected: All amenities match selection criteria used in search
├─ Verification: Accuracy confirmed

Test Case 3.4 - Pricing Transparency
├─ Action: View price breakdown link
├─ Expected: Shows base_price + cleaning_fee + platform_fee + tax formula
├─ Verification: Match calculation rules
```

#### Step 4: Create Booking
```
Test Case 4.1 - Click "Book Now" Button
├─ Action: Click "Book Now" (or similar) from listing details
├─ Expected: Redirect to booking form with dates pre-filled
├─ Verification: check_in/check_out dates match search

Test Case 4.2 - Booking Form - Auto-Filled Fields
├─ Action: Review form fields
├─ Expected: listing_id, dates, guest count pre-populated
├─ Verification: Values match booking intent

Test Case 4.3 - Special Requests (Optional)
├─ Action: Add special request: "High floor preferred"
├─ Expected: Stored in booking record
├─ Verification: Field accepts 100+ character message

Test Case 4.4 - Review Pricing Breakdown
├─ Action: Check calculated total before payment
├─ Expected:
│   ├─ Base Price: Rs. 2000 × 7 nights = Rs. 14,000
│   ├─ Cleaning Fee: Rs. 500
│   ├─ Subtotal: Rs. 14,500
│   ├─ Platform Fee (10%): Rs. 1,450
│   ├─ Subtotal II: Rs. 15,950
│   ├─ Taxes (13%): Rs. 2,073.50
│   └─ Total: Rs. 18,023.50
├─ Verification: Breakdown math accurate ✓

Test Case 4.5 - Accept Terms
├─ Action: Check "I agree to cancellation policy" checkbox
├─ Expected: Checkbox state persists
├─ Verification: Required before submit

Test Case 4.6 - Submit Booking Form
├─ Action: Click "Confirm Booking" button
├─ Expected: Form submitted, booking created with status="pending"
├─ Verification: Confirmation message displayed

Test Case 4.7 - Booking Confirmation Email
├─ Pre-Condition: Email service running
├─ Action: Check guest email inbox
├─ Expected: Confirmation email received with:
├─    ├─ Listing title, dates, total price
├─    ├─ Special requests echoed back
├─    └─ Host contact info
├─ Verification: Email in Inbox (not spam folder)
```

#### Step 5: Host Receives Request
```
Pre-Condition: Logged in as property host

Test Case 5.1 - Incoming Request Notification
├─ Action: Log in as host, view dashboard
├─ Expected: "New Booking Request" badge showing count=1
├─ Verification: Badge updated in real-time

Test Case 5.2 - Incoming Requests Queue
├─ Action: Navigate to "Incoming Bookings" tab
├─ Expected: See pending booking request with guest name, dates, price
├─ Verification: Guest details match submitted booking

Test Case 5.3 - Request Details View
├─ Action: Click on booking request
├─ Expected: Full details: guest profile, special requests, pricing breakdown
├─ Verification: All info matches booking submission

Test Case 5.4 - Accept Request Button
├─ Action: Click "Accept Booking"
├─ Expected: Status changes pending → confirmed
├─ Verification: "Confirm" button replaced with "Confirmed" badge

Test Case 5.5 - Acceptance Notification
├─ Expected: Email sent to guest: "Your booking is confirmed"
├─ Verification: Confirmation email in guest inbox
```

#### Step 6: Monitor Booking History
```
Pre-Condition: Booking confirmed

Test Case 6.1 - Guest Views Confirmed Booking
├─ Action: Log in as guest, view "My Bookings"
├─ Expected: Booking shows status="confirmed" with green badge
├─ Verification: Can see host contact, listing details, calendar

Test Case 6.2 - Host Views Confirmed Bookings
├─ Action: Log in as host, view "My Bookings"
├─ Expected: See confirmed booking on calendar for dates 2026-05-15 to 2026-05-22
├─ Verification: Dates appear as unavailable for new bookings

Test Case 6.3 - Earnings Update
├─ Action: View host earnings dashboard
├─ Expected: Total earnings increased by Rs. 18,023.50 (minus commission)
├─ Verification: May 2026 earnings month updated
```

#### Step 7: Cancellation Scenarios (Separate Test Runs)

**Scenario A: Guest Cancels (Before 48 hours)**
```
Test Case 7A.1 - Cancel Confirmed Booking
├─ Action: Guest clicks "Cancel Booking" within 48-hour window
├─ Expected: Option to cancel appears
├─ Verification: Full refund logic applied

Test Case 7A.2 - Refund Processed
├─ Expected: Booking status="cancelled", payment_status="refunded"
├─ Verification: Refund manual check (amount, timing)
```

**Scenario B: Host Declines Initial Request**
```
Test Case 7B.1 - Host Decline Request
├─ Pre-Condition: Booking pending, not yet accepted
├─ Action: Click "Decline" button
├─ Expected: Status changes to "rejected"
├─ Verification: Dates released for rebooking
```

---

## API TEST CASES REFERENCE

### Testing Tools & Setup

#### Postman Collection Template
```json
{
  "info": { "name": "Grihastha API Tests", "version": "1.0" },
  "auth": { "type": "bearer", "token": "{{jwt_token}}" },
  "item": [
    {
      "name": "Authentication",
      "item": [
        { "request": { "method": "POST", "url": "{{base_url}}/v1/auth/user/login" } }
      ]
    },
    {
      "name": "Listings",
      "item": [
        { "request": { "method": "GET", "url": "{{base_url}}/v1/listings/search" } },
        { "request": { "method": "POST", "url": "{{base_url}}/v1/listings" } }
      ]
    },
    {
      "name": "Bookings",
      "item": [
        { "request": { "method": "POST", "url": "{{base_url}}/v1/bookings" } },
        { "request": { "method": "GET", "url": "{{base_url}}/v1/bookings" } }
      ]
    }
  ]
}
```

### API Test Scenarios

#### 1. AUTHENTICATION & AUTHORIZATION

**Test Case: Verify JWT Token Validation**
```
Request: GET /v1/bookings (without token)
Expected Status: 401 Unauthorized
Expected Response:
{
  "success": false,
  "message": "Unauthorized: No token provided"
}
Validation: User cannot access protected endpoints without token
```

**Test Case: Verify Role-Based Access (Host vs Guest)**
```
Scenario 1 - Guest accessing host endpoint:
Request: GET /v1/host/stats (with guest JWT)
Expected Status: 403 Forbidden
Expected Response: { "success": false, "message": "Admin access required" }

Scenario 2 - Host accessing guest booking:
Request: GET /v1/bookings/123 (booking_id not owned)
Expected Status: 403 Forbidden
Validation: Role-based access enforced
```

#### 2. DATA VALIDATION TESTS

**Test Case: Email Validation**
```
Endpoint: POST /v1/auth/user/signup
Test Inputs:
├─ "user@example.com" → Accept (valid format)
├─ "user@fakeemail.xyz" → Reject if domain MX check fails
├─ "invalid.email" → Reject (no @domain)
├─ "user@domain.com" → Reject if domain not receiving emails

Business Rule: Platform prevents bot sign-ups via fake email domains
```

**Test Case: Phone Number Validation**
```
Endpoint: POST /v1/auth/user/signup
Test Inputs:
├─ "+91-98765-43210" → Accept (valid international format)
├─ "9876543210" → Reject (missing country code)
├─ "invalid" → Reject (not numeric)

Business Rule: Phone standardization for communication
```

**Test Case: Password Strength**
```
Endpoint: POST /v1/auth/user/signup
Test Inputs:
├─ "Pass@1234" → Accept (8+ chars, uppercase, number)
├─ "pass1234" → Reject (no uppercase)
├─ "PASSWORD" → Reject (no number)
├─ "Pass" → Reject (too short)

Business Rule: Enforce password security standards
```

#### 3. BOUNDARY & EDGE CASE TESTS

**Test Case: Pagination Limits**
```
Requests:
├─ GET /v1/listings/search?limit=10 → Return 10 results ✓
├─ GET /v1/listings/search?limit=100 → Return max 50 results ✓
├─ GET /v1/listings/search?limit=-1 → 400 Bad Request ✓
├─ GET /v1/listings/search?offset=999999 → Return empty array ✓

Business Rule: Prevent excessive data transfer
```

**Test Case: Price & Numeric Precision**
```
Request: POST /v1/bookings
Body:
{
  "listing_id": 1,
  "check_in": "2026-05-15",
  "check_out": "2026-05-22",
  "guests": 2
}
Expected Calculation:
├─ price_per_night: 2499.99 (from listing)
├─ nights: 7
├─ base_price: 17499.93 (calculated, no rounding errors)
├─ cleaning_fee: 500.00
├─ platform_fee: 1799.99 (10% with precision)
├─ vat: 2493.99 (13%)
└─ total: 22293.91

Validation: Decimal precision maintained (2 decimal places)
```

**Test Case: Concurrent Booking Prevention**
```
Setup: Two guests attempting same dates simultaneously
Action:
  ├─ Guest A: POST /v1/bookings (for 2026-05-15 to 2026-05-30)
  ├─ Guest B: POST /v1/bookings (same listing, same dates) [sent 100ms later]

Expected Behavior:
  ├─ Guest A: 201 Created ✓
  └─ Guest B: 400 Bad Request "Dates unavailable" ✓

Business Rule: Prevent double-booking through transaction isolation
```

#### 4. ERROR HANDLING & RECOVERY

**Test Case: Malformed Request Bodies**
```
Request: POST /v1/listings with malformed JSON
Body: { "title": "Property", "price": invalid_value }

Expected Status: 400 Bad Request
Expected Response:
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "price", "message": "Price must be a number" }
  ]
}
```

**Test Case: Database Connection Failure**
```
Simulate: Stop database service
Request: GET /v1/listings/search

Expected Status: 503 Service Unavailable
Expected Response:
{
  "success": false,
  "message": "Database connection failed. Please try again later."
}
Verification: Error message doesn't expose internal details
```

#### 5. SECURITY TESTS

**Test Case: SQL Injection Prevention**
```
Request: GET /v1/listings/search?city=Mumbai' OR '1'='1
Expected: Query parameter escaped, treated as literal string
Verification: No database error, no unauthorized data exposure
```

**Test Case: Rate Limiting**
```
Scenario: Brute force attack prevention
Setup: Standard rate limit = 10 requests per 15 minutes per IP

Test:
  ├─ Requests 1-10: 200 OK ✓
  ├─ Request 11: 429 Too Many Requests ✓
  ├─ Response: { "success": false, "message": "Rate limit exceeded" }

Business Rule: Protect against bot attacks and DDoS
```

**Test Case: CORS Policy**
```
Test: Request from unauthorized domain
Origin: https://attacker.com
Request: GET /v1/listings/search

Expected: CORS error (403 or origin check fails)
Allowed Origins: Only CLIENT_URL and ADMIN_PANEL_URL
Verification: Security policy enforced
```

---

## TESTING CHECKLIST

### Pre-Testing Requirements
- [ ] Staging database seeded with realistic data (50+ listings, 20+ users, 30+ bookings)
- [ ] Cloudinary sandbox account configured for testing
- [ ] Test JWT tokens generated for all roles (guest, host, admin)
- [ ] Postman collection imported with environment variables
- [ ] Email testing service (e.g., Mailhog) running
- [ ] VPN disabled if testing external APIs
- [ ] Browser DevTools opened (Network, Console tabs)
- [ ] Test data cleanup script ready (for post-test teardown)

### Unit Testing Checklist

#### Listing Module (Controller + Model)
- [ ] Draft creation without restrictions
- [ ] Multi-field updates on draft
- [ ] Photo upload validation (count, size, format)
- [ ] WebP conversion working
- [ ] Publication workflow (draft → published)
- [ ] Search with 5+ filter combinations
- [ ] Date availability overlap detection
- [ ] Pagination (limit, offset edges)
- [ ] Sorting (price asc/desc, newest)
- [ ] Draft visibility (owner vs. others)
- [ ] Soft-delete on publish (if applicable)
- [ ] Error messages clear and actionable

#### Booking Module
- [ ] Create booking with valid data
- [ ] Prevent self-booking
- [ ] Date overlap detection (confirmed + pending)
- [ ] Price calculation accuracy (all components)
- [ ] Minimum/maximum night enforcement
- [ ] Capacity validation
- [ ] Booking status transitions (pending → confirmed/rejected/cancelled)
- [ ] Guest cancellation + refund logic
- [ ] Host cancellation + refund logic
- [ ] Pagination in history
- [ ] Error handling for non-existent resources

#### Host Module
- [ ] Stats calculation (listings count, earnings, pending count)
- [ ] Earnings breakdown by month
- [ ] Profile update (all fields)
- [ ] Property verification workflow
- [ ] KYC document validation
- [ ] Incoming requests queue
- [ ] Analytics per listing

#### Geocode Module
- [ ] Valid location search
- [ ] Nominatim API integration
- [ ] Rate limit respect
- [ ] Typo handling
- [ ] Multi-language support

### Manual Testing Checklist

#### Guest End-to-End (Complete Booking Flow)
- [ ] Register & activate account
- [ ] Search with multiple filters
- [ ] View listing details & host info
- [ ] Create booking (pending status)
- [ ] Receive confirmation email
- [ ] View booking in history
- [ ] Cancel booking & receive refund (test cancellation policy)
- [ ] Leave review (if applicable)

#### Host Workflow
- [ ] Register & activate as host
- [ ] Create new listing (draft)
- [ ] Fill multi-step form
- [ ] Upload 5-10 photos
- [ ] Publish listing
- [ ] Receive booking request notification
- [ ] Accept/decline request
- [ ] View dashboard (stats, earnings)
- [ ] Check incoming bookings queue
- [ ] Cancel accepted booking (document reason)
- [ ] View analytics per listing
- [ ] Submit KYC verification

#### Admin Workflow (if applicable)
- [ ] View all listings (published, draft, banned)
- [ ] View all bookings & revenue
- [ ] Review KYC documents
- [ ] Monitor payment processing
- [ ] View system logs

### Integration Testing Checklist
- [ ] Frontend → Backend API calls (CORS working)
- [ ] Database queries return correct data
- [ ] Cloudinary integration (upload + CDN delivery)
- [ ] Email service (send emails reliably)
- [ ] JWT authentication (tokens issue and validate)
- [ ] Rate limiting (requests throttled)
- [ ] Error middleware (all errors formatted consistently)

### Performance & Load Testing Checklist
- [ ] Search endpoint (1000+ listings): Response time < 2 seconds
- [ ] Pagination large datasets: Offset 1000+, load time acceptable
- [ ] Photo upload: 10MB total upload time < 30 seconds
- [ ] Concurrent bookings: Database handles 10+ simultaneous POST /bookings
- [ ] Peak time simulation (100 users online): System stable

### Security Testing Checklist
- [ ] SQL injection prevention (test malicious inputs)
- [ ] XSS prevention (test script in input fields)
- [ ] CSRF tokens (if applicable)
- [ ] Password strength enforced
- [ ] JWT expiration (old tokens rejected)
- [ ] Sensitive data not exposed in errors (no stack traces)
- [ ] CORS origin whitelist enforced
- [ ] Rate limiting prevents brute force
- [ ] File upload sanitization (no malicious files)

### Regression Testing Checklist (Before Each Release)
- [ ] All P0 tests pass (bookings, payments)
- [ ] All P1 tests pass (search, auth)
- [ ] No new bugs in stable features
- [ ] Email notifications working
- [ ] Reports generating correctly
- [ ] Notifications real-time
- [ ] UI responsive on mobile

### Sign-Off Testing
- [ ] Business analyst approves workflows
- [ ] QA lead signs off on test coverage
- [ ] Staging matches production in data & config
- [ ] Post-launch monitoring plan ready (alerts configured)
- [ ] Rollback procedure documented
- [ ] Release notes prepared

---

## TEST DATA REQUIREMENTS

### Minimum Test Data Set
```
Users:
├─ 50 guest accounts (with varied locations)
├─ 20 host accounts (with 1-5 listings each)
└─ 5 admin accounts

Listings:
├─ 100 published listings
│  ├─ 30 in Mumbai (various neighborhoods)
│  ├─ 25 in Bangalore
│  ├─ 25 in Delhi
│  └─ 20 in other cities
├─ 20 draft listings
└─ 5 unpublished listings

Bookings:
├─ 80 confirmed bookings (past & future)
├─ 15 pending bookings
├─ 10 cancelled bookings
├─ 5 rejected bookings
└─ Distribution: 60% pending, 30% confirmed, 10% other

Pricing:
├─ Base prices range: Rs. 1000 - Rs. 10,000/night
├─ Cleaning fees: Rs. 200 - Rs. 1000
└─ Guest capacity: 1 - 10 persons

Verification:
├─ 60 verified hosts
├─ 12 pending verification
└─ 8 rejected verification
```

### Test Account Credentials
```
GUEST TEST ACCOUNT:
  Email: guest.test@example.com
  Password: GuestTest@123
  Phone: +91-98765-43210

HOST TEST ACCOUNT:
  Email: host.test@example.com
  Password: HostTest@123
  Phone: +91-98765-43211

ADMIN TEST ACCOUNT:
  Email: admin.test@example.com
  Password: AdminTest@123
  Phone: +91-98765-43212
```

---

## DEFECT LOGGING TEMPLATE

When logging bugs during testing, use this template:

```
Title: [Feature] - [Issue]
Example: Booking - Date overlap not preventing double-booking

Severity:
  ☐ Critical (blocks release)
  ☐ High (significant business impact)
  ☐ Medium (workaround available)
  ☐ Low (cosmetic)

Environment:
  Browser: Chrome 120
  OS: macOS 13
  API Base: https://api.staging.grihastha.com
  Timestamp: 2026-04-10 14:30 UTC

Steps to Reproduce:
  1. Login as host@test.com
  2. Create listing with price_per_night=2000
  3. Guest books 2026-05-15 to 2026-05-22
  4. While booking pending, second guest books same dates
  5. System allows both bookings
  
Expected Result:
  Second booking should fail with error "Dates unavailable"

Actual Result:
  Both bookings created successfully with status=pending (INCORRECT)

Attachments:
  - Screenshot of both booking IDs
  - Database query results
  - API response logs

Root Cause (if known):
  Likely missing date overlap check in booking.controller.js

Assigned To: [Developer Name]
```

---

## TESTING METRICS & KPIs

Track these metrics throughout testing:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Code Coverage | 80%+ | TBD | 🟡 |
| Test Pass Rate | 100% | TBD | 🟡 |
| Critical Bugs | 0 | TBD | 🟡 |
| High Bugs | ≤2 | TBD | 🟡 |
| API Endpoint Coverage | 100% | TBD | 🟡 |
| Business Flow Coverage | 100% | TBD | 🟡 |
| Performance: Search < 2s | Yes | TBD | 🟡 |
| Performance: Upload < 30s | Yes | TBD | 🟡 |
| Security Test Pass | 100% | TBD | 🟡 |

---

## CONCLUSION

This testing document provides a comprehensive framework for validating the Grihastha backend from both technical and business perspectives. Testing should be executed iteratively:

1. **Unit Testing** (Developer responsibility) - Immediate feedback loop
2. **Integration Testing** (QA responsibility) - Validate module interactions
3. **Manual Testing** (Business Analyst + QA) - Verify business workflows
4. **Load/Performance Testing** (Before production) - Ensure scalability
5. **Security Testing** (Ongoing) - Identify vulnerabilities

### Next Steps
- [ ] Set up Jest/Supertest environment for unit tests
- [ ] Create Postman collection with all test scenarios
- [ ] Prepare staging database with test data
- [ ] Assign testing tasks to team members
- [ ] Schedule testing kickoff meeting
- [ ] Document actual results & sign-off

---

**Document Owner:** Business Analysis Team  
**Last Reviewed:** April 2026  
**Next Review:** May 2026 (Post-Release)
