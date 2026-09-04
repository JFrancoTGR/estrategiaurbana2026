export function initManifestoVideo(root: HTMLElement) {
  const openButton = root.querySelector<HTMLButtonElement>(
    '[data-manifesto-video-open]',
  );

  const closeButton = root.querySelector<HTMLButtonElement>(
    '[data-manifesto-video-close]',
  );

  const dialog = root.querySelector<HTMLDialogElement>(
    '[data-manifesto-video-dialog]',
  );

  const video = root.querySelector<HTMLVideoElement>('[data-manifesto-video]');

  const videoSrc = dialog?.dataset.videoSrc;

  if (!openButton || !closeButton || !dialog || !video || !videoSrc) {
    return;
  }

  /*
   * El Manifesto vive dentro del contenido
   * transformado por ScrollSmoother.
   *
   * El dialog, en cambio, es UI global/fija.
   * Lo sacamos de ese stacking context para
   * que fullscreen → dialog sea estable.
   */
  const dialogOrigin = dialog.parentElement;

  document.body.append(dialog);

  let sourceAttached = false;

  const attachSource = () => {
    if (sourceAttached) {
      return;
    }

    video.src = videoSrc;
    video.load();

    sourceAttached = true;
  };

  const openVideo = () => {
    /*
     * Sólo aquí, como consecuencia
     * directa del click, el navegador
     * conoce la URL del MP4.
     */
    attachSource();

    if (!dialog.open) {
      dialog.showModal();
    }

    document.documentElement.classList.add('manifesto-video-open');

    void video.play().catch(() => {
      /*
       * Si por cualquier razón play()
       * no inicia automáticamente,
       * los controles siguen disponibles.
       */
    });
  };

  const resetVideo = () => {
    video.pause();

    if (video.readyState > 0) {
      video.currentTime = 0;
    }
  };

  const closeVideo = () => {
    if (dialog.open) {
      dialog.close();
    }
  };

  const handleDialogClose = () => {
    resetVideo();

    document.documentElement.classList.remove('manifesto-video-open');
  };

  openButton.addEventListener('click', openVideo);

  closeButton.addEventListener('click', closeVideo);

  const handleFullscreenChange = () => {
    /*
     * Si acabamos de abandonar el fullscreen
     * nativo del video pero el dialog continúa
     * abierto, restauramos explícitamente el
     * estado modal de nuestra interfaz.
     */
    if (!document.fullscreenElement && dialog.open) {
      document.documentElement.classList.add('manifesto-video-open');
    }
  };

  document.addEventListener('fullscreenchange', handleFullscreenChange);

  /*
   * También cubre cierre nativo con Escape.
   */
  dialog.addEventListener('close', handleDialogClose);

  return () => {
    openButton.removeEventListener('click', openVideo);

    closeButton.removeEventListener('click', closeVideo);

    dialog.removeEventListener('close', handleDialogClose);

    resetVideo();

    video.removeAttribute('src');
    video.load();

    sourceAttached = false;

    document.documentElement.classList.remove('manifesto-video-open');

    document.removeEventListener('fullscreenchange', handleFullscreenChange);

    dialogOrigin?.append(dialog);
  };
}
