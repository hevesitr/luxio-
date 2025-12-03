# Design Document

## Overview

The Supabase integration transforms the Luxio dating app from a local-only application to a cloud-connected system with persistent data storage, real-time messaging, and cross-device synchronization. The architecture follows a service-oriented pattern where dedicated service classes (ProfileService, SupabaseMatchService, MessageService) encapsulate all Supabase interactions.

## Architecture

### Service Layer Pattern
- ProfileService: Manages user profiles and photos
- SupabaseMatchService: Handles likes, passes, and match creation
- MessageService: Real-time messaging with text, voice, and video support
- Local Cache: AsyncStorage for offline access

### Data Flow
1. User action in UI → Screen component
2. Screen calls Service method
3. Service interacts with Supabase
4. Service updates local cache
5. Service returns result to Screen
6. Screen updates UI

## Components and Interfaces

### ProfileService
- `updateProfile(userId, updates)`: Update profile data
- `getProfile(userId)`: Fetch profile by ID
- `uploadProfilePhoto(userId, photoUri)`: Upload profile picture

### SupabaseMatchService
- `saveLike(userId, likedUserId)`: Save like and check for mutual match
- `getMatches(userId)`: Fetch user's active matches
- `syncMatchesToLocal(userId)`: Sync matches to local cache

### MessageService
- `sendMessage(matchId, senderId, content, type)`: Send message
- `getMessages(matchId, limit)`: Fetch message history
- `subscribeToMessages(matchId, callback)`: Real-time message subscription
- `unsubscribeFromMessages(subscription)`: Cleanup subscription

## Testing Strategy

Using fast-check library for property-based testing with 100+ iterations per test.
