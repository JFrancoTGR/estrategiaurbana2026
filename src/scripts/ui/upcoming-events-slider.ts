import Swiper from 'swiper';
import {
  A11y,
  Pagination,
} from 'swiper/modules';

export function initUpcomingEventsSlider(root: HTMLElement) {
  const slider = root.querySelector<HTMLElement>(
    '[data-events-slider]',
  );

  const pagination = root.querySelector<HTMLElement>(
    '[data-events-pagination]',
  );

  if (!slider || !pagination) {
    return;
  }

  const slides =
    slider.querySelectorAll<HTMLElement>('.swiper-slide');

  if (slides.length < 2) {
    return;
  }

  const syncPaginationVisibility = (swiper: Swiper) => {
    /*
     * watchOverflow determina si realmente
     * existe recorrido disponible.
     *
     * isLocked === true:
     * todas las cards caben → ocultamos bullets.
     *
     * isLocked === false:
     * existe overflow → mostramos navegación.
     */
    pagination.hidden = swiper.isLocked;
  };

  const swiper = new Swiper(slider, {
    modules: [
      A11y,
      Pagination,
    ],

    slidesPerView: 1.08,
    spaceBetween: 14,

    speed: 700,
    grabCursor: true,
    watchOverflow: true,

    pagination: {
      el: pagination,
      clickable: true,
    },

    breakpoints: {
      768: {
        slidesPerView: 2,
        spaceBetween: 16,
      },

      1200: {
        slidesPerView: 3,
        spaceBetween: 18,
      },
    },

    on: {
      init(swiper) {
        syncPaginationVisibility(swiper);
      },

      lock(swiper) {
        syncPaginationVisibility(swiper);
      },

      unlock(swiper) {
        syncPaginationVisibility(swiper);
      },

      breakpoint(swiper) {
        syncPaginationVisibility(swiper);
      },
    },
  });

  /*
   * Dejamos explícitamente sincronizado
   * el estado después de la construcción.
   */
  syncPaginationVisibility(swiper);

  return () => {
    swiper.destroy(true, true);
  };
}