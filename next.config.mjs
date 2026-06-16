/** @type {import('next').NextConfig} */
const repoName = 'ai-engineer-roadmap'
const isProd = process.env.NODE_ENV === 'production'
const isGhPages = process.env.GITHUB_PAGES === 'true'

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath:   isProd && isGhPages ? `/${repoName}` : '',
  assetPrefix: isProd && isGhPages ? `/${repoName}/` : '',
}

export default nextConfig
