declare global {
  interface Window {
    enableActual: {
      appName: string;
      publicURL: string;
    };
  }
}
