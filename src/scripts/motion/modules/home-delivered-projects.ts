import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/*
 * Cantidad de scroll expresada
 * en alturas de viewport.
 *
 * Éste será uno de nuestros principales
 * valores de dirección visual.
 */
const SCROLL_DISTANCE = 0.55;

export function init(root: HTMLElement) {
  const frame = root.querySelector<HTMLElement>(
    '[data-delivered-frame]',
  );

  const image = root.querySelector<HTMLImageElement>(
    '[data-delivered-image]',
  );

  if (!frame || !image) {
    return;
  }

  const matchMedia = gsap.matchMedia();

  matchMedia.add(
    '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
    () => {
      const context = gsap.context(() => {
        /*
         * Distancia física existente entre
         * la altura real de la imagen y
         * la ventana que la recorta.
         */
        const getTravel = () =>
          Math.max(
            0,
            image.getBoundingClientRect().height -
              frame.getBoundingClientRect().height,
          );

        gsap.set(image, {
          y: 0,
          willChange: 'transform',
        });

        const animation = gsap.to(image, {
          /*
           * Al inicio vemos el extremo superior.
           *
           * Al finalizar desplazamos exactamente
           * el excedente disponible, de modo que
           * aparece el extremo inferior.
           */
          y: () => -getTravel(),

          ease: 'none',

          scrollTrigger: {
            trigger: root,

            start: 'top top',

            end: () =>
              '+=' + window.innerHeight * SCROLL_DISTANCE,

            pin: true,

            scrub: 0.45,

            anticipatePin: 1,

            invalidateOnRefresh: true,
          },
        });

        /*
         * Aunque Astro ya conoce las dimensiones
         * del asset, refrescamos ScrollTrigger si
         * la imagen termina de cargar después.
         */
        const handleImageLoad = () => {
          ScrollTrigger.refresh();
        };

        if (!image.complete) {
          image.addEventListener(
            'load',
            handleImageLoad,
            { once: true },
          );
        }

        return () => {
          image.removeEventListener(
            'load',
            handleImageLoad,
          );

          animation.kill();

          gsap.set(image, {
            clearProps: 'transform,willChange',
          });
        };
      }, root);

      return () => {
        context.revert();
      };
    },
  );

  return () => {
    matchMedia.revert();
  };
}