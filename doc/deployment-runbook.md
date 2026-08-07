# Exnoria Deployment Runbook

This document provides the necessary configuration and integration steps to deploy the Exnoria Agentic Engine.

## Infrastructure Setup

### Environment Variables

Ensure the following variables are set in your `.env` file (see `.env.example` for full list).

## Integration Guides

### PostHog Identity Mapping (B3)

**Convention:** `distinct_id` in PostHog must map 1:1 to the internal `contact_id`.

#### When to call identify

Call `identify` immediately after a user authenticates (login, session restore, or SSO callback), passing their `contact_id` as the `distinct_id`.

**Web (JavaScript SDK)**

```javascript
posthog.identify(contact_id, {
  email: user.email,
  name: user.name,
  // any other person properties
});
```

**Backend (Python SDK)**

```python
posthog.capture(
    distinct_id=contact_id,
    event="$identify",
    properties={"$set": {"email": user.email}}
)
```

#### Key Rules

1. **Use contact_id as distinct_id** — never email, username, or a session token. This ensures stable mapping across web, mobile, and backend.
2. **Call identify once per session** — exclusively on login or session hydration.
3. **Consistent IDs** — server-side events must use the same `contact_id` for correct event stitching.
4. **Call reset() on logout** — clears the local identity to prevent anonymous events after logout from being merged: `posthog.reset();`

#### Verification Checklist (Post-Deploy)

- [ ] Frontend SDK: `posthog.identify()` called with `contact_id` on login.
- [ ] Backend SDK: Server-side events use same `contact_id` as `distinct_id`.
- [ ] Test contact exists in PostHog with `distinct_id` matching HubSpot contact ID.
- [ ] Cognitive tool `posthog_get_contact_events` returns events for a test contact.
- [ ] Logout flow calls `posthog.reset()`.

---

For deeper context on cross-platform identity strategy, see the [PostHog identity resolution docs](https://posthog.com/docs/product-analytics/identity-resolution) and the [identify() API reference](https://posthog.com/docs/product-analytics/identify).
