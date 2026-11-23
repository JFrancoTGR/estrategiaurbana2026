/**
 * Captación del sitio corporativo.
 * No llamamos directamente al Inbound Webhook de GHL desde el navegador:
 * el sender entrega el payload al middleware PHP del mismo dominio.
 */
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

function readUTMs(): Record<string, string> {
  try {
    const stored = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as { time: number; data: Record<string, string> };
    if (!Number.isFinite(parsed.time) || Date.now() - parsed.time > ATTRIBUTION_MAX_AGE_MS) {
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
  const endpoint = import.meta.env.PUBLIC_EU_CONTACT_ENDPOINT as string | undefined;
  const siteKey = import.meta.env.PUBLIC_EU_RECAPTCHA_SITE_KEY as string | undefined;
  let sending = false;
  let controller: AbortController | null = null;

  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (sending || !form.reportValidity() || !submit || !status) return;

    if (!endpoint || !siteKey) {
      status.textContent = 'El formulario no está disponible temporalmente.';
      return;
    }

    sending = true;
    submit.disabled = true;
    status.textContent = 'Enviando tu solicitud…';
    controller = new AbortController();

    try {
      // El token se genera al enviar, no durante la carga inicial.
      const recaptcha = await loadRecaptcha(siteKey);
      const recaptchaToken = await recaptcha.execute(siteKey, { action: RECAPTCHA_ACTION });
      const formData = new FormData(form);

      const payload: Record<string, unknown> = {
        event: 'corporate_contact_intake',
        first_name: getText(formData, 'first_name'),
        last_name: getText(formData, 'last_name'),
        contact_email: getText(formData, 'contact_email').toLowerCase(),
        contact_phone: getText(formData, 'contact_phone'),
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
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json() as { success?: boolean };
      if (result.success !== true) throw new Error('No se confirmó el registro.');

      status.textContent = 'Gracias. Recibimos tu mensaje y pronto nos pondremos en contacto.';
      form.reset();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        status.textContent = 'No pudimos enviar tu mensaje. Inténtalo nuevamente.';
      }
    } finally {
      sending = false;
      submit.disabled = false;
      controller = null;
    }
  };

  form.addEventListener('submit', onSubmit);
  return () => {
    form.removeEventListener('submit', onSubmit);
    controller?.abort();
  };
}
