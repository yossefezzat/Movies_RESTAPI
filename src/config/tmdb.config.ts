export default () => ({
  tmdb: {
    baseUrl: process.env.TMDB_API_URL,
    apiKey: process.env.TMDB_API_KEY,
    maxPages: process.env.TMDB_MAX_PAGES,
  },
});
