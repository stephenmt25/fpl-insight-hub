const FPL_API_URL = 'https://fantasy.premierleague.com/api';

// Using allorigins.win as a reliable CORS proxy
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export const API_CONFIG = {
  BASE_URL: `${CORS_PROXY}${encodeURIComponent(FPL_API_URL)}`,
  HEADERS: {
    'Content-Type': 'application/json',
  }
};