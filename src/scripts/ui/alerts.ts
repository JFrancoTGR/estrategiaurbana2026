import Swal from 'sweetalert2';

export const euAlert = Swal.mixin({
  target: 'body',
  position: 'center',

  width: '460px',
  padding: '32px',

  backdrop: 'rgba(20, 20, 20, 0.75)',
  heightAuto: false,

  buttonsStyling: false,
  confirmButtonText: 'ACEPTAR',

  customClass: {
    container: 'eu-alert-container',
    popup: 'eu-alert-popup',
    title: 'eu-alert-title',
    htmlContainer: 'eu-alert-content',
    confirmButton: 'eu-alert-confirm',
  },
});