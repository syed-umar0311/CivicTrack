# Security Specification for CitizenConnect Pakistan

## Data Invariants
1. A user profile MUST match the authenticated user's UID.
2. A complaint MUST have a valid category from the allowed list.
3. Only admins can update the `status` and `adminComment` of a complaint.
4. Users can only see their own complaints, while admins can see all complaints.
5. Users can only update their own complaints if they are in 'Pending' status (limited fields).
6. Complaints are immutable once 'Resolved' (except for admins).

## The "Dirty Dozen" Payloads (Deny List)
1. **Identity Spoofing:** Create user profile with UID "A" while authenticated as "B".
2. **Role Escalation:** Resident tries to create a profile with `role: "admin"`.
3. **Ghost Admin:** Resident tries to add their UID to the `admins` collection.
4. **Illegal Category:** Submit complaint with `category: "illegal_type"`.
5. **Unauthorized Status Change:** Resident tries to change status from `Pending` to `Resolved`.
6. **Data Injection:** Huge description string (e.g. 2MB) to cause "Denial of Wallet".
7. **Orphaned Complaint:** Submit complaint with a `userId` that doesn't match authenticated user.
8. **Shadow Field:** Update complaint with `is_verified: true` (a field not in schema).
9. **Resolved Lockout:** Resident tries to edit a 'Resolved' complaint.
10. **Admin Comment Hijack:** Resident tries to set or change `adminComment`.
11. **Spoofed Timestamp:** User submits `createdAt` as a fixed past date instead of `request.time`.
12. **Blind List Access:** Unauthenticated user tries to list all complaints.

## Firebase Security Rules Draft (Planned Patterns)
- Use `isValidUser()`, `isValidComplaint()`, `isValidAdmin()` helpers.
- Use `isAdmin()` check via `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`.
- Use `affectedKeys().hasOnly()` for granular update control.
- Use `request.time` for all timestamps.
