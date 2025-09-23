import axios from "axios";
// Public Axios instance (no token needed)
export const axiosPublic = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    withCredentials: true, // Send cookies for cross-origin requests
    headers: {
        "Content-Type": "application/json",
    },
});

// Private Axios instance (for protected routes)
export const axiosPrivate = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    withCredentials: true, // Send cookies for cross-origin requests
    headers: {
        "Content-Type": "application/json",
    },
});
