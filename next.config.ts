import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Evita que el servidor dependa de `.next/server/chunks/*.js` separados
   * (si falta un chunk al copiar `.next` o desplegar, falla con
   * `TypeError: a[d] is not a function` en el módulo del route handler).
   */
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
      };
    }
    return config;
  },
};

export default nextConfig;
