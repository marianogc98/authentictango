import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
  },
  experimental: {
    serverActions: {
      // Las fotos de la galería llegan por un server action. El panel las achica antes
      // (unos cientos de KB), pero el límite por defecto de 1 MB queda justo.
      bodySizeLimit: '8mb',
    },
  },
}

export default withNextIntl(nextConfig);
