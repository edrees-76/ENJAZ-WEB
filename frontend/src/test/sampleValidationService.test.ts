import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sampleValidationService, SampleCheckResult } from '../services/sampleValidationService';
import apiClient from '../services/apiClient';

vi.mock('../services/apiClient', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('sampleValidationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkSample', () => {
    it('returns server response when sample is unique', async () => {
      const mockData = {
        status: SampleCheckResult.Unique,
        code: 'UNIQUE',
        sampleNumber: '150',
        normalizedSampleNumber: '150',
        message: 'العينة رقم (150) متاحة وغير مسجلة مسبقاً.'
      };
      (apiClient.post as any).mockResolvedValueOnce({ data: mockData });

      const result = await sampleValidationService.checkSample({
        sampleNumber: '150',
        year: 2026,
        sender: 'مركز الرقابة على الأغذية والأدوية - طرابلس'
      });

      expect(result.status).toBe(SampleCheckResult.Unique);
      expect(result.code).toBe('UNIQUE');
      expect(apiClient.post).toHaveBeenCalledWith('/sample-validation/check', expect.anything(), expect.anything());
    });

    it('returns fallback error status on network failure (never false positive unique)', async () => {
      (apiClient.post as any).mockRejectedValueOnce(new Error('Network Error'));

      const result = await sampleValidationService.checkSample({
        sampleNumber: '150',
        year: 2026
      });

      expect(result.status).toBe(SampleCheckResult.ValidationError);
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('re-throws when request is canceled by AbortController', async () => {
      const abortError = new Error('Canceled');
      abortError.name = 'CanceledError';
      (apiClient.post as any).mockRejectedValueOnce(abortError);

      await expect(
        sampleValidationService.checkSample({ sampleNumber: '150', year: 2026 })
      ).rejects.toThrow();
    });
  });

  describe('checkBatch', () => {
    it('handles batch validation response with duplicates correctly', async () => {
      const mockBatchResponse = {
        hasDuplicates: true,
        hasDeletedWarnings: false,
        results: [
          { status: SampleCheckResult.Unique, code: 'UNIQUE', sampleNumber: '101', normalizedSampleNumber: '101', message: 'متاح' },
          { status: SampleCheckResult.DuplicateActive, code: 'SAMPLE_DUPLICATE_ACTIVE', sampleNumber: '102', normalizedSampleNumber: '102', message: 'مكرر' }
        ]
      };
      (apiClient.post as any).mockResolvedValueOnce({ data: mockBatchResponse });

      const result = await sampleValidationService.checkBatch({
        sampleNumbers: ['101', '102'],
        year: 2026
      });

      expect(result.hasDuplicates).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[1].status).toBe(SampleCheckResult.DuplicateActive);
    });
  });
});
