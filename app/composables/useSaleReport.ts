import { ref, watch, onMounted, shallowRef, type Ref } from 'vue'
import type { PageResponse, OrderItemDetails, Period, Range } from "~/types"
import { sub } from 'date-fns'

export function useSaleReport(
  period?: Ref<Period>,
  range?: Ref<Range>
) {
  // ---------- DATA ----------
  const orderItems = ref<OrderItemDetails[]>([])
  const pending = ref(false)
  const loadError = ref<any>(null)

  // ---------- PAGINATION ----------
  const pageNumber = ref(1)
  const pageSize = ref(10)
  const totalRecords = ref(0)
  const totalPages = ref(0)

  // ---------- SEARCH ----------
  const search = ref('')

  // ---------- MODAL ----------
  const modalOpen = ref(false)
  const selected = ref<OrderItemDetails | null>(null)

  function openModal(row: OrderItemDetails) {
    selected.value = row
    modalOpen.value = true
  }

  function closeModal() {
    modalOpen.value = false
    selected.value = null
  }

  // ---------- RANGE ----------
  const internalRange = range ?? shallowRef<Range>({
    start: sub(new Date(), { days: 14 }),
    end: new Date(),
  })

  // ---------- FETCH ----------
  async function fetchPagination() {
    try {
      pending.value = true
      loadError.value = null

      const query = new URLSearchParams({
        pageNumber: String(pageNumber.value),
        pageSize: String(pageSize.value),
      })

      const startDate = internalRange.value?.start
      const endDate = internalRange.value?.end

      if (startDate) {
        query.append('startDate', startDate.toISOString().slice(0, 10))
      }

      if (endDate) {
        query.append('endDate', endDate.toISOString().slice(0, 10))
      }

      if (search.value?.trim()) {
        query.append('search', search.value.trim())
      }

      const res = await useApi<PageResponse<OrderItemDetails>>(
        `/order?${query.toString()}`
      )

      orderItems.value = res.content ?? []
      totalRecords.value = res.totalRecords ?? 0
      totalPages.value = res.totalPages ?? 0
      pageNumber.value = res.pageNumber ?? pageNumber.value
      pageSize.value = res.pageSize ?? pageSize.value

    } catch (e) {
      loadError.value = e
      orderItems.value = []
      totalRecords.value = 0
      totalPages.value = 0
      console.error('orderItem fetch error:', e)
    } finally {
      pending.value = false
    }
  }

  // ---------- INITIAL LOAD ----------
  onMounted(fetchPagination)

  // ---------- WATCHERS ----------
  watch([pageNumber, pageSize, search, internalRange], fetchPagination, { deep: true })

  if (period && range) {
    watch(
      [period, range],
      () => {
        pageNumber.value = 1
        fetchPagination()
      },
      { deep: true }
    )
  }

  return {
    orderItems,
    pageNumber,
    pageSize,
    totalRecords,
    totalPages,
    pending,
    loadError,
    modalOpen,
    selected,
    openModal,
    closeModal,
    search,
    range: internalRange,
    fetchPagination,
  }
}