# Requirements Document

## Introduction

The Gamified Rewards feature introduces an "Impact Points" system into the FixMyCity citizen app. Citizens earn points for civic actions — reporting issues that get verified and resolved, and upvoting/confirming nearby issues reported by others. Points accumulate on a tiered ladder (Bronze → Silver → Gold), giving citizens a sense of progress and recognition. The system is designed to be future-ready, with hooks for real-world reward redemption once partnerships are established.

## Glossary

- **Citizen**: A user with role `CITIZEN` in the FixMyCity platform.
- **Impact_Points_Engine**: The backend service responsible for calculating, awarding, and storing Impact Points.
- **Points_Ledger**: The append-only log of point transactions associated with a Citizen's account.
- **Tier_Calculator**: The component that derives a Citizen's current tier from their total Impact Points.
- **Rewards_API**: The backend REST API exposing Impact Points and tier data to the citizen app.
- **Citizen_App**: The React Native mobile application used by Citizens.
- **Complaint**: A civic issue report submitted by a Citizen, as represented by the `Complaint` MongoDB model.
- **Upvote**: A Citizen's confirmation that a nearby Complaint is valid and observed.
- **Tier**: A named rank assigned to a Citizen based on cumulative Impact Points. Valid values: `BRONZE`, `SILVER`, `GOLD`.
- **Reward_Hook**: A placeholder integration point in the system reserved for future real-world reward redemption.

---

## Requirements

### Requirement 1: Award Points for Verified and Resolved Complaints

**User Story:** As a Citizen, I want to earn Impact Points when my reported issue is verified and resolved, so that my civic contributions are recognised and rewarded.

#### Acceptance Criteria

1. WHEN a Complaint's `verificationStatus` transitions to `VERIFIED`, THE Impact_Points_Engine SHALL award 10 Impact Points to the Citizen who submitted the Complaint.
2. WHEN a Complaint's `status` transitions to `COMPLETED`, THE Impact_Points_Engine SHALL award 20 Impact Points to the Citizen who submitted the Complaint.
3. WHEN a Complaint's `verificationStatus` transitions to `FLAGGED`, THE Impact_Points_Engine SHALL award 0 Impact Points for that Complaint.
4. THE Impact_Points_Engine SHALL record each point award as an entry in the Points_Ledger with fields: `citizenId`, `points`, `reason`, `referenceId` (Complaint ObjectId), and `createdAt`.
5. IF the same Complaint triggers the same point event more than once (e.g. duplicate status transition), THEN THE Impact_Points_Engine SHALL award points only once per event per Complaint.

---

### Requirement 2: Award Points for Upvoting Nearby Issues

**User Story:** As a Citizen, I want to earn Impact Points when I upvote a nearby issue, so that I am encouraged to confirm real problems in my community.

#### Acceptance Criteria

1. WHEN a Citizen submits an Upvote on a Complaint that is not their own, THE Impact_Points_Engine SHALL award 5 Impact Points to that Citizen.
2. THE Impact_Points_Engine SHALL record each upvote point award in the Points_Ledger with fields: `citizenId`, `points`, `reason`, `referenceId` (Complaint ObjectId), and `createdAt`.
3. IF a Citizen attempts to Upvote the same Complaint more than once, THEN THE Rewards_API SHALL reject the request with HTTP 409 and return an error message indicating the Complaint has already been upvoted by that Citizen.
4. IF a Citizen attempts to Upvote their own Complaint, THEN THE Rewards_API SHALL reject the request with HTTP 403 and return an error message indicating self-upvoting is not permitted.

---

### Requirement 3: Tier Calculation

**User Story:** As a Citizen, I want to see my current tier (Bronze, Silver, or Gold) based on my total Impact Points, so that I have a clear sense of my standing in the community.

#### Acceptance Criteria

1. THE Tier_Calculator SHALL assign the `BRONZE` tier to a Citizen with a total Impact Points balance between 0 and 199 (inclusive).
2. THE Tier_Calculator SHALL assign the `SILVER` tier to a Citizen with a total Impact Points balance between 200 and 499 (inclusive).
3. THE Tier_Calculator SHALL assign the `GOLD` tier to a Citizen with a total Impact Points balance of 500 or above.
4. WHEN a Citizen's total Impact Points balance changes, THE Tier_Calculator SHALL recompute the Citizen's tier immediately.
5. THE Tier_Calculator SHALL derive the total Impact Points balance by summing all entries in the Citizen's Points_Ledger.

---

### Requirement 4: Citizen Profile — Points and Tier Display

**User Story:** As a Citizen, I want to view my total Impact Points and current tier in the app, so that I can track my progress at any time.

#### Acceptance Criteria

1. WHEN a Citizen requests their profile data, THE Rewards_API SHALL return the Citizen's total Impact Points balance and current tier in the response.
2. THE Rewards_API SHALL expose a `GET /api/rewards/me` endpoint that returns `{ totalPoints, tier, ledger }` for the authenticated Citizen.
3. WHILE a Citizen is authenticated, THE Citizen_App SHALL display the Citizen's total Impact Points and tier badge on the profile screen.
4. THE Citizen_App SHALL render the tier badge using a distinct visual style for each tier: bronze-coloured for `BRONZE`, silver-coloured for `SILVER`, and gold-coloured for `GOLD`.

---

### Requirement 5: Points Ledger History

**User Story:** As a Citizen, I want to see a history of how I earned my points, so that I can understand which actions contributed to my score.

#### Acceptance Criteria

1. THE Rewards_API SHALL expose a `GET /api/rewards/me` endpoint that includes a `ledger` array in the response, ordered by `createdAt` descending.
2. WHEN the Points_Ledger contains more than 50 entries for a Citizen, THE Rewards_API SHALL return only the 50 most recent entries in the `ledger` array.
3. THE Citizen_App SHALL display the ledger entries on the profile screen, showing `reason`, `points`, and `createdAt` for each entry.

---

### Requirement 6: Leaderboard

**User Story:** As a Citizen, I want to see how my Impact Points compare to other Citizens in my city, so that I feel motivated to stay engaged.

#### Acceptance Criteria

1. THE Rewards_API SHALL expose a `GET /api/rewards/leaderboard` endpoint that returns the top 20 Citizens ranked by total Impact Points, including `username`, `totalPoints`, and `tier` for each entry.
2. WHEN a Citizen requests the leaderboard, THE Rewards_API SHALL respond within 500ms under normal load.
3. THE Citizen_App SHALL display the leaderboard as a ranked list, highlighting the authenticated Citizen's own entry if it appears in the top 20.

---

### Requirement 7: Future-Ready Reward Hook

**User Story:** As a product owner, I want the system to include a hook for real-world reward redemption, so that we can integrate partner rewards in a future release without rearchitecting the backend.

#### Acceptance Criteria

1. THE Rewards_API SHALL expose a `POST /api/rewards/redeem` endpoint that accepts `{ rewardId, citizenId }` and returns HTTP 501 (Not Implemented) with a message indicating the feature is coming soon.
2. THE Impact_Points_Engine SHALL include a `RewardHook` interface with a `triggerRedemption(citizenId, rewardId)` method that is callable but returns a `NOT_IMPLEMENTED` status, so that future integrations can replace the stub without changing the calling code.
3. WHERE a real-world reward integration is configured, THE Impact_Points_Engine SHALL invoke the `RewardHook` during redemption without requiring changes to the Points_Ledger or Tier_Calculator logic.
