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
        script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        font-src 'self';
        connect-src 'self' https://*.googleapis.com https://*.mongodb.net https://*.cloudinary.com https://*.amazonaws.com;
        frame-src 'self' https://accounts.google.com;
        font-src 'self' https://fonts.gstatic.com;
        media-src 'self' https://*.cloudinary.com;
        object-src 'self';
        `
            .replace(/\s+/g, ' ').trim();

        return [
            {
                source: '/:path*', // Apply to all routes
                headers: [
                    // Basic security headers
                    {key: 'X-Content-Type-Options', value: 'nosniff'},
                    {key: 'X-Frame-Options', value: 'DENY'},
                    {key: 'X-XSS-Protection', value: '1; mode=block'},

                    // Remove Next.js signature (optional)
                    {key: 'X-Powered-By', value: ''},

                    // Content Security Policy (adjust based on your needs)
                    {
                        key: 'Content-Security-Policy',
                        value: cspDirectives
                    },

                    // Referrer Policy
                    {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},

                    // Permissions Policy - allow your site only
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
        ],
    },
    // eslint: {
    //     ignoreDuringBuilds: true,
    // },
    crossOrigin: 'anonymous',

};

export default nextConfig;
