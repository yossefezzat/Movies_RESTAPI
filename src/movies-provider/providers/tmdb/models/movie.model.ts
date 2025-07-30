/**
 * Represents a movie from TMDB API
 */
export interface Movie {
  /**
   * Unique identifier for the movie
   */
  tmdbId: number | null;

  /**
   * Title of the movie
   */
  title: string | null;

  /**
   * Original title in source language
   */
  originalTitle: string | null;

  /**
   * Original language code
   */
  originalLanguage: string | null;

  /**
   * Movie plot summary
   */
  overview: string | null;

  /**
   * Release date of the movie
   */
  releaseDate: string | null;

  /**
   * Path to movie poster image
   */
  posterPath: string | null;

  /**
   * Path to movie backdrop image
   */
  backdropPath: string | null;

  /**
   * Average vote score
   */
  voteAverage: number | null;

  /**
   * Number of votes
   */
  voteCount: number | null;

  /**
   * Popularity score
   */
  popularity: number | null;

  /**
   * Whether the movie is adult content
   */
  adult: boolean | null;

  /**
   * Whether the movie has video content
   */
  video: boolean | null;

  /**
   * List of genre IDs associated with the movie
   */
  genres: number[] | null;

  /**
   * Optional array of complete genre objects
   */
  genreObjects?: { id: number; name: string }[];
}