import Swiper from 'swiper';
import { A11y } from 'swiper/modules';

export function initPartnersSlider(root: HTMLElement) {
  const slider =
    root.querySelector<HTMLElement>('[data-partners-slider]');

  if (!slider) return;

  const swiper = new Swiper(slider, {
    modules: [A11y],

    slidesPerView: 1.12,
    spaceBetween: 14,

    speed: 700,
    grabCursor: true,
    watchOverflow: true,

    breakpoints: {
      768: {
        slidesPerView: 2.2,
        spaceBetween: 16,
      },

      1200: {
        slidesPerView: 3.2,
        spaceBetween: 18,
      },
    },
  });

  return () => {
    swiper.destroy(true, true);
  };
}