module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/content/docs/getting-started/overview",
        permanent: true,
      },
    ];
  },
};
