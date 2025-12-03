# Requirements Document

## Introduction

This specification defines the requirements for integrating Supabase as the backend database and real-time messaging system for the Luxio dating application. The integration replaces local-only data storage with a cloud-based solution that enables persistent data storage, real-time messaging, user profile management, match tracking, and media file storage. The system must maintain offline functionality while providing seamless synchronization when online.

## Glossary

- **Supabase**: An open-source Firebase alternative providing PostgreSQL database, authentication, storage, and real-time subscriptions
- **Match System**: The core dating app functionality where mutual likes between users create a match
- **Profile Service**: Service layer managing user profile data including photos, bio, preferences, and personal information
- **Message Service**: Service layer handling text, voice, and video messages between matched users
- **RLS (Row Level Security)**: PostgreSQL security feature that restricts database access based on user authentication
- **Real-time Subscription**: WebSocket-based connection that pushes database changes to clients instantly
- **Storage Bucket**: Cloud storage container for media files (images, videos, audio)
- **Offline Sync**: Mechanism to queue operations when offline and synchronize when connection is restored
- **Luxio App**: The React Native dating application being developed

## Requirements

### Requirement 1: Database Schema Setup

**User Story:** As a system administrator, I want to set up the complete database schema in Supabase, so that all application data can be stored persistently and securely.

#### Acceptance Criteria

1. WHEN the schema SQL script is executed THEN the System SHALL create the profiles table with columns for user data including photos, avatar_url, bio, age, height, relationship_goal, interests, education, job_title, location coordinates, verification status, and premium status
2. WHEN the schema SQL script is executed THEN the System SHALL create the matches table with user_id, matched_user_id, matched_at timestamp, and status fields
3. WHEN the schema SQL script is executed THEN the System SHALL create the likes table tracking user_id and liked_user_id relationships
4. WHEN the schema SQL script is executed THEN the System SHALL create the passes table tracking user_id and passed_user_id relationships
5. WHEN the schema SQL script is executed THEN the System SHALL create the messages table with match_id, sender_id, content, type, is_read status, and timestamps

### Requirement 2: Profile Management Service

**User Story:** As a user, I want to create and update my dating profile with photos and personal information, so that other users can learn about me.

#### Acceptance Criteria

1. WHEN a user updates profile data THEN the ProfileService SHALL save changes to the Supabase profiles table and return success status
2. WHEN a user requests their profile THEN the ProfileService SHALL fetch profile data from Supabase by user ID
3. WHEN a user uploads a profile photo THEN the ProfileService SHALL upload the image to the avatars bucket and update the avatar_url in the profile

### Requirement 3: Match Management Service

**User Story:** As a user, I want my likes and matches to be saved to the cloud, so that I don't lose my connections when switching devices.

#### Acceptance Criteria

1. WHEN a user likes another profile THEN the SupabaseMatchService SHALL save the like to the likes table with user_id and liked_user_id
2. WHEN mutual likes are detected THEN the SupabaseMatchService SHALL create match records for both users in the matches table
3. WHEN a user requests their matches THEN the SupabaseMatchService SHALL fetch active matches with joined profile data

### Requirement 4: Real-time Messaging Service

**User Story:** As a user, I want to send and receive messages instantly with my matches, so that I can have real-time conversations.

#### Acceptance Criteria

1. WHEN a user sends a text message THEN the MessageService SHALL insert the message into the messages table with match_id, sender_id, content, and type
2. WHEN a new message is inserted THEN the MessageService SHALL broadcast the message to subscribed clients via real-time channel
3. WHEN a user subscribes to a chat THEN the MessageService SHALL listen for INSERT events on the messages table filtered by match_id
