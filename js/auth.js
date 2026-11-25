// ============================================================================
// НАЛАШТУВАННЯ ПАРОЛЯ ДОСТУПУ (SHA-256)
// Зараз для тестування встановлено SHA-256 хеш слова "admin".
// Щоб встановити постійний робочий пароль:
//   1. Обчисліть SHA-256 хеш потрібного пароля у форматі hex (нижній регістр).
//   2. Замініть значення константи EXPECTED_HASH нижче на отриманий хеш.
// ============================================================================
const EXPECTED_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";

(function () {
  const AUTH_STORAGE_KEY = 'bpd_portal_auth';
  const ATTEMPTS_STORAGE_KEY = 'bpd_login_attempts';
  const LOCKOUT_STORAGE_KEY = 'bpd_lockout_until';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 30000;

  const memoryStorage = {};

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return Object.prototype.hasOwnProperty.call(memoryStorage, key)
        ? memoryStorage[key]
        : null;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      memoryStorage[key] = String(value);
    }
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      delete memoryStorage[key];
    }
  }

  // Pre-paint check to prevent flash of the login overlay on authenticated reloads
  if (safeGet(AUTH_STORAGE_KEY) === EXPECTED_HASH) {
    document.documentElement.classList.add('bpd-authenticated');
  }

  window.bpdIsAuthenticated = function () {
    return safeGet(AUTH_STORAGE_KEY) === EXPECTED_HASH;
  };

  async function sha256Hex(text) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API is unavailable in this context');
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map(function (b) {
        return b.toString(16).padStart(2, '0');
      })
      .join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    const overlay = document.getElementById('auth-overlay');
    const card = document.getElementById('auth-card');
    const form = document.getElementById('auth-form');
    const passwordInput = document.getElementById('auth-password');
    const togglePasswordBtn = document.getElementById('toggle-password-btn');
    const togglePasswordIcon = document.getElementById('toggle-password-icon');
    const submitBtn = document.getElementById('auth-submit');
    const messageBox = document.getElementById('auth-message');
    const messageIcon = document.getElementById('auth-message-icon');
    const messageText = document.getElementById('auth-message-text');
    const portalApp = document.getElementById('portal-app');
    const logoutBtn = document.getElementById('logout-btn');

    let lockoutTimerId = null;
    let isSubmitting = false;

    function setPortalLocked(locked) {
      if (!portalApp) return;
      if (locked) {
        portalApp.inert = true;
        portalApp.setAttribute('aria-hidden', 'true');
      } else {
        portalApp.inert = false;
        portalApp.removeAttribute('aria-hidden');
      }
    }

    function showMessage(text, iconName) {
      if (!messageBox || !messageText || !messageIcon) return;
      messageIcon.textContent = iconName || 'error';
      messageText.textContent = text;
      messageBox.classList.remove('hidden');
      messageBox.classList.add('flex');
    }

    function hideMessage() {
      if (!messageBox || !messageText) return;
      messageText.textContent = '';
      messageBox.classList.add('hidden');
      messageBox.classList.remove('flex');
    }

    function setFormDisabled(disabled) {
      passwordInput.disabled = disabled;
      togglePasswordBtn.disabled = disabled;
      submitBtn.disabled = disabled;
    }

    function resetPasswordField() {
      passwordInput.value = '';
      passwordInput.type = 'password';
      togglePasswordIcon.textContent = 'visibility';
      togglePasswordBtn.setAttribute('aria-pressed', 'false');
      togglePasswordBtn.setAttribute('aria-label', 'Показати пароль');
    }

    function clearLockoutState() {
      if (lockoutTimerId !== null) {
        clearInterval(lockoutTimerId);
        lockoutTimerId = null;
      }
      safeRemove(LOCKOUT_STORAGE_KEY);
      safeRemove(ATTEMPTS_STORAGE_KEY);
      setFormDisabled(false);
      hideMessage();
    }

    function startLockoutCountdown(lockoutUntil) {
      if (lockoutTimerId !== null) {
        clearInterval(lockoutTimerId);
        lockoutTimerId = null;
      }

      setFormDisabled(true);

      function updateCountdown() {
        const remainingMs = lockoutUntil - Date.now();
        if (remainingMs <= 0) {
          clearLockoutState();
          passwordInput.focus();
          return;
        }
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        showMessage(
          'Забагато невдалих спроб. Спробуйте знову через ' + remainingSeconds + ' с.',
          'timer'
        );
      }

      updateCountdown();
      lockoutTimerId = setInterval(updateCountdown, 250);
    }

    function syncLockoutState() {
      const rawUntil = safeGet(LOCKOUT_STORAGE_KEY);
      if (!rawUntil) return false;
      const lockoutUntil = parseInt(rawUntil, 10);
      if (Number.isNaN(lockoutUntil) || lockoutUntil <= Date.now()) {
        safeRemove(LOCKOUT_STORAGE_KEY);
        safeRemove(ATTEMPTS_STORAGE_KEY);
        return false;
      }
      startLockoutCountdown(lockoutUntil);
      return true;
    }

    function triggerShake() {
      if (!card) return;
      card.classList.remove('auth-shake');
      void card.offsetWidth;
      card.classList.add('auth-shake');
    }

    if (safeGet(AUTH_STORAGE_KEY) === EXPECTED_HASH) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
      setPortalLocked(false);
    } else {
      document.documentElement.classList.remove('bpd-authenticated');
      overlay.classList.remove('hidden', 'is-hiding');
      overlay.setAttribute('aria-hidden', 'false');
      setPortalLocked(true);
      if (!syncLockoutState()) {
        passwordInput.focus();
      }
    }

    togglePasswordBtn.addEventListener('click', function () {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      togglePasswordIcon.textContent = isHidden ? 'visibility_off' : 'visibility';
      togglePasswordBtn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
      togglePasswordBtn.setAttribute(
        'aria-label',
        isHidden ? 'Приховати пароль' : 'Показати пароль'
      );
      passwordInput.focus();
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (isSubmitting || syncLockoutState()) return;

      const password = passwordInput.value;
      if (password.length === 0) {
        showMessage('Введіть пароль для доступу.', 'info');
        passwordInput.focus();
        return;
      }

      isSubmitting = true;
      try {
        const hash = await sha256Hex(password);
        if (hash === EXPECTED_HASH) {
          clearLockoutState();
          safeSet(AUTH_STORAGE_KEY, hash);
          resetPasswordField();
          hideMessage();
          setPortalLocked(false);
          window.dispatchEvent(new CustomEvent('bpd:authenticated'));

          overlay.classList.add('is-hiding');
          setTimeout(function () {
            document.documentElement.classList.add('bpd-authenticated');
            overlay.classList.add('hidden');
            overlay.setAttribute('aria-hidden', 'true');
            overlay.classList.remove('is-hiding');
          }, 260);
        } else {
          const attempts = (parseInt(safeGet(ATTEMPTS_STORAGE_KEY), 10) || 0) + 1;
          safeSet(ATTEMPTS_STORAGE_KEY, String(attempts));

          if (attempts >= MAX_ATTEMPTS) {
            const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
            safeSet(LOCKOUT_STORAGE_KEY, String(lockoutUntil));
            passwordInput.value = '';
            startLockoutCountdown(lockoutUntil);
          } else {
            const remainingAttempts = MAX_ATTEMPTS - attempts;
            showMessage(
              'Невірний пароль. Залишилось спроб: ' + remainingAttempts + '.',
              'error'
            );
            triggerShake();
            passwordInput.select();
            passwordInput.focus();
          }
        }
      } catch (err) {
        showMessage(
          'Для перевірки пароля потрібне захищене з’єднання (HTTPS або localhost).',
          'warning'
        );
      } finally {
        isSubmitting = false;
      }
    });

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        safeRemove(AUTH_STORAGE_KEY);
        document.documentElement.classList.remove('bpd-authenticated');
        setPortalLocked(true);
        resetPasswordField();
        hideMessage();

        overlay.classList.add('is-hiding');
        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');
        void overlay.offsetWidth;
        overlay.classList.remove('is-hiding');

        if (!syncLockoutState()) {
          passwordInput.focus();
        }
      });
    }
  });
})();
