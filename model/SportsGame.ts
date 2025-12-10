/**
 * Sports Game Data Models
 * Defines types for NBA, NHL, NFL, and MLB game data
 */

/**
 * Base sports game interface with common fields
 */
interface BaseSportsGame {
  DateUtc: string;
  Location: string;
  AwayTeam: string;
  AwayTeamScore: number;
  HomeTeam: string;
  HomeTeamScore: number;
  Status?: string;
}

/**
 * NBA Game data structure
 */
export interface NBAGame extends BaseSportsGame {
  id: string | number;
}

/**
 * NHL Game data structure
 */
export interface NHLGame extends BaseSportsGame {
  id: string | number;
}

/**
 * NFL Game data structure
 */
export interface NFLGame extends BaseSportsGame {
  id: string | number;
}

/**
 * MLB Game data structure
 * Note: MLB uses different field names than other sports
 */
export interface MLBGame {
  id: string | number;
  gameDate: string;
  venueName: string;
  awayTeamName: string;
  awayTeamScore: number;
  homeTeamName: string;
  homeTeamScore: number;
  gameStatus?: string;
}

/**
 * Union type for all sports games
 */
export type SportsGame = NBAGame | NHLGame | NFLGame | MLBGame;
