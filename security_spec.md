# Firebase Security Specification - AI Bakery

## 1. Data Invariants
- A `GameState` must belong to the authenticated user (`userId` matches `request.auth.uid`).
- `money` cannot be negative.
- `day` must be a positive integer.
- `shopLevel` must be at least 1.
- `updatedAt` must be set to the server time.
- Users can only read and write their own data.

## 2. The Dirty Dozen (Payloads to Reject)
1. **Identity Spoofing**: Creating a `GameState` with `userId` of another user.
2. **Infinite Money**: Setting `money` to a massive number without proper game logic.
3. **Negative Money**: Setting `money` to -999999.
4. **Time Travel**: Manually incrementing `day` to a future day without completing current tasks.
5. **Level Skip**: Setting `shopLevel` to 100 on day 1.
6. **Ghost Ingredient**: Adding an ingredient type that doesn't exist in the enum.
7. **Baking Cheat**: Setting `bakingStatus` progress to 100% instantly for all breads.
8. **Reputation Hack**: Setting `reputation` to 9999.
9. **Upgrade Cheat**: Setting all upgrades to max without spending money.
10. **Mission Completion Spoof**: Marking all `currentMissions` as `isCleared: true` manually.
11. **Shadow Update**: Adding a field `isAdmin: true` to the `User` profile.
12. **PII Leak**: A user trying to read another user's private info.

## 3. Test Runner (Draft)
I will implement `firestore.rules.test.ts` to verify these.
