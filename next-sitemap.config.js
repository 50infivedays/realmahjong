module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://realmahjong.vercel.app',
  generateRobotsTxt: true,
  outDir: 'out',
  generateIndexSitemap: false, // Disable sitemap index for small sites
  exclude: ['/icon.png', '/apple-icon.png'], // Exclude static image routes
  // optional
  // robotsTxtOptions: {
  //   additionalSitemaps: [
  //     'https://realmahjong.vercel.app/server-sitemap.xml', // <==== Add here
  //   ],
  // },
}