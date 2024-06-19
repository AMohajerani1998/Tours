import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
    const stripe = Stripe(
        'pk_test_51PSK0mAMtIKsWaJrC83YlhQuisDP0gSwgJAemRjVZEAna14yoBdTVWHHBSOw6Zl6U6zG6d8rHcruprjt7Ui94kfO00LulgQL1j',
    );
    try {
        const session = await axios({
            url: `/api/v1/bookings/checkout-session/${tourId}`,
            withCredentials: true,
        });
        stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        });
    } catch (err) {
        showAlert('error', err.response.message);
    }
};
