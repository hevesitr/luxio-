/**
 * Logger Service - Központi logging rendszer
 * Development módban részletes logolás, production módban csak hibák
 */

const IS_DEV = __DEV__;

class Logger {
  /**
   * Debug szintű log (csak development-ben)
   */
  debug(message, context = {}) {
    if (IS_DEV) {
      console.log(`[DEBUG] ${message}`, context);
    }
  }

  /**
   * Info szintű log
   */
  info(message, context = {}) {
    if (IS_DEV) {
      console.info(`[INFO] ${message}`, context);
    }
  }

  /**
   * Success szintű log (zöld színnel development-ben)
   */
  success(message, context = {}) {
    if (IS_DEV) {
      console.log(`✅ [SUCCESS] ${message}`, context);
    }
  }

  /**
   * Warning szintű log
   */
  warn(message, context = {}) {
    console.warn(`⚠️ [WARN] ${message}`, context);
  }

  /**
   * Error szintű log (mindig logol)
   */
  error(message, error, context = {}) {
    console.error(`❌ [ERROR] ${message}`, {
      error: error?.message || error,
      stack: error?.stack,
      ...context,
    });
  }

  /**
   * Network request log
   */
  network(method, url, status, duration) {
    if (IS_DEV) {
      const statusEmoji = status >= 200 && status < 300 ? '✅' : '❌';
      console.log(`${statusEmoji} [NETWORK] ${method} ${url} - ${status} (${duration}ms)`);
    }
  }
}

export default new Logger();
