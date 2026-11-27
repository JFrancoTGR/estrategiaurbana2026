/**
 * Servicio global de Google reCAPTCHA v3.
 *
 * Utiliza el contenedor persistente de BaseLayout.astro.
 * Independiente del lifecycle de los formularios y ScrollSmoother.
 */

const ROOT_ID = 'eu-recaptcha-root';

const SITE_KEY = import.meta.env.PUBLIC_EU_RECAPTCHA_SITE_KEY as
  string | undefined;

const INIT_TIMEOUT_MS = 10000;
const EXECUTE_TIMEOUT_MS = 10000;

class RecaptchaTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecaptchaTimeoutError';
  }
}

interface RecaptchaAPI {
  reset: (clientId: number) => void;
  ready: (callback: () => void) => void;

  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      size: 'invisible';
      badge: 'inline';
    },
  ) => number;

  execute: (clientId: number, options: { action: string }) => Promise<string>;
}

interface RecaptchaWidget {
  api: RecaptchaAPI;
  root: HTMLElement;
  clientId: number;
}

let widgetPromise: Promise<RecaptchaWidget> | null = null;
let activeExecution: Promise<string> | null = null;

/**
 * Recupera la API global sin acoplarse a los tipos
 * declarados actualmente en contact-form.ts.
 */
function getAPI(): RecaptchaAPI | undefined {
  return (window as unknown as { grecaptcha?: RecaptchaAPI }).grecaptcha;
}

/**
 * Limita el tiempo de espera de una operación asíncrona.
 */
async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeoutId: number | undefined;

  try {
    return await Promise.race([
      operation,

      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(new RecaptchaTimeoutError(message));
        }, timeoutMs);
      }),
    ]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Carga la API de Google únicamente cuando se necesita.
 */
async function loadAPI(): Promise<RecaptchaAPI> {
  const deadline = performance.now() + INIT_TIMEOUT_MS;

  const remainingTime = () => Math.max(0, deadline - performance.now());

  let api = getAPI();

  if (!api) {
    const script = document.createElement('script');

    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';

    script.async = true;

    try {
      api = await withTimeout(
        new Promise<RecaptchaAPI>((resolve, reject) => {
          script.onload = () => {
            const loadedAPI = getAPI();

            if (!loadedAPI) {
              reject(new Error('No fue posible inicializar reCAPTCHA.'));
              return;
            }

            resolve(loadedAPI);
          };

          script.onerror = () => {
            reject(new Error('No fue posible cargar reCAPTCHA.'));
          };

          document.head.appendChild(script);
        }),
        remainingTime(),
        'Tiempo de carga de reCAPTCHA agotado.',
      );
    } catch (error) {
      script.remove();
      throw error;
    } finally {
      script.onload = null;
      script.onerror = null;
    }
  }

  const readyAPI = api;

  await withTimeout(
    new Promise<void>((resolve) => {
      readyAPI.ready(resolve);
    }),
    remainingTime(),
    'Tiempo de inicialización de reCAPTCHA agotado.',
  );

  return readyAPI;
}

/**
 * Inicializa una única instancia del widget global.
 */
async function initializeWidget(): Promise<RecaptchaWidget> {
  if (!SITE_KEY) {
    throw new Error('reCAPTCHA no está configurado.');
  }

  const api = await loadAPI();

  const root = document.getElementById(ROOT_ID);

  if (!root || !root.isConnected) {
    throw new Error('Contenedor global de reCAPTCHA no disponible.');
  }

  if (root.childElementCount > 0) {
    throw new Error('El contenedor de reCAPTCHA ya está ocupado.');
  }

  const clientId = api.render(root, {
    sitekey: SITE_KEY,
    size: 'invisible',
    badge: 'inline',
  });

  return {
    api,
    root,
    clientId,
  };
}

/**
 * Recupera o inicializa el widget compartido.
 */
function getWidget(): Promise<RecaptchaWidget> {
  if (!widgetPromise) {
    widgetPromise = initializeWidget().catch((error: unknown) => {
      widgetPromise = null;
      throw error;
    });
  }

  return widgetPromise;
}

/**
 * Genera un nuevo token para una acción protegida.
 */
export async function getRecaptchaToken(action: string): Promise<string> {
  const { api, root, clientId } = await getWidget();

  if (
    !root.isConnected ||
    document.getElementById(ROOT_ID) !== root ||
    !root.querySelector('iframe')
  ) {
    throw new Error('El widget global de reCAPTCHA no está disponible.');
  }

  if (activeExecution) {
    throw new Error('reCAPTCHA ya tiene una operación en proceso.');
  }

  const execution = Promise.resolve().then(() =>
    api.execute(clientId, { action }),
  );

  activeExecution = execution;

  const releaseExecution = () => {
    if (activeExecution === execution) {
      activeExecution = null;
    }
  };

  void execution.then(releaseExecution, releaseExecution);

  let token: string;

  try {
    token = await withTimeout(
      execution,
      EXECUTE_TIMEOUT_MS,
      'Tiempo de verificación de reCAPTCHA agotado.',
    );
  } catch (error) {
    if (
      error instanceof RecaptchaTimeoutError &&
      activeExecution === execution
    ) {
      try {
        api.reset(clientId);
        releaseExecution();
      } catch {
        // Si reset falla, conservamos el bloqueo de seguridad.
      }
    }

    throw error;
  }

  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('No fue posible obtener el token de reCAPTCHA.');
  }

  return token;
}

export function isRecaptchaConfigured(): boolean {
  return Boolean(SITE_KEY?.trim());
}
