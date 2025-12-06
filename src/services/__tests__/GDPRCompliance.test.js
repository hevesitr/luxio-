/**
 * GDPR Compliance Basic Tests
 */
import AccountService from '../AccountService';

jest.mock('../Logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('GDPR Compliance', () => {
  it('should export user data', async () => {
    const result = await AccountService.exportUserData('user123');
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('gdpr');
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
  });

  it('should handle right to erasure', async () => {
    const result = await AccountService.requestRightToErasure('user123');
    expect(result.success).toBe(true);
  });
});