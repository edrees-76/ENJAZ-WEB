# Code Review Report: Complete System Review

**Reviewed:** 2026-04-20  
**Depth:** Comprehensive  
**Status:** issues_found

---

## Summary

Comprehensive review of the entire system (backend + frontend + sync infrastructure). Identified **110 issues** across all components with **30 high severity** issues requiring immediate attention.

---

## Backend Controllers (41 issues)

### Critical Findings

| Priority | Issue | Location | Fix |
|----------|-------|----------|-----|
| **HIGH** | Dashboard API has NO authorization - completely public | DashboardController.cs:9-10 | Uncomment `[Authorize]` |
| **HIGH** | Auth uses AccessToken as RefreshToken | AuthController.cs:51 | Use `response.RefreshToken` |
| **HIGH** | IDOR - No ownership checks on certificates/samples | CertificatesController.cs:56-68, SamplesController.cs:70-83 | Add ownership validation |
| **HIGH** | Path traversal risk in reports filename | ReportsController.cs:112,147-149 | Sanitize filename |
| **HIGH** | Stack traces exposed in production errors | Multiple controllers | Return generic messages |
| **HIGH** | No input validation on required fields | CertificatesController.cs:73-130 | Add explicit validation |

### Medium Issues (18)
- Missing null checks on `CertificateType.Contains()` calls
- No pagination on GET endpoints
- Race conditions in sequence generation
- Inconsistent error response formats
- Cookie path mismatches

### Low Issues (9)
- DateTime.Now vs UtcNow inconsistencies
- Magic numbers scattered
- Duplicate code in date validation

---

## Backend Services (20 issues)

### Critical Findings

| Priority | Issue | Location | Fix |
|----------|-------|----------|-----|
| **HIGH** | **HARDCODED BACKDOOR PASSWORD** | UserService.cs:237 | REMOVE IMMEDIATELY |
| **HIGH** | Race condition in certificate number generation | CertificateService.cs:50-68 | Add Serializable isolation |
| **HIGH** | NullReferenceException risk | CertificateService.cs:41, ReportService.cs:51-52 | Add null checks |
| **HIGH** | CacheService.RemoveByPrefixAsync is a no-op | CacheService.cs:92-99 | Implement or document |
| **HIGH** | Inefficient queries loading all data | ReportService.cs:37-63 | Use SQL aggregation |

### Medium Issues (7)
- Password upgrade not atomic with login
- Missing transaction in token refresh
- Non-atomic user update + audit log

### Low Issues (5)
- Magic numbers for token expiration
- Code duplication in projections

---

## Frontend Stores (27 issues)

### Critical Findings

| Priority | Issue | Location | Fix |
|----------|-------|----------|-----|
| **HIGH** | Memory leak - BroadcastChannel never closed | useCertificateStore.ts:9-18 | Add cleanup function |
| **HIGH** | Memory leak - same in useSampleStore | useSampleStore.ts:8-18 | Add cleanup function |
| **HIGH** | Race condition - no request cancellation | useCertificateStore.ts:105-143 | Add AbortController |
| **HIGH** | Duplicate BroadcastChannel instances | All 3 stores | Create shared module |
| **HIGH** | Stale auth state after token expiry | useAuthStore.ts:129-135 | Validate on rehydrate |
| **HIGH** | Global event listeners never cleaned | useSyncStore.ts:52-64 | Export cleanup |

### Medium Issues (10)
- Type safety: excessive `any` usage
- No retry on token refresh
- Loose equality operators
- Silent reconcile failures

### Low Issues (7)
- Console.log in production
- Magic numbers
- Dead code (mockReceptions)

---

## Sync Infrastructure (22 issues)

### Critical Findings

| Priority | Issue | Location | Fix |
|----------|-------|----------|-----|
| **HIGH** | Race condition - no atomic status update | engine.ts:64-75 | Add atomic transition |
| **HIGH** | Infinite retry loop - no max limit | engine.ts:58-63 | Add MAX_RETRIES |
| **HIGH** | Leadership election uses wrong comparison | leader.ts:19-25 | Use numeric priority |
| **HIGH** | Silent failure on missing ID mapping | resolver.ts:14-19 | Throw error instead |
| **HIGH** | No freshness validation before execution | executor.ts:8-22 | Re-fetch before execute |

### Medium Issues (8)
- Network vs server error not distinguished
- 409 conflicts not handled
- No timeout on API calls
- No graceful leadership transfer

### Low Issues (6)
- Hardcoded timing constants
- Console logging in production

---

## Overall Findings Summary

| Component | High | Medium | Low | Total |
|-----------|------|--------|-----|-------|
| Backend Controllers | 6 | 18 | 9 | 33 |
| Backend Services | 5 | 7 | 5 | 17 |
| Frontend Stores | 6 | 10 | 7 | 23 |
| Sync Infrastructure | 5 | 8 | 6 | 19 |
| **TOTAL** | **22** | **43** | **27** | **92** |

---

## Critical Priority Fixes (Immediate Action)

1. **REMOVE HARDCODED BACKDOOR** - UserService.cs line 237
2. **Uncomment [Authorize]** - DashboardController.cs
3. **Fix access token vs refresh token** - AuthController.cs line 51
4. **Add ownership/authorization checks** - All data endpoints
5. **Fix race conditions** - Certificate numbering, sync execution
6. **Add memory leak fixes** - BroadcastChannel cleanup
7. **Fix leadership election** - leader.ts string comparison

---

## Positive Patterns Noted

- Strong audit logging in backend
- Good validation in CertificateFormModal
- Proper use of EF Core parameterized queries
- Offline-first architecture with sync queue
- Good use of Arabic error messages

---

_Reviewed: 2026-04-20_
_Depth: Comprehensive_
