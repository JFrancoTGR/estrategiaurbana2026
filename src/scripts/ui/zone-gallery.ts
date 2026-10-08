import Swiper from 'swiper';
import { A11y, Pagination } from 'swiper/modules';

export function initZoneGallery(root: HTMLElement) {
  const slider = root.querySelector<HTMLElement>('[data-zone-gallery-slider]');

  const pagination = root.querySelector<HTMLElement>(
    '[data-zone-gallery-pagination]',
  );

  if (!slider || !pagination) {
    return;
  }

  const slides = slider.querySelectorAll<HTMLElement>('.swiper-slide');

  if (slides.length < 2) {
    return;
  }

  const swiper = new Swiper(slider, {
    modules: [A11y, Pagination],

    slidesPerView: 'auto',

    centeredSlides: true,

    spaceBetween: 18,

    loop: true,

    speed: 750,

    grabCursor: true,

    watchOverflow: true,

    pagination: {
      el: pagination,
      clickable: true,
    },

    breakpoints: {
      768: {
        spaceBetween: 24,
      },

      1200: {
        spaceBetween: 32,
      },
    },
  });

  return () => {
    swiper.destroy(true, true);
  };
}
