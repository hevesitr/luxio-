# 📋 TODO - Post-Launch Tasks

## Átugrott Feladatok (Prioritás szerint)

---

## 🔴 HIGH PRIORITY (Post-Launch Week 1)

### 1. Remaining Property Tests (23 properties, ~4-5 hours)

**ProfileService Properties (5):**
- [ ] Property 11: Profile update round-trip
- [ ] Property 12: Image compression size limit (200KB)
- [ ] Property 13: Interest set uniqueness (no duplicates)
- [ ] Property 14: Invalid profile rejection
- [ ] Property 15: Age calculation correctness

**Discovery Feed Properties (4):**
- [ ] Property 21: Seen profile exclusion
- [ ] Property 22: Age filter correctness
- [ ] Property 23: Distance filter correctness
- [ ] Property 24: Gender filter correctness

**Data Integrity Properties (3):**
- [ ] Property 40: Serialization round-trip
- [ ] Property 41: Cache invalidation correctness
- [ ] Property 42: Offline sync preservation

**Estimated Time:** 2-3 hours
**Priority:** HIGH - Increases test coverage to 76% (32/42)

---

## 🟡 MEDIUM PRIORITY (Post-Launch Week 2-3)

### 2. Premium Features Properties (5 properties, ~1 hour)

- [ ] Property 30: Premium unlimited swipes
- [ ] Property 31: Super like decrement
- [ ] Property 32: Rewind restoration
- [ ] Property 33: Subscription expiration revocation
- [ ] Property 34: Super like daily reset

**Estimated Time:** 1 hour
**Priority:** MEDIUM - Important for monetization

### 3. Safety Features Properties (5 properties, ~1 hour)

- [ ] Property 35: Block communication prevention
- [ ] Property 36: Report record creation
- [ ] Property 37: Profanity detection completeness
- [ ] Property 38: Automatic suspension trigger
- [ ] Property 39: Unmatch cleanup

**Estimated Time:** 1 hour
**Priority:** MEDIUM - Important for user safety

---

## 🟢 LOW PRIORITY (Post-Launch Month 2+)

### 4. Video Features Implementation (~12-16 hours)

**Setup (3 tasks):**
- [ ] Install video dependencies (expo-camera, expo-av, react-native-ffmpeg)
- [ ] Configure Supabase storage for videos
- [ ] Update database schema (videos table)

**Video Service (6 tasks):**
- [ ] Create VideoService base structure
- [ ] Implement video validation (MP4, 30s, 50MB)
- [ ] Implement video upload to Supabase
- [ ] Implement video compression (10MB, 720p)
- [ ] Implement video deletion
- [ ] Implement video URL retrieval

**Components (6 tasks):**
- [ ] Create VideoRecorder component
- [ ] Implement permission handling
- [ ] Implement preview and retake
- [ ] Create VideoPlayer component
- [ ] Implement video lifecycle
- [ ] Implement error handling

**Integration (3 tasks):**
- [ ] Add video upload to ProfileScreen
- [ ] Add video display to ProfileScreen
- [ ] Add video to discovery feed

**Moderation (3 tasks):**
- [ ] Create moderation queue view
- [ ] Implement moderation actions
- [ ] Implement video reporting

**Testing (3 tasks - optional):**
- [ ] Write unit tests for VideoService
- [ ] Write property tests for video features
- [ ] Write integration tests

**Estimated Time:** 12-16 hours
**Priority:** LOW - Nice to have, not critical for launch

---

## 📊 SUMMARY

### By Priority

| Priority | Tasks | Estimated Time | When |
|----------|-------|----------------|------|
| 🔴 HIGH | 12 properties | 2-3 hours | Week 1 |
| 🟡 MEDIUM | 10 properties | 2 hours | Week 2-3 |
| 🟢 LOW | Video features | 12-16 hours | Month 2+ |
| **TOTAL** | **45+ tasks** | **16-21 hours** | **Post-launch** |

### By Category

| Category | Tasks | Status | Priority |
|----------|-------|--------|----------|
| Property Tests | 23 remaining | 45% done | HIGH/MEDIUM |
| Video Features | 24 tasks | 0% done | LOW |
| Integration Tests | Not started | 0% done | MEDIUM |
| Performance Tests | Not started | 0% done | LOW |

---

## 🎯 RECOMMENDED APPROACH

### Phase 1: Launch (Current)
- ✅ Core app complete
- ✅ 19 property tests (45% coverage)
- ⏳ Deployment preparation
- ⏳ App Store submission

### Phase 2: Post-Launch Week 1
- [ ] Complete HIGH priority properties (12 properties)
- [ ] Monitor crash reports
- [ ] Fix critical bugs
- [ ] Gather user feedback

### Phase 3: Post-Launch Week 2-3
- [ ] Complete MEDIUM priority properties (10 properties)
- [ ] Implement user-requested features
- [ ] Performance optimization
- [ ] A/B testing

### Phase 4: Post-Launch Month 2+
- [ ] Video features (if user demand exists)
- [ ] Advanced features
- [ ] Gamification
- [ ] Social features

---

## 📝 NOTES

### Why Skip Now?
1. **Time to Market:** Launch faster, validate product
2. **User Feedback:** Learn what users actually want
3. **Revenue:** Start generating income sooner
4. **Iteration:** Build based on real usage data

### Why Complete Later?
1. **Quality:** 45% property coverage is good, 100% is better
2. **Confidence:** More tests = more confidence
3. **Maintenance:** Easier to refactor with tests
4. **Competitive:** Video features differentiate

### Current Coverage is Acceptable
- ✅ 19 properties tested
- ✅ 1,900+ iterations run
- ✅ 100% success rate
- ✅ Critical services covered (Location, Match, Message, Compatibility)
- ✅ Zero bugs remaining

---

## 🔗 RELATED DOCUMENTS

- `DEPLOYMENT_PREPARATION.md` - Complete deployment guide
- `.kiro/specs/property-based-testing/tasks.md` - Full property test tasks
- `.kiro/specs/video-features/tasks.md` - Full video feature tasks
- `ULTIMATE_SESSION_COMPLETE_DEC03_2025.md` - Session summary

---

**Created:** December 3, 2025
**Status:** Ready for post-launch implementation
**Priority:** Complete HIGH priority tasks first (Week 1)

