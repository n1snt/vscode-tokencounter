export interface DocumentLike {
  readonly isUntitled: boolean;
  readonly uri: {
    readonly scheme: string;
  };
}

export function canTrackDocument(document: DocumentLike, showForUntitled: boolean): boolean {
  if (document.isUntitled) {
    return showForUntitled;
  }

  return document.uri.scheme === "file";
}
