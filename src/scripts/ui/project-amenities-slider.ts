import Swiper from 'swiper';

export function initProjectAmenitiesSlider(root: HTMLElement) {
  const slider = root.querySelector<HTMLElement>(
    '[data-project-amenities-slider]',
  );

  if (!slider) {
    return;
  }

  const slides = slider.querySelectorAll<HTMLElement>('.swiper-slide');

  if (slides.length === 0) {
    return;
  }

  const swiper = new Swiper(slider, {
    slidesPerView: 'auto',
    centeredSlides: true,
    spaceBetween: 18,
    speed: 750,
    grabCursor: true,

    loop: slides.length > 2,
  });

  return () => {
    swiper.destroy(true, true);
  };
}
