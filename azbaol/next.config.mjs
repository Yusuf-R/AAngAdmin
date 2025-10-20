/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [{
            source: '/',
            destination: '/home',
            permanent: true,
        }];
    },
    async headers() {
        const cspDirectives = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://maps.googleapis.com;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        script-src-elem 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://maps.googleapis.com;
        connect-src 'self' http://10.96.154.44:5000 ws://10.96.154.44:5000 wss://10.96.154.44:5000 http://172.20.10.5:5000 ws://172.20.10.5:5000 wss://172.20.10.5:5000 https://*.googleapis.com https://*.mongodb.net https://*.cloudinary.com https://*.amazonaws.com;
        frame-src 'self' https://accounts.google.com;
        font-src 'self' https://fonts.gstatic.com;
        media-src 'self' https://*.cloudinary.com;
        object-src 'self';
        `
            .replace(/\s+/g, ' ').trim();

        return [
            {
                source: '/:path*',
                headers: [
                    {key: 'X-Content-Type-Options', value: 'nosniff'},
                    {key: 'X-Frame-Options', value: 'DENY'},
                    {key: 'X-XSS-Protection', value: '1; mode=block'},
                    {key: 'X-Powered-By', value: ''},
                    {
                        key: 'Content-Security-Policy',
                        value: cspDirectives
                    },
                    {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(self), microphone=(self), geolocation=(self), interest-cohort=()'
                    },
                ],
            },
        ]
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
            },
            {
                protocol: "https",
                hostname: "aanglogistics.s3.eu-north-1.amazonaws.com",
            },
        ],
    },
    crossOrigin: 'anonymous',
};

export default nextConfig;