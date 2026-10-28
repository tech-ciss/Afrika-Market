import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Autorise l'aperçu Cloud (en-tête Host du proxypass de preview).
  allowedDevOrigins: [
    "http://pv-d33ffae2fad9-9620f0a9-60dc-4a41-b50b-288d52579051.style.dev",
    "https://pv-d33ffae2fad9-9620f0a9-60dc-4a41-b50b-288d52579051.style.dev",
  ],
  images: {
    // Les visuels produits du seed sont des SVG locaux (aucune dépendance réseau).
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
