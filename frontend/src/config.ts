// Use production backend on Vercel, localhost for development
export const BACKEND_URL = import.meta.env.PROD 
  ? 'https://be-woad-beta.vercel.app' 
  : 'http://localhost:3001';
