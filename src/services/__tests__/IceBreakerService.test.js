/**
 * IceBreakerService Tests
 *
 * Tests for ice breaker questions and conversation starters
 */
import IceBreakerService from '../IceBreakerService';

describe('IceBreakerService', () => {
  describe('generateIceBreakers', () => {
    it('should generate ice breakers with common interests', () => {
      const userInterests = ['Utazás', 'Fotózás', 'Sport'];
      const matchInterests = ['Fotózás', 'Zene', 'Utazás'];

      const iceBreakers = IceBreakerService.generateIceBreakers(userInterests, matchInterests);

      expect(Array.isArray(iceBreakers)).toBe(true);
      expect(iceBreakers.length).toBeGreaterThanOrEqual(2); // At least interest + general

      // Check that common interests are used
      const interestBreakers = iceBreakers.filter(ib => ib.type === 'interest');
      expect(interestBreakers.length).toBeGreaterThan(0);

      // Check structure
      iceBreakers.forEach(breaker => {
        expect(breaker).toHaveProperty('type');
        expect(breaker).toHaveProperty('question');
        expect(breaker).toHaveProperty('icon');
      });
    });

    it('should generate ice breakers without common interests', () => {
      const userInterests = ['Utazás', 'Fotózás'];
      const matchInterests = ['Zene', 'Film'];

      const iceBreakers = IceBreakerService.generateIceBreakers(userInterests, matchInterests);

      expect(Array.isArray(iceBreakers)).toBe(true);
      expect(iceBreakers.length).toBeGreaterThanOrEqual(2);

      // Should still have general and fun questions
      const generalBreakers = iceBreakers.filter(ib => ib.type === 'general');
      const funBreakers = iceBreakers.filter(ib => ib.type === 'fun');

      expect(generalBreakers.length).toBeGreaterThan(0);
      expect(funBreakers.length).toBeGreaterThan(0);
    });

    it('should limit to 2 interest-based questions max', () => {
      const userInterests = ['Utazás', 'Fotózás', 'Sport', 'Zene', 'Főzés'];
      const matchInterests = ['Utazás', 'Fotózás', 'Sport', 'Zene', 'Főzés'];

      const iceBreakers = IceBreakerService.generateIceBreakers(userInterests, matchInterests);
      const interestBreakers = iceBreakers.filter(ib => ib.type === 'interest');

      expect(interestBreakers.length).toBeLessThanOrEqual(2);
    });

    it('should handle empty interests arrays', () => {
      const iceBreakers = IceBreakerService.generateIceBreakers([], []);

      expect(Array.isArray(iceBreakers)).toBe(true);
      expect(iceBreakers.length).toBeGreaterThan(0);

      // Should have general and fun questions
      const generalBreakers = iceBreakers.filter(ib => ib.type === 'general');
      const funBreakers = iceBreakers.filter(ib => ib.type === 'fun');

      expect(generalBreakers.length).toBeGreaterThan(0);
      expect(funBreakers.length).toBeGreaterThan(0);
    });
  });

  describe('generateDeeperQuestions', () => {
    it('should generate 3 deeper questions', () => {
      const questions = IceBreakerService.generateDeeperQuestions();

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBe(3);

      questions.forEach(question => {
        expect(question.type).toBe('deeper');
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('icon');
        expect(question.icon).toBe('💭');
      });
    });

    it('should return different questions on multiple calls', () => {
      const questions1 = IceBreakerService.generateDeeperQuestions();
      const questions2 = IceBreakerService.generateDeeperQuestions();

      // They might be the same due to randomization, but should have proper structure
      expect(questions1.length).toBe(3);
      expect(questions2.length).toBe(3);

      // At least check that they are from the deeper questions array
      questions1.forEach(q => {
        expect(IceBreakerService.deeperQuestions).toContain(q.question);
      });
    });
  });

  describe('getInterestIcon', () => {
    it('should return correct icons for known interests', () => {
      expect(IceBreakerService.getInterestIcon('Utazás')).toBe('✈️');
      expect(IceBreakerService.getInterestIcon('Fotózás')).toBe('📸');
      expect(IceBreakerService.getInterestIcon('Sport')).toBe('⚽');
      expect(IceBreakerService.getInterestIcon('Zene')).toBe('🎵');
      expect(IceBreakerService.getInterestIcon('Film')).toBe('🎬');
      expect(IceBreakerService.getInterestIcon('Gaming')).toBe('🎮');
    });

    it('should return default icon for unknown interests', () => {
      expect(IceBreakerService.getInterestIcon('Unknown')).toBe('💡');
      expect(IceBreakerService.getInterestIcon('')).toBe('💡');
    });
  });

  describe('getQuestionColor', () => {
    it('should return correct colors for question types', () => {
      expect(IceBreakerService.getQuestionColor('interest')).toBe('#FF3B75');
      expect(IceBreakerService.getQuestionColor('general')).toBe('#2196F3');
      expect(IceBreakerService.getQuestionColor('fun')).toBe('#FFC107');
      expect(IceBreakerService.getQuestionColor('deeper')).toBe('#9C27B0');
    });

    it('should return default color for unknown types', () => {
      expect(IceBreakerService.getQuestionColor('unknown')).toBe('#999');
      expect(IceBreakerService.getQuestionColor('')).toBe('#999');
    });
  });

  describe('constants', () => {
    it('should have questionTemplates for all supported interests', () => {
      const templates = IceBreakerService.questionTemplates;

      expect(templates).toHaveProperty('Utazás');
      expect(templates).toHaveProperty('Fotózás');
      expect(templates).toHaveProperty('Sport');
      expect(templates).toHaveProperty('Zene');
      expect(templates).toHaveProperty('Főzés');
      expect(templates).toHaveProperty('Olvasás');
      expect(templates).toHaveProperty('Film');
      expect(templates).toHaveProperty('Művészet');
      expect(templates).toHaveProperty('Természet');
      expect(templates).toHaveProperty('Gaming');

      // Each template should be an array of questions
      Object.values(templates).forEach(questions => {
        expect(Array.isArray(questions)).toBe(true);
        expect(questions.length).toBeGreaterThan(0);
        questions.forEach(question => {
          expect(typeof question).toBe('string');
          expect(question.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have generalQuestions array', () => {
      expect(Array.isArray(IceBreakerService.generalQuestions)).toBe(true);
      expect(IceBreakerService.generalQuestions.length).toBeGreaterThan(0);
    });

    it('should have deeperQuestions array', () => {
      expect(Array.isArray(IceBreakerService.deeperQuestions)).toBe(true);
      expect(IceBreakerService.deeperQuestions.length).toBeGreaterThan(0);
    });

    it('should have funQuestions array', () => {
      expect(Array.isArray(IceBreakerService.funQuestions)).toBe(true);
      expect(IceBreakerService.funQuestions.length).toBeGreaterThan(0);
    });
  });
});
