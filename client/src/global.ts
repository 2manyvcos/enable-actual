declare global {
  interface Window {
    enableActual: {
      appName: string;
      publicURL: string;
      notesPrefix?: string;
      notesSuffix?: string;
    };
  }
}
