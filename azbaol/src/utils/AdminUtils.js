'use client';
import {axiosPublic, axiosPrivate} from "@/utils/AxiosInstance"

class AdminUtils {
    static async adminData() {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/admin/profile',
            });
            return response.data;
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async createUser(obj) {
        try {
            const response = await axiosPrivate({
                method: "POST",
                url: '/admin/users/create',
                data: obj,
            });
            return response.data;
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }

    static async allUser(params) {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/admin/users/all',
                params: params,
            });
            console.log({
                r: response,
                d: response.data,
            })
            return response.data;
        } catch (error) {
            console.log({error});
            throw new Error(error);
        }
    }
}

export default AdminUtils;