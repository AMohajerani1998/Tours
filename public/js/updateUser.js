import axios from 'axios';
import { showAlert } from './alert';

export const updateUser = async (data, type) => {
    try {
        const link =
            type === 'password'
                ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
                : 'http://127.0.0.1:3000/api/v1/users/updateMe';
        const response = await axios({
            method: 'PATCH',
            url: link,
            withCredentials: true,
            data,
        });
        // const response = await fetch('http://127.0.0.1:3000/api/v1/users/updateMe', {
        //     method: 'PATCH',
        //     credentials: 'include',
        //     body: JSON.stringify({
        //         email,
        //         name,
        //     }),
        // });
        if (response.data.token) document.cookie = `jwt=${response.data.token}`;
        showAlert('success', `${type} updated successfully!`);
    } catch (error) {
        showAlert('error', error.response.data.message);
    }
};
