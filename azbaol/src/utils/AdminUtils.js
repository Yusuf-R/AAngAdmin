'use client';
import { axiosPublic, axiosPrivate } from "@/utils/AxiosInstance"

class AdminUtils {
    static async adminData() {
        try {
            const response = await axiosPrivate({
                method: "GET",
                url: '/admin/profile',
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

export default AdminUtils;