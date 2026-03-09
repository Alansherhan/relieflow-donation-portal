import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Handle 401 errors globally (expired/invalid tokens)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const requestUrl = error.config?.url || '';
            // Skip auth endpoints — 401 there means wrong credentials, not expired token
            const isAuthEndpoint = requestUrl.includes('/login') || requestUrl.includes('/signup');

            if (!isAuthEndpoint && typeof window !== 'undefined') {
                localStorage.removeItem('token');
                
                // Only redirect if not already on auth pages
                const currentPath = window.location.pathname;
                const isAuthPage = currentPath.includes('/login') || currentPath.includes('/register');
                
                if (!isAuthPage) {
                    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
                }
            }
        }
        return Promise.reject(error);
    }
);

// Portal API endpoints
export const portalApi = {
    // Public endpoints (no auth)
    getPublicDonationRequests: (params?: { page?: number; limit?: number; donationType?: string; search?: string }) =>
        api.get('/api/portal/public/donation-requests', { params }),

    getPublicDonationRequest: (id: string) =>
        api.get(`/api/portal/public/donation-requests/${id}`),

    getPublicDonationReceipt: (id: string) =>
        api.get(`/api/portal/public/donation/${id}/receipt`),

    getWalletInfo: () =>
        api.get('/api/portal/public/wallet-info'),

    guestDonate: (data: {
        donationRequestId?: string;
        donorName?: string;
        donorEmail?: string;
        donorPhone?: string;
        amount: number;
        transactionRef?: string;
    }) => api.post('/api/portal/public/donate', data),

    guestDonateToWallet: (data: {
        donorName?: string;
        donorEmail?: string;
        donorPhone?: string;
        amount: number;
    }) => api.post('/api/portal/public/donate-wallet', data),

    // Auth endpoints
    login: (email: string, password: string) =>
        api.post('/api/public/login', { email, password }),

    forgotPassword: (email: string) =>
        api.post('/api/public/forgot-password', { email }),

    resetPassword: (email: string, otp: string, newPassword: string) =>
        api.post('/api/public/reset-password', { email, otp, newPassword }),

    register: (data: {
        name: string;
        email: string;
        password: string;
        address: string;
        phoneNumber: string;
        role: string;
    }) => api.post('/api/public/signup', data),

    getProfile: () =>
        api.get('/api/public/profile'),

    // Authenticated donation endpoints
    acceptDonationRequest: (data: {
        donationRequestId: string;
        donationType: string;
        amount?: number;
        itemDetails?: Array<{ category: string; description?: string; quantity: number; unit?: string }>;
        deliveryMethod?: 'self_delivery' | 'pickup';  // Required for item donations
        pickupAddress?: {
            addressLine1?: string;
            addressLine2?: string;
        };
        pickupLocation?: {
            type: 'Point';
            coordinates: [number, number];
        };
        pickupDate?: string;
        pickupNotes?: string;
    }) => api.post('/api/portal/donation/accept', data),

    submitCashDonation: (id: string, data: { amount: number; transactionRef?: string }) =>
        api.put(`/api/portal/donation/${id}/submit-cash`, data),

    submitItemDonation: (id: string, formData: FormData) =>
        api.put(`/api/portal/donation/${id}/submit-item`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    requestPickup: (id: string, formData: FormData) =>
        api.put(`/api/portal/donation/${id}/request-pickup`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    cancelDonation: (id: string) =>
        api.put(`/api/portal/donation/${id}/cancel`),

    getMyDonations: (params?: { status?: string; page?: number; limit?: number }) =>
        api.get('/api/portal/my-donations', { params }),

    getDonation: (id: string) =>
        api.get(`/api/portal/donation/${id}`),

    donateToWallet: (data: { amount: number; transactionRef?: string }) =>
        api.post('/api/portal/donate-wallet', data),
};

export default api;
