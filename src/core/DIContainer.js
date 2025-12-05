/**
 * Dependency Injection Container
 *
 * Manages service dependencies and provides centralized
 * dependency resolution for better testability and maintainability
 */

class DIContainer {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
    this.instances = new Map();
  }

  /**
   * Register a service instance
   * @param {string} name - Service name
   * @param {any} instance - Service instance
   */
  register(name, instance) {
    if (this.services.has(name)) {
      throw new Error(`Service '${name}' is already registered`);
    }
    this.services.set(name, instance);
    return this;
  }

  /**
   * Register a service factory function
   * @param {string} name - Service name
   * @param {Function} factory - Factory function
   * @param {boolean} singleton - Whether to create singleton instance
   */
  registerFactory(name, factory, singleton = true) {
    if (this.factories.has(name)) {
      throw new Error(`Factory '${name}' is already registered`);
    }
    this.factories.set(name, { factory, singleton });
    return this;
  }

  /**
   * Resolve a service by name
   * @param {string} name - Service name
   * @returns {any} - Service instance
   */
  resolve(name) {
    // First check if it's already instantiated
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    // Check if it's a registered service instance
    if (this.services.has(name)) {
      const instance = this.services.get(name);
      this.instances.set(name, instance);
      return instance;
    }

    // Check if it's a registered factory
    if (this.factories.has(name)) {
      const { factory, singleton } = this.factories.get(name);
      const instance = factory(this);

      if (singleton) {
        this.instances.set(name, instance);
      }

      return instance;
    }

    throw new Error(`Service '${name}' is not registered`);
  }

  /**
   * Check if a service is registered
   * @param {string} name - Service name
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name) || this.factories.has(name) || this.instances.has(name);
  }

  /**
   * Override a service for testing
   * @param {string} name - Service name
   * @param {any} mockInstance - Mock instance
   */
  override(name, mockInstance) {
    this.instances.set(name, mockInstance);
    return this;
  }

  /**
   * Reset container (useful for testing)
   */
  reset() {
    this.services.clear();
    this.factories.clear();
    this.instances.clear();
    return this;
  }

  /**
   * Get all registered service names
   * @returns {string[]}
   */
  getRegisteredServices() {
    return [
      ...Array.from(this.services.keys()),
      ...Array.from(this.factories.keys()),
      ...Array.from(this.instances.keys())
    ];
  }
}

// Create singleton instance
const container = new DIContainer();

// Register core services
container.registerFactory('logger', () => {
  const Logger = require('../services/Logger').default;
  return Logger;
});

container.registerFactory('supabase', () => {
  const { supabase } = require('../services/supabaseClient');
  return supabase;
});

container.registerFactory('errorHandler', (c) => {
  const ErrorHandler = require('../services/ErrorHandler').default;
  return ErrorHandler;
});

container.registerFactory('profileRepository', (c) => {
  const ProfileRepository = require('../repositories/ProfileRepository').default;
  return new ProfileRepository(c.resolve('supabase'));
});

container.registerFactory('matchRepository', (c) => {
  const MatchRepository = require('../repositories/MatchRepository').default;
  return new MatchRepository(c.resolve('supabase'));
});

container.registerFactory('messageRepository', (c) => {
  const MessageRepository = require('../repositories/MessageRepository').default;
  return new MessageRepository(c.resolve('supabase'));
});

export default container;
