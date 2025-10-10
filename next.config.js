/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress build warnings
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  webpack: (config, { isServer }) => {
    // Handle the onnxruntime-web warning
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Ignore the critical dependency warning from onnxruntime-web
    config.module.exprContextCritical = false;

    // Suppress webpack warnings for onnxruntime-web
    config.ignoreWarnings = [
      {
        module: /onnxruntime-web/,
        message: /Critical dependency/,
      },
    ];

    // Add WASM support for VAD
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    return config;
  },
  
  // Add proper headers for ONNX, WASM, and Audio Worklet files
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://api.openai.com; frame-ancestors 'none';",
          },
        ],
      },
      {
        source: '/(.*\\.onnx|.*\\.wasm)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy', 
            value: 'same-origin',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'application/octet-stream',
          },
        ],
      },
      {
        source: '/(.*worklet.*\\.js)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy', 
            value: 'same-origin',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
    ];
  },
  
  // Ensure static files are served correctly
  async rewrites() {
    return [
      {
        source: '/_next/static/chunks/:path*',
        destination: '/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
