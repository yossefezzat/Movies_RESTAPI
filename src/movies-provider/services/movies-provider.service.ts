import { Injectable, Inject } from '@nestjs/common';
import { MovieProviderInterface } from '../interfaces/movie-provider.interface';
import { Genre } from '../providers/tmdb/models/genre.model';
import { MoviesClientList } from '../providers/tmdb/models/movies-client-list.model';

@Injectable()
export class MoviesProviderService {
  private readonly providers: Map<string, MovieProviderInterface> = new Map();
  private readonly defaultProvider = 'tmdb';

  constructor(
    @Inject('MOVIE_PROVIDERS')
    providers: MovieProviderInterface[],
  ) {
    // Register all providers
    providers.forEach(provider => {
      this.providers.set(provider.getProviderName(), provider);
    });

    // Verify default provider exists
    if (!this.providers.has(this.defaultProvider)) {
      throw new Error(`Default provider '${this.defaultProvider}' is not registered`);
    }
  }

  /**
   * Gets the current default provider name
   * @returns Default provider name
   */
  getDefaultProvider(): string {
    return this.defaultProvider;
  }

  /**
   * Gets a provider by name
   * @param providerName Name of the provider to get
   * @returns The provider instance
   * @throws Error if provider is not registered
   */
  private getProvider(providerName?: string): MovieProviderInterface {
    const name = providerName || this.defaultProvider;
    const provider = this.providers.get(name);
    
    if (!provider) {
      throw new Error(`Provider '${name}' is not registered`);
    }
    
    return provider;
  }

  /**
   * Fetches a list of movie genres
   * @param providerName Optional provider name to use (uses default if not specified)
   * @returns Promise with an array of Genre objects
   */
  async getGenres(providerName?: string): Promise<Genre[]> {
    const provider = this.getProvider(providerName);
    return provider.getGenres();
  }

  /**
   * Fetches a list of movies
   * @param page The page number to fetch (default: 1)
   * @param providerName Optional provider name to use (uses default if not specified)
   * @returns Promise with MoviesClientList containing movies, pagination info
   */
  async getMovies(page: number = 1, providerName?: string): Promise<MoviesClientList> {
    const provider = this.getProvider(providerName);
    return provider.getMovies(page);
  }
}