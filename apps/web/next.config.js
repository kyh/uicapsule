module.exports = {
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
