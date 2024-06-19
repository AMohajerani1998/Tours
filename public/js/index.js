/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { loadMap } from './mapbox';
import { updateUser } from './updateUser';
import { bookTour } from './stripe';

const mapBox = document.querySelector('#map');
const logInform = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nev__el--logout');
const updateForm = document.querySelector('.form--update');
const updatePasswordForm = document.querySelector('.form-user-settings');
const bookingBtn = document.getElementById('bookingBtn');

if (mapBox) {
    const locations = JSON.parse(document.getElementById('map').dataset.locations);
    loadMap(locations);
}

if (logInform) {
    logInform.addEventListener('submit', (event) => {
        console.log('test');
        event.preventDefault();
        const formData = new FormData(logInform);
        const email = formData.get('email');
        const password = formData.get('password');
        login(email, password);
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

if (updateForm) {
    updateForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const submitBtn = document.getElementById('update-user');
        submitBtn.innerText = 'Processing...';
        const formData = new FormData();
        formData.append('name', document.getElementById('name').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('photo', document.getElementById('photo').files[0]);
        updateUser(formData, 'user');
    });
}

if (updatePasswordForm) {
    updatePasswordForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(updatePasswordForm);
        const password = formData.get('password');
        const passwordConfirm = formData.get('passwordConfirm');
        const currentPassword = formData.get('currentPassword');
        updateUser({ password, passwordConfirm, currentPassword }, 'password');
    });
}

if (bookingBtn)
    bookingBtn.addEventListener('click', (event) => {
        const tourId = event.target.dataset.tourId;
        bookingBtn.innerText = 'Processing...';
        bookTour(tourId);
    });
