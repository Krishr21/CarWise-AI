export interface CarListing {
  title: string;
  price: string;
  mileage: string;
  year: string;
  location: string;
  url: string;
  source: string;
  pros: string[];
  cons: string[];
  summary: string;
  imageUrl?: string;
}

export interface SearchState {
  isSearching: boolean;
  status: 'idle' | 'researching' | 'analyzing' | 'completed' | 'error';
  results: CarListing[];
  error?: string;
}

export interface SearchFilters {
  query: string;
  budgetMin: string;
  budgetMax: string;
  makeModel: string;
  yearMin: string;
  location: string;
}
