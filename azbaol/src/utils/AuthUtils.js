'use client';
import { axiosPublic, axiosPrivate } from "@/utils/AxiosInstance"

class AuthUtils {

    // Encrypt data using the PEM public key stored as an environment variable
    static async GoogleSignUp(obj) {
        try {
            const response = await axiosPublic({
                method: "POST",
                url: '/system/google-signup',
                data: obj,
            });

            if (response.status === 201) {
                console.log({response})
                return response.data; // ← This should return { userId, userRole }
            } else {
                throw new Error(response.data?.error || 'Registration failed');
            }
        } catch (error) {
            console.error('SignUp error:', error);
            throw new Error(error.response?.data?.error || error.message);
        }
    }

    static async GoogleLogin(obj) {
        try {
            const response = await axiosPublic({
                method: "POST",
                url: '/system/google-login',
                data: obj,
            });

            if (response.status === 201) {
                console.log({response})
                return response.data; // ← This should return { userId, userRole }
            } else {
                throw new Error(response.data?.error || 'Registration failed');
            }
        } catch (error) {
            console.error('SignUp error:', error);
            throw new Error(error.response?.data?.error || error.message);
        }
    }

    static async SignUp(obj) {
        try {
            const response = await axiosPublic({
                method: "POST",
                url: '/system/signup',
                data: obj,
            });

            if (response.status === 201) {
                console.log({response})
                return response.data; // ← This should return { userId, userRole }
            } else {
                throw new Error(response.data?.error || 'Registration failed');
            }
        } catch (error) {
            console.error('SignUp error:', error);
            throw new Error(error.response?.data?.error || error.message);
        }
    }

    static async Login(obj) {
        try {
            const response = await axiosPublic({
                method: "POST",
                url: '/system/login',
                data: obj,
            });
            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({ error });
            throw new Error(error);
        }
    }

    static async Logout() {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/auth/logout',
            });
            if (response.status === 200) {
                return response.data;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.log({ error });
            throw new Error(error);
        }
    }

}

export default AuthUtils;