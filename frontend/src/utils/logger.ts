export function logError(error: any) {
  console.error('[API ERROR]', {
    message: error?.message,
    status: error?.response?.status,
    url: error?.config?.url,
    method: error?.config?.method,
    data: error?.response?.data,
    timestamp: new Date().toISOString()
  })
}
