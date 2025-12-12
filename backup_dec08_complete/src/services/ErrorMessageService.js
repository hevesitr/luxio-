/**
 * Error Message Service
 *
 * Maps error codes and messages to user-friendly messages
 * Provides actionable recovery steps for common errors
 */

class ErrorMessageService {
  // Error code mappings
  static ERROR_CODES = {
    // Authentication errors
    AUTH_INVALID_CREDENTIALS: 'AUTH_001',
    AUTH_USER_NOT_FOUND: 'AUTH_002',
    AUTH_EMAIL_ALREADY_EXISTS: 'AUTH_003',
    AUTH_WEAK_PASSWORD: 'AUTH_004',
    AUTH_SESSION_EXPIRED: 'AUTH_005',

    // Validation errors
    VALIDATION_REQUIRED_FIELD: 'VAL_001',
    VALIDATION_INVALID_EMAIL: 'VAL_002',
    VALIDATION_INVALID_PHONE: 'VAL_003',
    VALIDATION_PASSWORD_TOO_SHORT: 'VAL_004',
    VALIDATION_PASSWORDS_DONT_MATCH: 'VAL_005',

    // Network errors
    NETWORK_CONNECTION_FAILED: 'NET_001',
    NETWORK_TIMEOUT: 'NET_002',
    NETWORK_SERVER_ERROR: 'NET_003',

    // File upload errors
    UPLOAD_FILE_TOO_LARGE: 'UPLOAD_001',
    UPLOAD_INVALID_FILE_TYPE: 'UPLOAD_002',
    UPLOAD_STORAGE_FULL: 'UPLOAD_003',

    // Permission errors
    PERMISSION_CAMERA_DENIED: 'PERM_001',
    PERMISSION_LOCATION_DENIED: 'PERM_002',
    PERMISSION_STORAGE_DENIED: 'PERM_003',

    // Onboarding specific errors
    ONBOARDING_INCOMPLETE: 'ONBOARD_001',
    ONBOARDING_PHOTO_MINIMUM: 'ONBOARD_002',
    ONBOARDING_BIO_TOO_SHORT: 'ONBOARD_003'
  };

  // Error message mappings
  static ERROR_MESSAGES = {
    [this.ERROR_CODES.AUTH_INVALID_CREDENTIALS]: {
      title: 'Hibás bejelentkezési adatok',
      message: 'Az email cím vagy jelszó helytelen. Kérjük, ellenőrizd az adatokat.',
      action: 'Próbáld újra',
      recoverySteps: [
        'Ellenőrizd az email címet',
        'Ellenőrizd a jelszót (kis- és nagybetűk számítanak)',
        'Ha elfelejtetted a jelszavad, használd az "Elfelejtett jelszó" opciót'
      ]
    },

    [this.ERROR_CODES.AUTH_USER_NOT_FOUND]: {
      title: 'Felhasználó nem található',
      message: 'Nem található fiók ezzel az email címmel.',
      action: 'Regisztráció',
      recoverySteps: [
        'Ellenőrizd az email címet',
        'Ha még nem regisztráltál, használd a "Regisztráció" gombot',
        'Ha már regisztráltál, próbálkozz másik email címmel'
      ]
    },

    [this.ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS]: {
      title: 'Email cím már foglalt',
      message: 'Ez az email cím már használatban van.',
      action: 'Bejelentkezés',
      recoverySteps: [
        'Használd a "Bejelentkezés" opciót ha már van fiókod',
        'Próbálkozz másik email címmel',
        'Ha elfelejtetted a jelszavad, használd az "Elfelejtett jelszó" opciót'
      ]
    },

    [this.ERROR_CODES.AUTH_WEAK_PASSWORD]: {
      title: 'Gyenge jelszó',
      message: 'A jelszónak legalább 8 karakterből kell állnia és tartalmaznia kell számot és speciális karaktert.',
      action: 'Új jelszó',
      recoverySteps: [
        'Használj legalább 8 karaktert',
        'Adj hozzá számokat (0-9)',
        'Adj hozzá speciális karaktereket (!@#$%^&*)',
        'Kerüld a könnyen kitalálható jelszavakat'
      ]
    },

    [this.ERROR_CODES.VALIDATION_REQUIRED_FIELD]: {
      title: 'Kötelező mező',
      message: 'Kérjük, töltsd ki az összes kötelező mezőt.',
      action: 'Mezők kitöltése',
      recoverySteps: [
        'Nézd át a piros színnel jelölt mezőket',
        'Töltsd ki az összes csillaggal (*) jelölt mezőt',
        'Ellenőrizd, hogy minden adat helyesen van-e megadva'
      ]
    },

    [this.ERROR_CODES.VALIDATION_INVALID_EMAIL]: {
      title: 'Érvénytelen email cím',
      message: 'Kérjük, érvényes email címet adj meg.',
      action: 'Email javítása',
      recoverySteps: [
        'Ellenőrizd az email cím helyesírását',
        'Győződj meg róla, hogy tartalmaz @ jelet',
        'Használj érvényes domain-t (.com, .hu, stb.)'
      ]
    },

    [this.ERROR_CODES.NETWORK_CONNECTION_FAILED]: {
      title: 'Hálózati hiba',
      message: 'Nem sikerült csatlakozni az internethez. Ellenőrizd az internetkapcsolatod.',
      action: 'Újrapróbálkozás',
      recoverySteps: [
        'Ellenőrizd az internetkapcsolatod',
        'Kapcsold ki és be a Wi-Fi-t',
        'Próbálkozz mobilinternet használatával',
        'Zárd be és nyisd meg újra az alkalmazást'
      ]
    },

    [this.ERROR_CODES.NETWORK_TIMEOUT]: {
      title: 'Időtúllépés',
      message: 'A kérés túllépte az időkorlátot. Kérjük, próbáld újra.',
      action: 'Újrapróbálkozás',
      recoverySteps: [
        'Ellenőrizd az internetkapcsolatod sebességét',
        'Próbáld újra néhány perc múlva',
        'Zárd be és nyisd meg újra az alkalmazást'
      ]
    },

    [this.ERROR_CODES.UPLOAD_FILE_TOO_LARGE]: {
      title: 'Fájl túl nagy',
      message: 'A feltöltött fájl mérete meghaladja a maximális méretet (10MB).',
      action: 'Kisebb fájl kiválasztása',
      recoverySteps: [
        'Válassz kisebb képet vagy videót',
        'Csökkentsd a képfelbontást',
        'Használj képoptimalizáló alkalmazást'
      ]
    },

    [this.ERROR_CODES.UPLOAD_INVALID_FILE_TYPE]: {
      title: 'Érvénytelen fájltípus',
      message: 'Csak kép (JPG, PNG) és videó (MP4) fájlok tölthetők fel.',
      action: 'Helyes fájl kiválasztása',
      recoverySteps: [
        'Válassz JPG vagy PNG képet',
        'Vagy MP4 videót',
        'Ellenőrizd a fájl kiterjesztését'
      ]
    },

    [this.ERROR_CODES.PERMISSION_CAMERA_DENIED]: {
      title: 'Kamera engedély megtagadva',
      message: 'Az alkalmazásnak szüksége van kamera engedélyre a fényképezéshez.',
      action: 'Engedély megadása',
      recoverySteps: [
        'Menj a telefon beállításaiba',
        'Keresd meg a LoveX alkalmazást',
        'Engedélyezd a kamera hozzáférést',
        'Zárd be és nyisd meg újra az alkalmazást'
      ]
    },

    [this.ERROR_CODES.PERMISSION_LOCATION_DENIED]: {
      title: 'Helymeghatározás engedély megtagadva',
      message: 'Az alkalmazásnak szüksége van helymeghatározásra a közelben lévő partnerek megtalálásához.',
      action: 'Engedély megadása',
      recoverySteps: [
        'Menj a telefon beállításaiba',
        'Keresd meg a LoveX alkalmazást',
        'Engedélyezd a helymeghatározást',
        'Zárd be és nyisd meg újra az alkalmazást'
      ]
    },

    [this.ERROR_CODES.ONBOARDING_INCOMPLETE]: {
      title: 'Hiányos profil',
      message: 'Kérjük, teljesítsd az összes lépést a profilod befejezéséhez.',
      action: 'Folytatás',
      recoverySteps: [
        'Töltsd ki az összes kötelező mezőt',
        'Tölts fel legalább 2 profilkép',
        'Írj bemutatkozást (minimum 10 karakter)',
        'Állítsd be a keresési preferenciákat'
      ]
    },

    [this.ERROR_CODES.ONBOARDING_PHOTO_MINIMUM]: {
      title: 'Túl kevés profilkép',
      message: 'Legalább 2 profilkép szükséges a profilod megjelenítéséhez.',
      action: 'Képek hozzáadása',
      recoverySteps: [
        'Tölts fel legalább 2 képet',
        'Javasolt legalább 6 kép feltöltése',
        'Maximum 9 kép tölthető fel'
      ]
    },

    [this.ERROR_CODES.ONBOARDING_BIO_TOO_SHORT]: {
      title: 'Túl rövid bemutatkozás',
      message: 'A bemutatkozásnak legalább 10 karakterből kell állnia.',
      action: 'Bemutatkozás szerkesztése',
      recoverySteps: [
        'Írj magadról részletesebben',
        'Mesélj az érdeklődési köreidről',
        'Add hozzá, hogy mit keresel az alkalmazásban'
      ]
    }
  };

  /**
   * Get user-friendly error message for error code
   * @param {string} errorCode - Error code
   * @returns {Object} - Error message object
   */
  static getErrorMessage(errorCode) {
    return this.ERROR_MESSAGES[errorCode] || {
      title: 'Ismeretlen hiba',
      message: 'Egy váratlan hiba történt. Kérjük, próbáld újra.',
      action: 'Újrapróbálkozás',
      recoverySteps: [
        'Zárd be és nyisd meg újra az alkalmazást',
        'Ellenőrizd az internetkapcsolatod',
        'Ha a hiba továbbra is fennáll, lépj kapcsolatba az ügyfélszolgálattal'
      ]
    };
  }

  /**
   * Map common error strings to error codes
   * @param {string} errorString - Raw error message
   * @returns {string} - Error code
   */
  static mapErrorString(errorString) {
    const lowerError = errorString.toLowerCase();

    // Authentication errors
    if (lowerError.includes('invalid login credentials')) {
      return this.ERROR_CODES.AUTH_INVALID_CREDENTIALS;
    }
    if (lowerError.includes('user not found') || lowerError.includes('email not confirmed')) {
      return this.ERROR_CODES.AUTH_USER_NOT_FOUND;
    }
    if (lowerError.includes('user already registered')) {
      return this.ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS;
    }
    if (lowerError.includes('password should be at least')) {
      return this.ERROR_CODES.AUTH_WEAK_PASSWORD;
    }

    // Validation errors
    if (lowerError.includes('required') || lowerError.includes('cannot be blank')) {
      return this.ERROR_CODES.VALIDATION_REQUIRED_FIELD;
    }
    if (lowerError.includes('invalid email')) {
      return this.ERROR_CODES.VALIDATION_INVALID_EMAIL;
    }

    // Network errors
    if (lowerError.includes('network') || lowerError.includes('connection')) {
      return this.ERROR_CODES.NETWORK_CONNECTION_FAILED;
    }
    if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
      return this.ERROR_CODES.NETWORK_TIMEOUT;
    }

    // File upload errors
    if (lowerError.includes('file too large') || lowerError.includes('size')) {
      return this.ERROR_CODES.UPLOAD_FILE_TOO_LARGE;
    }
    if (lowerError.includes('invalid file type') || lowerError.includes('unsupported format')) {
      return this.ERROR_CODES.UPLOAD_INVALID_FILE_TYPE;
    }

    // Permission errors
    if (lowerError.includes('camera') && lowerError.includes('permission')) {
      return this.ERROR_CODES.PERMISSION_CAMERA_DENIED;
    }
    if (lowerError.includes('location') && lowerError.includes('permission')) {
      return this.ERROR_CODES.PERMISSION_LOCATION_DENIED;
    }

    // Default to unknown error
    return null;
  }

  /**
   * Create user-friendly error from raw error
   * @param {Error|string} error - Raw error object or string
   * @returns {Object} - User-friendly error message
   */
  static createUserFriendlyError(error) {
    let errorString = '';

    if (typeof error === 'string') {
      errorString = error;
    } else if (error.message) {
      errorString = error.message;
    } else {
      errorString = 'Unknown error occurred';
    }

    const errorCode = this.mapErrorString(errorString);

    if (errorCode) {
      return this.getErrorMessage(errorCode);
    }

    // Return generic error if no mapping found
    return {
      title: 'Hiba történt',
      message: 'Egy váratlan hiba történt. Kérjük, próbáld újra.',
      action: 'Újrapróbálkozás',
      recoverySteps: [
        'Zárd be és nyisd meg újra az alkalmazást',
        'Ellenőrizd az internetkapcsolatod',
        'Ha a hiba továbbra is fennáll, lépj kapcsolatba az ügyfélszolgálattal'
      ]
    };
  }

  /**
   * Get onboarding-specific error messages
   * @param {Array} validationErrors - Validation errors array
   * @returns {Object} - Error message object
   */
  static getOnboardingErrorMessage(validationErrors) {
    if (!validationErrors || validationErrors.length === 0) {
      return null;
    }

    // Prioritize errors by severity
    const photoErrors = validationErrors.filter(e => e.field === 'photos');
    const bioErrors = validationErrors.filter(e => e.field === 'bio');

    if (photoErrors.length > 0) {
      return this.getErrorMessage(this.ERROR_CODES.ONBOARDING_PHOTO_MINIMUM);
    }

    if (bioErrors.length > 0) {
      return this.getErrorMessage(this.ERROR_CODES.ONBOARDING_BIO_TOO_SHORT);
    }

    // Generic onboarding error
    return this.getErrorMessage(this.ERROR_CODES.ONBOARDING_INCOMPLETE);
  }

  /**
   * Get success messages for onboarding steps
   * @param {number} step - Step number
   * @returns {Object} - Success message
   */
  static getOnboardingSuccessMessage(step) {
    const messages = {
      1: {
        title: 'Személyes adatok mentve!',
        message: 'Az első lépés sikeresen befejezve. Folytasd a következővel!'
      },
      2: {
        title: 'Képek feltöltve!',
        message: 'A profilképeid sikeresen feltöltve. Most írj magadról valamit!'
      },
      3: {
        title: 'Bemutatkozás kész!',
        message: 'A bemutatkozásod elmentve. Most állítsd be a keresési preferenciákat!'
      },
      4: {
        title: 'Preferenciák beállítva!',
        message: 'Minden készen áll! Most már használhatod az alkalmazást.'
      },
      5: {
        title: 'Üdvözlünk a LoveX-ben!',
        message: 'A profilod kész és aktív. Kezdd el felfedezni az új partnereket!'
      }
    };

    return messages[step] || {
      title: 'Lépés befejezve!',
      message: 'Sikeresen mentetted az adatokat. Folytasd a következő lépéssel!'
    };
  }
}

export default ErrorMessageService;
