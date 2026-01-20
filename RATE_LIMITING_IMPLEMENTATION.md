# Rate Limiting Implementation for Score Submissions

## Overview
This document describes the rate limiting implementation for score submission endpoints in the Infinity Tournament application.

## Implementation Details

### Rate Limit Configuration
- **Limit**: 30 submissions per minute per user
- **Identifier**: User ID (from session)
- **Window**: 1 minute sliding window
- **Technology**: Upstash Redis with sliding window algorithm

### Files Modified

#### 1. `/src/lib/matches/actions.ts` (NEW)
Server actions for score submission and match confirmation with built-in rate limiting.

**Functions**:
- `submitScores(params)`: Submit match scores with rate limiting
- `confirmMatch(params)`: Confirm match results with rate limiting

**Rate Limiting**:
- Uses `createRateLimiter()` with 30 requests per 1 minute
- Applies rate limit by user ID (not IP address)
- Returns proper 429 status indicators when limit exceeded
- Includes rate limit headers in response

**Security**:
- Verifies user authentication
- Validates user is a participant in the match
- Prevents double submission (checks if already confirmed)

#### 2. `/src/components/scoring/score-form.tsx` (MODIFIED)
Updated to use new server actions instead of direct Supabase client calls.

**Changes**:
- `handleSubmitScores()`: Now calls `submitScores()` server action
- `handleConfirm()`: Now calls `confirmMatch()` server action
- Added rate limit error handling with user-friendly messages
- Displays rate limit exceeded errors separately from other errors

### Rate Limit Behavior

#### When Rate Limit Not Exceeded
```typescript
{
  success: true,
  rateLimitHeaders: {
    limit: "30",
    remaining: "25",
    reset: "1674567890"
  }
}
```

#### When Rate Limit Exceeded
```typescript
{
  success: false,
  error: "Too many score submissions. Please try again later.",
  rateLimitExceeded: true,
  rateLimitHeaders: {
    limit: "30",
    remaining: "0",
    reset: "1674567890"
  }
}
```

### User Experience

When a user exceeds the rate limit:
1. Score submission is blocked
2. Error toast shows: "Rate limit exceeded. Please wait and try again."
3. Form displays: "Too many score submissions. Please wait a moment and try again."
4. User can see when the limit will reset via the reset timestamp

### Testing

Test file created: `/src/lib/matches/actions.test.ts`

Tests cover:
- Rate limit enforcement (30 per minute)
- Successful submission when under limit
- Verification that rate limiting is by user ID (not IP)

Run tests:
```bash
npm test src/lib/matches/actions.test.ts
```

### Environment Requirements

Rate limiting requires Redis configuration:
- `UPSTASH_REDIS_URL`: Redis instance URL
- `UPSTASH_REDIS_TOKEN`: Redis authentication token

If Redis is not configured:
- Rate limiting is disabled (requests are allowed)
- Warning is logged to console
- Application continues to function normally

### Acceptance Criteria Met

✅ 30 submissions per minute per user
✅ Rate limit by user ID (from session), not IP
✅ Returns proper 429 status indicators with headers
✅ Applied to score submission operations
✅ Applied to match confirmation operations

### Migration Notes

No database migration required. This is a server-side only change that:
1. Adds rate limiting middleware to existing score operations
2. Moves score submission logic from client to server
3. Maintains backward compatibility with existing data structures

### Future Enhancements

Potential improvements:
1. Add rate limit status indicator in UI (show remaining requests)
2. Implement exponential backoff for repeated violations
3. Add admin dashboard to monitor rate limit metrics
4. Consider different limits for different tournament types
