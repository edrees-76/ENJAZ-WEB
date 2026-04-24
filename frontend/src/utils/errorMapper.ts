export function mapError(error: any): string {
  // Network error
  if (!error.response) {
    return "تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت"
  }

  // Backend provided message
  if (error.response?.data?.message) {
    return error.response.data.message
  }

  const status = error.response.status

  switch (status) {
    case 400:
      return "البيانات المدخلة غير صحيحة، يرجى المراجعة"
    case 401:
      return "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً"
    case 403:
      return "ليس لديك الصلاحيات الكافية لتنفيذ هذا الإجراء"
    case 404:
      return "العنصر المطلوب غير موجود"
    case 409:
      return "يوجد تعارض في البيانات (عنصر مكرر)"
    case 500:
      return "حدث خطأ داخلي في الخادم، يرجى المحاولة لاحقاً"
    default:
      return "حدث خطأ غير متوقع"
  }
}
