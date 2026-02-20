let refreshing: Promise<void> | null = null

export async function api<T>(url: string, opts: any = {}): Promise<T> {
  try {
    return await $fetch<T>(url, {
      credentials: 'include',
      ...opts,
    })
  } catch (err: any) {
    const status = err?.response?.status
    if (status === 401 && url !== '/api/auth/refresh') {
      await refreshOnce()
      return await $fetch<T>(url, { credentials: 'include', ...opts })
    }
    throw err
  }
}

async function refreshOnce() {
  if (!refreshing) {
    refreshing = $fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    }).then(() => {}).finally(() => {
      refreshing = null
    })
  }
  return refreshing
}
