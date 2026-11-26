/**
 * Captación del sitio corporativo.
 * No llamamos directamente al Inbound Webhook de GHL desde el navegador:
 * el sender entrega el payload al middleware PHP del mismo dominio.
 */
import { euAlert } from './alerts';
import type { SweetAlertOptions } from 'sweetalert2';

const ATTRIBUTION_STORAGE_KEY = 'eu_website_last_utm';
const ATTRIBUTION_MAX_AGE_MS = 30 * 60 * 1000;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;
const RECAPTCHA_ACTION = 'eu_contact_intake';

interface RecaptchaAPI {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: RecaptchaAPI;
  }
}

let recaptchaLoader: Promise<RecaptchaAPI> | null = null;

function loadRecaptcha(siteKey: string): Promise<RecaptchaAPI> {
  if (window.grecaptcha) {
    return Promise.resolve(window.grecaptcha);
  }

  if (!recaptchaLoader) {
    recaptchaLoader = new Promise<RecaptchaAPI>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      script.async = true;
      script.onerror = () => reject(new Error('reCAPTCHA no está disponible.'));
      script.onload = () => {
        const captcha = window.grecaptcha;
        if (!captcha) {
          reject(new Error('No fue posible inicializar reCAPTCHA.'));
          return;
        }
        captcha.ready(() => resolve(captcha));
      };
      document.head.appendChild(script);
    }).catch((error: unknown) => {
      recaptchaLoader = null;
      throw error;
    });
  }
  return recaptchaLoader;
}

function getText(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function getValidationMessage(field: HTMLElement | null): string {
  switch (field?.getAttribute('name')) {
    case 'first_name':
      return 'Por favor, ingresa tu nombre.';

    case 'last_name':
      return 'Por favor, ingresa tu apellido.';

    case 'contact_email':
      return 'Por favor, ingresa un correo electrónico válido.';

    case 'contact_phone':
      return 'Por favor, ingresa tu número telefónico.';

    case 'country_code':
      return 'Selecciona un código de país.';

    case 'message':
      return 'Por favor, escribe un mensaje de al menos 10 caracteres.';

    case 'privacy_consent':
      return 'Debes autorizar que nuestro equipo se ponga en contacto contigo.';

    default:
      return 'Verifica los campos obligatorios del formulario.';
  }
}

export function normalizePhone(
  countryCode: string,
  rawPhone: string,
): string | null {
  if (!['+52', '+1'].includes(countryCode)) {
    return null;
  }

  let phone = rawPhone.trim().replace(/[\s().-]/g, '');

  // Permitir números pegados con código internacional.
  if (phone.startsWith('+')) {
    if (!phone.startsWith(countryCode)) {
      return null;
    }

    phone = phone.slice(countryCode.length);
  }

  // Ambos códigos utilizan números nacionales de 10 dígitos.
  if (!/^\d{10}$/.test(phone)) {
    return null;
  }

  return `${countryCode}${phone}`;
}

function readUTMs(): Record<string, string> {
  try {
    const stored = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as {
      time: number;
      data: Record<string, string>;
    };
    if (
      !Number.isFinite(parsed.time) ||
      Date.now() - parsed.time > ATTRIBUTION_MAX_AGE_MS
    ) {
      sessionStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
      return {};
    }
    return parsed.data;
  } catch {
    return {};
  }
}

/** Se ejecuta en cada astro:page-load, incluso en páginas sin formulario. */
export function captureWebsiteAttribution(): void {
  const params = new URLSearchParams(location.search);
  if (!UTM_KEYS.some((key) => params.has(key))) return;
  const data: Record<string, string> = {};
  UTM_KEYS.forEach((key) => {
    const value = params.get(key)?.trim();
    if (value) data[key] = value.slice(0, 200);
  });

  try {
    sessionStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify({ time: Date.now(), data }),
    );
  } catch {
    // Restricciones del navegador: enviamos sin UTM si no hay storage.
  }
}

function getConversionPath(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = location.pathname;
  if (base && path.startsWith(`${base}/`)) {
    return path.slice(base.length);
  }
  return path;
}

export function initContactForm(form: HTMLFormElement): () => void {
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
  const status = form.querySelector<HTMLElement>('[data-eu-contact-status]');
  const endpoint = import.meta.env.PUBLIC_EU_CONTACT_ENDPOINT as
    string | undefined;
  const siteKey = import.meta.env.PUBLIC_EU_RECAPTCHA_SITE_KEY as
    string | undefined;
  let sending = false;
  let controller: AbortController | null = null;
  let disposed = false;
  let activePopup: HTMLElement | null = null;

  // Solo cerramos los modales que pertenecen a esta instancia del formulario.
  const showContactAlert = (options: SweetAlertOptions) => {
    const focusedElement = document.activeElement;

    if (focusedElement instanceof HTMLElement) {
      focusedElement.blur();
    }

    const notification = euAlert.fire({
      ...options,
      returnFocus: false,
    });

    activePopup = euAlert.getPopup();

    return notification;
  };

  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (disposed || sending || !submit || !status) return;

    if (!form.checkValidity()) {
      const invalidField = form.querySelector<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >(':invalid');

      const message = getValidationMessage(invalidField);
      status.textContent = message;

      await showContactAlert({
        icon: 'warning',
        title: 'Revisa tus datos',
        text: message,

        didClose: () => {
          if (!disposed && form.isConnected) {
            invalidField?.focus({ preventScroll: true });
          }
        },
      });

      return;
    }

    if (!endpoint || !siteKey) {
      status.textContent = 'El formulario no está disponible temporalmente.';

      await showContactAlert({
        icon: 'info',
        title: 'Servicio temporalmente no disponible',
        text: 'Por favor, inténtalo nuevamente en unos momentos.',
      });

      if (!disposed && form.isConnected) {
        submit.focus({ preventScroll: true });
      }

      return;
    }

    const formData = new FormData(form);
    const contactPhone = normalizePhone(
      getText(formData, 'country_code'),
      getText(formData, 'contact_phone'),
    );

    if (!contactPhone) {
      const message =
        'Ingresa un teléfono de 10 dígitos que corresponda al código de país seleccionado.';

      status.textContent = message;

      await showContactAlert({
        icon: 'warning',
        title: 'Verifica tu teléfono',
        text: message,

        didClose: () => {
          if (!disposed && form.isConnected) {
            form
              .querySelector<HTMLInputElement>('[name="contact_phone"]')
              ?.focus({ preventScroll: true });
          }
        },
      });

      return;
    }

    sending = true;
    submit.disabled = true;
    status.textContent = 'Enviando tu solicitud…';
    controller = new AbortController();
    const signal = controller.signal;

    try {
      // No esperamos el cierre del modal: el envío continúa en paralelo.
      void showContactAlert({
        title: 'Enviando tu mensaje',
        text: 'Estamos procesando tu solicitud.',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: (popup) => {
          if (!disposed && euAlert.getPopup() === popup) {
            euAlert.showLoading();
          }
        },
      });

      // El token se genera al enviar, no durante la carga inicial.
      const recaptcha = await loadRecaptcha(siteKey);
      if (disposed || signal.aborted) return;

      const recaptchaToken = await recaptcha.execute(siteKey, {
        action: RECAPTCHA_ACTION,
      });
      if (disposed || signal.aborted) return;

      const payload: Record<string, unknown> = {
        event: 'corporate_contact_intake',
        first_name: getText(formData, 'first_name'),
        last_name: getText(formData, 'last_name'),
        contact_email: getText(formData, 'contact_email').toLowerCase(),
        contact_phone: contactPhone,
        project_interest: getText(formData, 'project_interest'),
        conversion_type: 'contact_form',
        conversion_source: form.dataset.conversionSource || 'contact_form',
        conversion_page: getConversionPath(),
        message: getText(formData, 'message'),
        conversion_id: crypto.randomUUID(),
        privacy_consent: formData.get('privacy_consent') === '1',
        website: getText(formData, 'website'),
        recaptcha_token: recaptchaToken,
        ...readUTMs(),
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = (await response.json()) as { success?: boolean };
      if (result.success !== true)
        throw new Error('No se confirmó el registro.');

      if (disposed || signal.aborted || !form.isConnected) return;

      const successMessage =
        'Hemos recibido tu mensaje. Nuestro equipo se pondrá en contacto contigo muy pronto.';

      status.textContent = successMessage;
      form.reset();

      await showContactAlert({
        icon: 'success',
        title: '¡Gracias por contactarnos!',
        text: successMessage,
      });
    } catch (error) {
      if (
        disposed ||
        signal.aborted ||
        (error instanceof Error && error.name === 'AbortError') ||
        !form.isConnected
      ) {
        return;
      }

      status.textContent =
        'No pudimos enviar tu mensaje. Inténtalo nuevamente.';

      await showContactAlert({
        icon: 'error',
        title: 'No pudimos enviar tu mensaje',
        text: 'Por favor, inténtalo nuevamente en unos momentos.',
      });
    } finally {
      sending = false;
      submit.disabled = false;
      controller = null;
    }
  };

  form.addEventListener('submit', onSubmit);

  return () => {
    disposed = true;
    form.removeEventListener('submit', onSubmit);
    controller?.abort();

    if (activePopup && euAlert.getPopup() === activePopup) {
      euAlert.close();
    }

    activePopup = null;
  };
}
