/**
 * AI Spark Service Tests
 *
 * Tests for the AI-powered personality match prediction
 */
import AISparkService from '../AISparkService';
import container from '../../core/DIContainer';

// Mock dependencies
jest.mock('../Logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  success: jest.fn()
}));

describe('AISparkService', () => {
  let aiSparkService;
  let mockRepository;
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      findById: jest.fn()
    };

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      success: jest.fn()
    };

    aiSparkService = new AISparkService(mockRepository, mockLogger);
  });

  describe('calculateSparkScore', () => {
    it('should calculate spark score successfully', async () => {
      const userProfile = {
        id: 'user1',
        prompts: [
          { question: 'Favorite hobby?', answer: 'Reading books and hiking' },
          { question: 'Weekend activity?', answer: 'Outdoor adventures' }
        ],
        interests: ['reading', 'hiking', 'nature'],
        values: ['honesty', 'adventure']
      };

      const targetProfile = {
        id: 'user2',
        prompts: [
          { question: 'Favorite hobby?', answer: 'Reading novels and mountain climbing' },
          { question: 'Weekend activity?', answer: 'Nature walks and books' }
        ],
        interests: ['reading', 'climbing', 'books'],
        values: ['honesty', 'exploration']
      };

      mockRepository.findById
        .mockResolvedValueOnce(userProfile)
        .mockResolvedValueOnce(targetProfile);

      const result = await aiSparkService.calculateSparkScore('user1', 'user2');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('score');
      expect(result.data).toHaveProperty('factors');
      expect(result.data).toHaveProperty('prediction');
      expect(result.data.score).toBeGreaterThanOrEqual(0);
      expect(result.data.score).toBeLessThanOrEqual(100);
    });

    it('should handle profiles without prompts', async () => {
      const userProfile = {
        id: 'user1',
        interests: ['music', 'art'],
        values: ['creativity']
      };

      const targetProfile = {
        id: 'user2',
        interests: ['music', 'painting'],
        values: ['artistic']
      };

      mockRepository.findById
        .mockResolvedValueOnce(userProfile)
        .mockResolvedValueOnce(targetProfile);

      const result = await aiSparkService.calculateSparkScore('user1', 'user2');

      expect(result.success).toBe(true);
      expect(result.data.score).toBeGreaterThan(0);
    });
  });

  describe('calculatePersonalityMatch', () => {
    it('should calculate personality compatibility', () => {
      const userPrompts = [
        { question: 'Q1', answer: 'I love adventure and new experiences' }
      ];

      const targetPrompts = [
        { question: 'Q1', answer: 'Adventure is my passion, trying new things' }
      ];

      const score = aiSparkService.calculatePersonalityMatch(userPrompts, targetPrompts);

      expect(score).toBeGreaterThan(20); // Should find some similarity
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return neutral score for no matching prompts', () => {
      const userPrompts = [{ question: 'Q1', answer: 'Answer 1' }];
      const targetPrompts = [{ question: 'Q2', answer: 'Answer 2' }]; // Different question

      const score = aiSparkService.calculatePersonalityMatch(userPrompts, targetPrompts);

      expect(score).toBe(50); // Neutral score
    });
  });

  describe('calculateInterestOverlap', () => {
    it('should calculate interest compatibility', () => {
      const userInterests = ['reading', 'hiking', 'music'];
      const targetInterests = ['reading', 'climbing', 'music'];

      const score = aiSparkService.calculateInterestOverlap(userInterests, targetInterests);

      expect(score).toBeGreaterThan(50); // Shared interests
    });

    it('should handle empty interest lists', () => {
      const score = aiSparkService.calculateInterestOverlap([], []);

      expect(score).toBe(30); // Low score for no interests
    });
  });

  describe('getPrediction', () => {
    it('should return high_match for high scores', () => {
      expect(aiSparkService.getPrediction(85)).toBe('high_match');
    });

    it('should return medium_match for medium scores', () => {
      expect(aiSparkService.getPrediction(70)).toBe('medium_match');
    });

    it('should return low_match for low scores', () => {
      expect(aiSparkService.getPrediction(45)).toBe('low_match');
    });

    it('should return unlikely_match for very low scores', () => {
      expect(aiSparkService.getPrediction(35)).toBe('unlikely_match');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await aiSparkService.calculateSparkScore('user1', 'user2');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Váratlan hiba');
    });
  });
});
