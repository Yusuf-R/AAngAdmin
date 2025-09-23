/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [{
            source: '/',
            destination: '/home',
            permanent: true,
        }];
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
            },
        ],
    },
    // eslint: {
    //     ignoreDuringBuilds: true,
    // },
    crossOrigin: 'anonymous',
};

export default nextConfig;
