export const ensureTrailingSlash = (url: string): string => {
  // Don't add trailing slash to URLs with file extensions or query parameters
  if (url.includes('.') || url.includes('?') || url.includes('#')) {
    return url;
  }
  
  // Don't add trailing slash if it already exists
  if (url.endsWith('/')) {
    return url;
  }
  
  return `${url}/`;
};

export const removeTrailingSlash = (url: string): string => {
  if (url === '/') return url; // Keep root slash
  return url.replace(/\/$/, '');
};

export const normalizeUrl = (url: string): string => {
  return ensureTrailingSlash(url);
};