/**
 * GDPR Compliance Basic Tests
 */
import AccountService from '../AccountService';

jest.mock('../Logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  success: jest.fn(),
}));

// Mock Supabase client
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn((table) => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              user_id: 'user123',
              analytics_consent: false,
              marketing_consent: false,
              necessary_cookies: true,
            },
            error: null
          })),
          maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        or: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'request123', user_id: 'user123', status: 'pending' },
            error: null
          }))
        }))
      })),
      upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        error: null
      }))
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/export.json' } }))
      }))
    }
  }
}));

describe('GDPR Compliance', () => {
  it('should export user data', async () => {
    const result = await AccountService.exportUserData('user123');
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('gdpr');
    expect(result.gdpr).toHaveProperty('exportDate');
    expect(result.gdpr).toHaveProperty('dataSubjectRights');
  });

  it('should update privacy settings', async () => {
    const result = await AccountService.updatePrivacySettings('user123', {
      analytics: true
    });
    expect(result.success).toBe(true);
  });

  it('should get privacy settings', async () => {
    const settings = await AccountService.getPrivacySettings('user123');
    expect(settings).toHaveProperty('analytics_consent');
    expect(settings).toHaveProperty('marketing_consent');
    expect(settings).toHaveProperty('necessary_cookies');
  });

  it('should handle right to erasure', async () => {
    const result = await AccountService.requestRightToErasure('user123');
    expect(result.success).toBe(true);
    expect(result).toHaveProperty('requestId');
    expect(result).toHaveProperty('scheduledDeletionDate');
  });
});