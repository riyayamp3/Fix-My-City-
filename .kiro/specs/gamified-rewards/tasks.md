# Implementation Plan: Gamified Rewards (Impact Points)

## Overview

Implement the Impact Points system across the Node.js/Express backend and React Native citizen app. Tasks follow the layered architecture from the design: data models first, then the points engine and tier logic, then API routes, then complaint controller hooks, and finally the citizen app screens.

## Tasks

- [x] 1. Add `PointsLedger` model and extend `Complaint` model
  - [x] 1.1 Create `backend/models/PointsLedger.js` with the schema defined in the design
    - Fields: `citizenId` (ObjectId, indexed), `points` (Number), `reason` (String), `referenceId` (ObjectId), `createdAt` (Date, indexed)
    - Add unique compound index on `{ citizenId, referenceId, reason }`
    - Export as a Mongoose model
    - _Requirements: 1.4, 2.2_
  - [x] 1.2 Add `upvotedBy` field to `backend/models/Complaint.js`
    - Append `upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }]` to the existing schema
    - _Requirements: 2.1, 2.3_
  - [ ]* 1.3 Write property test for ledger entry schema invariant (Property 3)
    - **Property 3: Ledger entry schema invariant**
    - **Validates: Requirements 1.4, 2.2**
    - File: `backend/__tests__/rewards.property.test.js`
    - For any award event, assert the resulting ledger entry always contains all 5 required fields with correct types

- [x] 2. Implement `Tier_Calculator` service
  - [x] 2.1 Create `backend/services/tierCalculator.js`
    - Export `calculateTier(totalPoints)` returning `'BRONZE' | 'SILVER' | 'GOLD'`
    - Thresholds: 0–199 → BRONZE, 200–499 → SILVER, ≥500 → GOLD
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ]* 2.2 Write property test for tier assignment correctness (Property 8)
    - **Property 8: Tier assignment correctness**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - File: `backend/__tests__/rewards.property.test.js`
    - For any integer `n ≥ 0`, assert `calculateTier(n)` returns the correct tier with no gaps or overlaps
  - [ ]* 2.3 Write unit tests for `calculateTier` boundary values
    - File: `backend/__tests__/rewards.unit.test.js`
    - Test values: 0, 199, 200, 499, 500
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Implement `Impact_Points_Engine` service
  - [x] 3.1 Create `backend/services/impactPointsEngine.js`
    - Export `awardPoints(citizenId, points, reason, referenceId)` — creates a ledger entry after idempotency check using the unique compound index; swallows duplicate-key errors silently
    - Export `getTotalPoints(citizenId)` — aggregates sum of `points` from ledger
    - Export `getLedger(citizenId, limit)` — returns entries sorted by `createdAt` descending, capped at `limit`
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 5.1, 5.2_
  - [ ]* 3.2 Write property test for point award idempotency (Property 4)
    - **Property 4: Point award idempotency**
    - **Validates: Requirements 1.5**
    - File: `backend/__tests__/rewards.property.test.js`
    - Calling `awardPoints` N times with the same `(citizenId, referenceId, reason)` must always result in exactly 1 ledger entry
  - [ ]* 3.3 Write property test for verified complaint awarding 10 points (Property 1)
    - **Property 1: Verified complaint awards exactly 10 points**
    - **Validates: Requirements 1.1**
    - File: `backend/__tests__/rewards.property.test.js`
    - For any citizenId + complaintId, `awardPoints` with `COMPLAINT_VERIFIED` creates exactly one entry with `points = 10`
  - [ ]* 3.4 Write property test for completed complaint awarding 20 points (Property 2)
    - **Property 2: Completed complaint awards exactly 20 points**
    - **Validates: Requirements 1.2**
    - File: `backend/__tests__/rewards.property.test.js`
    - For any citizenId + complaintId, `awardPoints` with `COMPLAINT_COMPLETED` creates exactly one entry with `points = 20`
  - [ ]* 3.5 Write unit test for FLAGGED complaint — no ledger entry created
    - File: `backend/__tests__/rewards.unit.test.js`
    - Assert that when `verificationStatus` is `FLAGGED`, `awardPoints` is never called
    - _Requirements: 1.3_

- [x] 4. Implement `RewardHook` stub
  - [x] 4.1 Create `backend/services/rewardHook.js`
    - Export `triggerRedemption(citizenId, rewardId)` returning `{ status: 'NOT_IMPLEMENTED' }`
    - _Requirements: 7.2, 7.3_
  - [ ]* 4.2 Write unit test for `RewardHook.triggerRedemption`
    - File: `backend/__tests__/rewards.unit.test.js`
    - Assert return value is `{ status: 'NOT_IMPLEMENTED' }` for any input
    - _Requirements: 7.2_

- [x] 5. Checkpoint — Ensure all backend service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement `rewardsController` and `rewardsRoutes`
  - [x] 6.1 Create `backend/controllers/rewardsController.js` with four handlers
    - `getMyRewards(req, res)` — calls `getTotalPoints`, `getLedger(50)`, `calculateTier`; returns `{ totalPoints, tier, ledger }`
    - `getLeaderboard(req, res)` — aggregates top 20 citizens by total points from ledger, joins username from User, returns array of `{ username, totalPoints, tier }`
    - `upvoteComplaint(req, res)` — validates self-upvote (403) and duplicate upvote (409) using `upvotedBy`; atomically pushes to `upvotedBy` via `$addToSet`; calls `awardPoints` with `UPVOTE_CAST` and 5 points
    - `redeemReward(req, res)` — always returns HTTP 501 with `{ message: 'Reward redemption is coming soon.' }`
    - _Requirements: 2.3, 2.4, 4.1, 4.2, 6.1, 7.1_
  - [x] 6.2 Create `backend/routes/rewardsRoutes.js`
    - Mount all four handlers under `/api/rewards` with the existing `protect` middleware
    - Routes: `GET /me`, `GET /leaderboard`, `POST /upvote/:complaintId`, `POST /redeem`
    - _Requirements: 4.2, 6.1, 7.1_
  - [x] 6.3 Register `rewardsRoutes` in `backend/server.js`
    - Import and mount: `app.use('/api/rewards', rewardsRoutes)`
    - _Requirements: 4.2_
  - [ ]* 6.4 Write property test for profile response schema (Property 10)
    - **Property 10: Profile response schema**
    - **Validates: Requirements 4.1, 4.2**
    - File: `backend/__tests__/rewards.property.test.js`
    - For any authenticated citizen, `GET /api/rewards/me` always returns `{ totalPoints, tier, ledger }`
  - [ ]* 6.5 Write property test for tier consistency with ledger sum (Property 9)
    - **Property 9: Tier consistency with ledger sum**
    - **Validates: Requirements 3.4, 3.5**
    - File: `backend/__tests__/rewards.property.test.js`
    - For any ledger state, `tier` and `totalPoints` in the response always equal `calculateTier(sum)` and `sum`
  - [ ]* 6.6 Write property test for ledger ordering and cap (Property 11)
    - **Property 11: Ledger ordering and cap**
    - **Validates: Requirements 5.1, 5.2**
    - File: `backend/__tests__/rewards.property.test.js`
    - For any citizen with k entries, returned ledger is sorted descending and length ≤ 50
  - [ ]* 6.7 Write property test for leaderboard ranking correctness (Property 12)
    - **Property 12: Leaderboard ranking correctness**
    - **Validates: Requirements 6.1**
    - File: `backend/__tests__/rewards.property.test.js`
    - For any citizen set, leaderboard is sorted descending by `totalPoints`, length ≤ 20, all entries have required fields
  - [ ]* 6.8 Write unit test for `POST /api/rewards/redeem` always returning 501
    - File: `backend/__tests__/rewards.unit.test.js`
    - _Requirements: 7.1_
  - [ ]* 6.9 Write unit test for `GET /api/rewards/me` with zero ledger entries
    - File: `backend/__tests__/rewards.unit.test.js`
    - Assert response shape is `{ totalPoints: 0, tier: 'BRONZE', ledger: [] }`
    - _Requirements: 4.1, 4.2_

- [x] 7. Hook point awards into `complaintController`
  - [x] 7.1 Modify `updateComplaintStatus` in `backend/controllers/complaintController.js`
    - After a successful `findByIdAndUpdate`, if the new `status === 'COMPLETED'`, call `awardPoints(complaint.userId, 20, 'COMPLAINT_COMPLETED', complaint._id)` in a non-fatal try/catch (log error, do not fail the response)
    - _Requirements: 1.2_
  - [x] 7.2 Add `updateVerificationStatus` handler to `backend/controllers/complaintController.js`
    - Accepts `PATCH /api/complaints/:id/verification` with body `{ verificationStatus }`
    - Valid values: `VERIFIED`, `FLAGGED`, `UNVERIFIED`
    - If transitioning to `VERIFIED`, call `awardPoints(complaint.userId, 10, 'COMPLAINT_VERIFIED', complaint._id)` in a non-fatal try/catch
    - If transitioning to `FLAGGED`, do not award points
    - Register this route in `backend/routes/complaintRoutes.js`
    - _Requirements: 1.1, 1.3_
  - [ ]* 7.3 Write property test for upvote awarding 5 points (Property 5)
    - **Property 5: Upvote awards exactly 5 points**
    - **Validates: Requirements 2.1**
    - File: `backend/__tests__/rewards.property.test.js`
    - For any citizen A ≠ complaint owner, upvote creates exactly one entry with `points = 5`
  - [ ]* 7.4 Write property test for duplicate upvote rejected with 409 (Property 6)
    - **Property 6: Duplicate upvote rejected with 409**
    - **Validates: Requirements 2.3**
    - File: `backend/__tests__/rewards.property.test.js`
    - A second `POST /api/rewards/upvote/:id` always returns 409 and no additional ledger entry is created
  - [ ]* 7.5 Write property test for self-upvote rejected with 403 (Property 7)
    - **Property 7: Self-upvote rejected with 403**
    - **Validates: Requirements 2.4**
    - File: `backend/__tests__/rewards.property.test.js`
    - For any citizen upvoting their own complaint, always returns 403 and no ledger entry is created
  - [ ]* 7.6 Write unit test for complaint status update to COMPLETED triggering point award
    - File: `backend/__tests__/rewards.unit.test.js`
    - Assert `awardPoints` is called with correct args when status transitions to `COMPLETED`
    - Assert complaint update still succeeds if `awardPoints` throws
    - _Requirements: 1.2_

- [x] 8. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Add rewards API calls to citizen app `services/api.js`
  - [x] 9.1 Extend `PVG IH/FixMyCityCitizen_App/FixMyCityCitizen_App/services/api.js`
    - Add a `rewards` namespace to the exported `api` object:
      ```js
      rewards: {
        getMe: () => api.get('/rewards/me'),
        getLeaderboard: () => api.get('/rewards/leaderboard'),
        upvote: (complaintId) => api.post(`/rewards/upvote/${complaintId}`),
        redeem: (body) => api.post('/rewards/redeem', body),
      }
      ```
    - _Requirements: 4.2, 6.1, 7.1_

- [x] 10. Implement `TierBadge` component
  - [x] 10.1 Create `PVG IH/FixMyCityCitizen_App/FixMyCityCitizen_App/components/TierBadge.jsx`
    - Accepts `tier` prop (`'BRONZE' | 'SILVER' | 'GOLD'`)
    - Renders a styled `View` + `Text` with tier-specific background colour: Bronze `#CD7F32`, Silver `#C0C0C0`, Gold `#FFD700`
    - _Requirements: 4.4_

- [x] 11. Implement citizen app profile rewards section
  - [x] 11.1 Create `PVG IH/FixMyCityCitizen_App/FixMyCityCitizen_App/app/profile.jsx` (or extend existing profile screen if one exists)
    - On mount, call `api.rewards.getMe()` and store `{ totalPoints, tier, ledger }` in state
    - Render `TierBadge` with the current tier
    - Render total points as a numeric display
    - Render a `FlatList` of ledger entries showing `reason`, `points`, and `createdAt` for each
    - Handle loading and error states
    - _Requirements: 4.3, 4.4, 5.3_

- [x] 12. Implement citizen app leaderboard screen
  - [x] 12.1 Create `PVG IH/FixMyCityCitizen_App/FixMyCityCitizen_App/app/leaderboard.jsx`
    - On mount, call `api.rewards.getLeaderboard()` and store the array in state
    - Render a ranked `FlatList` with rank number, username, `TierBadge`, and total points per row
    - Highlight the authenticated user's own row (compare username from stored auth token/context)
    - Handle loading and error states
    - _Requirements: 6.1, 6.3_

- [x] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` with `{ numRuns: 100 }` following the existing pattern in `backend/__tests__/analyzeImage.property.test.js`
- Point failures in `awardPoints` are non-fatal — complaint updates must always succeed even if the rewards subsystem throws
- The `upvotedBy` duplicate check uses MongoDB's `$addToSet` semantics; the unique compound index on `PointsLedger` is the idempotency backstop
- Tier is always derived at query time from the ledger sum — it is never stored on the User document
