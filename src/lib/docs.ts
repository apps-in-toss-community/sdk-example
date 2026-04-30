const DOCS_BASE_URL = 'https://docs.aitc.dev';

export function docsLink(namespace: string, method: string): string {
  return `${DOCS_BASE_URL}/api/${namespace}/${method}`;
}
