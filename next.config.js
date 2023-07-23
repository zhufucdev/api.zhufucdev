/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: "/v1/:path*",
                destination: "/api/:path*",
            },
        ];
    },
};

module.exports = nextConfig;
