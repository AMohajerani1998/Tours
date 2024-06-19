/* eslint-disable */

export const hideAlert = () => {
    const alert = document.querySelector('.alert');
    if (alert) alert.parentElement.removeChild(alert);
};

export const showAlert = (type, message) => {
    hideAlert();
    const alert = `<div class='alert alert--${type}'>${message}</div>`;
    const body = document.querySelector('body');
    body.insertAdjacentHTML('afterbegin', alert);
    window.setTimeout(hideAlert, 5000);
};
