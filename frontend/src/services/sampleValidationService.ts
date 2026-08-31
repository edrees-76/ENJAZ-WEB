import apiClient from './apiClient';

export enum SampleCheckResult {
  Unique = 0,
  DuplicateActive = 1,
  DuplicateInPayload = 2,
  FoundInDeleted = 3,
  ValidationError = 4,
}

export interface SampleUniquenessResult {
  status: SampleCheckResult;
  code: string;
  sampleNumber: string;
  normalizedSampleNumber: string;
  message: string;
  matchedSource?: string;
  matchedIdentifier?: string;
  matchedSender?: string;
  year?: number;
  matchedRecordId?: number;
  matchedDate?: string;
}

export interface SampleValidationRequest {
  sampleNumber: string;
  year: number;
  sender?: string;
  excludeCertificateId?: number;
  excludeReceptionId?: number;
  sourceReceptionId?: number;
}

export interface SampleBatchValidationRequest {
  sampleNumbers: string[];
  year: number;
  sender?: string;
  excludeCertificateId?: number;
  excludeReceptionId?: number;
  sourceReceptionId?: number;
}

export interface SampleBatchValidationResponse {
  hasDuplicates: boolean;
  hasDeletedWarnings: boolean;
  results: SampleUniquenessResult[];
}

export const sampleValidationService = {
  /**
   * فحص تفرد عينة مفردة في الوقت الفعلي مع دعم AbortSignal لإلغاء الطلبات القديمة
   */
  async checkSample(
    request: SampleValidationRequest,
    signal?: AbortSignal
  ): Promise<SampleUniquenessResult> {
    try {
      const response = await apiClient.post<SampleUniquenessResult>(
        '/sample-validation/check',
        request,
        {
          signal,
          // تجنب إظهار Toast عام لأخطاء التحقق العادية
          // @ts-expect-error Custom Axios config
          skipGlobalErrorHandler: true,
        }
      );
      return response.data;
    } catch (err: unknown) {
      // إذا تم إلغاء الطلب من قبل AbortController، نرمي الخطأ ليتعامل معه المستدعي
      const errorObj = err as { name?: string; code?: string };
      if (errorObj?.name === 'CanceledError' || errorObj?.name === 'AbortError' || errorObj?.code === 'ERR_CANCELED') {
        throw err;
      }
      return {
        status: SampleCheckResult.ValidationError,
        code: 'VALIDATION_ERROR',
        sampleNumber: request.sampleNumber,
        normalizedSampleNumber: '',
        message: 'تعذر التحقق من تفرد العينة (فشل الاتصال بالخادم).',
      };
    }
  },

  /**
   * فحص دفعة عينات دفعة واحدة (Batch Check)
   */
  async checkBatch(
    request: SampleBatchValidationRequest,
    signal?: AbortSignal
  ): Promise<SampleBatchValidationResponse> {
    try {
      const response = await apiClient.post<SampleBatchValidationResponse>(
        '/sample-validation/check-batch',
        request,
        {
          signal,
          // @ts-expect-error Custom Axios config
          skipGlobalErrorHandler: true,
        }
      );
      return response.data;
    } catch (err: unknown) {
      const errorObj = err as { name?: string; code?: string };
      if (errorObj?.name === 'CanceledError' || errorObj?.name === 'AbortError' || errorObj?.code === 'ERR_CANCELED') {
        throw err;
      }
      return {
        hasDuplicates: false,
        hasDeletedWarnings: false,
        results: request.sampleNumbers.map((sn) => ({
          status: SampleCheckResult.ValidationError,
          code: 'VALIDATION_ERROR',
          sampleNumber: sn,
          normalizedSampleNumber: '',
          message: 'تعذر التحقق من الدفعة.',
        })),
      };
    }
  },
};
