import FingerprintJS from '@fingerprintjs/fingerprintjs';

export interface FingerprintData {
  fingerprint: string;
  confidence: number;
}

export interface StoredFingerprint {
  fingerprint: string | null;
  confidence: number | null;
}

let fingerprint: string | null = null;
let confidence: number | null = null;

export const getFingerprint = async (): Promise<FingerprintData> => {
  if (fingerprint && confidence !== null) {
    return { fingerprint, confidence };
  }

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();

    fingerprint = result.visitorId;
    confidence = result.confidence.score;

    return { fingerprint, confidence };
  } catch (error) {
    // Fallback values if fingerprinting fails
    fingerprint = 'unknown';
    confidence = 0;
    return { fingerprint, confidence };
  }
};

export const getStoredFingerprint = (): StoredFingerprint => {
  return { fingerprint, confidence };
};
