/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export for GitHub Pages (no Node server on Pages).
  output: "export",

  // The site is served from https://<user>.github.io/vietnam-trip/, so all
  // routes and built assets (_next JS/CSS/fonts) must be prefixed with the repo
  // path. basePath also sets assetPrefix by default.
  basePath: "/vietnam-trip",

  // Emit each route as a folder with index.html (e.g. /out/index.html), which
  // GitHub Pages serves cleanly at the subdirectory URL.
  trailingSlash: true,

  // next/image optimization needs a server; disable it for static export so
  // any <img>/next-image sources (including base64 data URIs) are served as-is.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
