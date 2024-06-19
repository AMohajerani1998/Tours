/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
    try {
        const response = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: {
                email,
                password,
            },
            withCredentials: true,
        });
        if (response.data.status === 'success') {
            showAlert('success', 'success');

            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};

export const logout = async () => {
    try {
        await axios({
            method: 'GET',
            url: '/api/v1/users/logout',
        });
        document.cookie = `jwt=`;
        location.reload(true);
    } catch (err) {
        showAlert('error', 'There was an error. Please try again!');
    }
};
