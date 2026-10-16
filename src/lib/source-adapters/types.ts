import { SourceCategory, SourceMetadata } from '../types';

export interface SourceValidationResult {
  isValid: boolean;
  category: SourceCategory;
  errorMessage?: string;
  normalizedIdentifier?: string;
}

export interface MediaAccessResult {
  canExtractDirectBytes: boolean;
  mediaFileOrBlob?: File | Blob;
  mediaStreamUrl?: string;
  sourceEmbedUrl?: string;
  warningNotice?: string;
}

export interface SourceAdapter {
  category: SourceCategory;
  canHandle(input: string | File): boolean;
  validate(input: string | File): SourceValidationResult;
  getMetadata(input: string | File): Promise<SourceMetadata>;
  getMediaAccess(input: string | File, backendUrl?: string): Promise<MediaAccessResult>;
}
