module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://realmahjong.vercel.app',
  generateRobotsTxt: true,
  outDir: 'out', // Ensure sitemap is generated in the output directory for static export
  // optional
  // robotsTxtOptions: {
  //   additionalSitemaps: [
  //     'https://realmahjong.vercel.app/server-sitemap.xml', // <==== Add here
  //   ],
  // },
}
