# Bugfix: Profile Search Failed - Missing 'name' Column

## Problem
Console error: `Profile search failed: column profiles.name does not exist`

The app was trying to query a `name` column from the `profiles` table, but the actual column name is `full_name`.

## Root Cause
The database schema uses `full_name` as the column name, but several service files were referencing `name` instead.

## Files Fixed

### 1. **src/repositories/ProfileRepository.js**
- **Line 47-56**: Updated `findByFilters()` select statement
  - Changed: `name` → `full_name`
  - Removed non-existent columns: `city`, `last_active`
  - Added correct columns: `avatar_url`, `updated_at`

- **Line 195-210**: Updated `transformProfile()` method
  - Maps `full_name` to `name` in the returned object
  - Maps `avatar_url` to `avatarUrl`
  - Maps `updated_at` to `updatedAt`

- **Line 220-235**: Updated `calculateProfileCompleteness()` method
  - Changed field references from `name` to `full_name`
  - Removed non-existent fields: `city`, `location`
  - Added correct fields: `avatar_url`, `gender`

- **Line 161-180**: Updated `findNearby()` method
  - Changed location fields from `profile.location.latitude/longitude` to `profile.latitude/longitude`
  - Updated select statement to use correct column names

### 2. **src/services/MessagingService.js**
- **Line 164-165**: Updated message sender/receiver profile selection
  - Changed: `name` → `full_name`

- **Line 337**: Updated typing indicators profile selection
  - Changed: `name` → `full_name`

### 3. **src/services/AccountService.js**
- **Line 706**: Updated `getUserData()` select statement
  - Changed: `name` → `full_name`

## Database Schema Reference
The `profiles` table has these columns:
- `id` (uuid, primary key)
- `email` (text)
- `full_name` (text) ← **NOT** `name`
- `gender` (text)
- `birth_date` (date)
- `looking_for` (text[])
- `phone` (text)
- `bio` (text)
- `interests` (text[])
- `avatar_url` (text)
- `consent_*` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- Plus extended columns from `schema_extended.sql`

## Testing
After these changes:
1. Profile search should work without errors
2. Profile data should be correctly retrieved and transformed
3. Messaging should display sender/receiver names correctly
4. User data export should include full_name

## Verification
Run this SQL in Supabase to verify the schema:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles' 
ORDER BY ordinal_position;
```

All queries now use the correct column names from the actual database schema.
