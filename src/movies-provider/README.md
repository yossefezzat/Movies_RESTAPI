# Movies Provider Module

This module provides a unified interface for fetching movie data from various sources. TMDB (The Movie Database) is integrated as the default and primary provider.

## Architecture

### Core Components

- **MovieProviderInterface**: Core interface that all movie providers must implement
- **MoviesProviderService**: Service that manages movie data access using the configured providers
- **MoviesProviderController**: REST API endpoints for accessing movie data

### TMDB Integration

The TMDB provider is fully integrated within this module:

- **Models** (`providers/tmdb/models/`): 
  - `Genre`: Movie genre definition
  - `Movie`: Movie entity with all properties
  - `MoviesClientList`: Paginated movie list response
- **Interfaces** (`providers/tmdb/interfaces/`):
  - `TmdbClientInterface`: Contract for TMDB API client
  - `TmdbApiResponses`: TMDB API response type definitions
- **Services** (`providers/tmdb/services/`):
  - `TmdbClientService`: Handles direct communication with TMDB API
- **Provider** (`providers/`):
  - `TmdbProvider`: Implements MovieProviderInterface using TmdbClientService

## API Endpoints

### Movie Data

```
GET /movies/genres
```
Returns a list of movie genres from TMDB.

```
GET /movies?page=:page
```
Returns a paginated list of movies from TMDB. The page parameter is optional (defaults to 1).

## Configuration

The module requires the following environment variables:

```env
TMDB_API_URL=https://api.themoviedb.org/3
TMDB_API_KEY=your_api_key_here
```

## Module Structure

```
movies-provider/
├── controllers/
│   └── movies-provider.controller.ts
├── interfaces/
│   └── movie-provider.interface.ts
├── providers/
│   ├── tmdb.provider.ts
│   └── tmdb/
│       ├── models/
│       │   ├── genre.model.ts
│       │   ├── movie.model.ts
│       │   └── movies-client-list.model.ts
│       ├── interfaces/
│       │   ├── tmdb-api-responses.interface.ts
│       │   └── tmdb-client.interface.ts
│       └── services/
│           └── tmdb-client.service.ts
├── services/
│   └── movies-provider.service.ts
├── movies-provider.module.ts
└── README.md
```

## Adding New Providers

While TMDB is the integrated default provider, the architecture supports adding additional providers:

1. Create a new provider directory under `providers/`
2. Implement the required models, interfaces, and services
3. Create a provider class implementing `MovieProviderInterface`
4. Register the provider in `MoviesProviderModule`

Example structure for a new provider:

```
providers/
└── netflix/
    ├── models/
    ├── interfaces/
    ├── services/
    └── netflix.provider.ts
```

Example provider implementation:

```typescript
@Injectable()
export class NetflixProvider implements MovieProviderInterface {
  getProviderName(): string {
    return 'netflix';
  }

  async getGenres(): Promise<Genre[]> {
    // Implementation
  }

  async getMovies(page: number = 1): Promise<MoviesClientList> {
    // Implementation
  }
}
```

Then register in the module:

```typescript
@Module({
  providers: [
    // ...
    NetflixProvider,
    {
      provide: 'MOVIE_PROVIDERS',
      useFactory: (tmdb: TmdbProvider, netflix: NetflixProvider) => [tmdb, netflix],
      inject: [TmdbProvider, NetflixProvider],
    },
  ],
})
```

Note that TMDB will remain the default provider even when additional providers are added.