import { ref, watch, onMounted, type Ref } from 'vue'
import type { PageResponse, OrderItemDetails, Period, Range } from "~/types"

export function useSaleReport(
  period?: Ref<Period>,
  range?: Ref<Range>
) {
  const orderItems = ref<OrderItemDetails[]>([])
  const pending = ref(false)
  const loadError = ref<any>(null)

  const pageNumber = ref(1)
  const pageSize = ref(10)
  const totalRecords = ref(0)
  const totalPages = ref(0)

  // Modal state
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

  async function fetchPagination() {
    try {
      pending.value = true
      loadError.value = null

      // 🔥 Build query dynamically
      const query = new URLSearchParams({
        pageNumber: String(pageNumber.value),
        pageSize: String(pageSize.value),
      })

      if (period?.value) {
        query.append('period', String(period.value))
      }

      if (range?.value?.start) {
        query.append('from', String(range.value.start))
      }

      if (range?.value?.end) {
        query.append('to', String(range.value.end))
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
      console.log('orderItem fetch error:', e)
    } finally {
      pending.value = false
    }
  }

  // Initial load
  onMounted(fetchPagination)

  // Pagination change
  watch([pageNumber, pageSize], fetchPagination)

  // 🔥 Date / Period change
  if (period && range) {
    watch(
      [period, range],
      () => {
        pageNumber.value = 1 // reset page
        fetchPagination()
      },
      { deep: true }
    )
  }

  return {
    // data
    orderItems,

    // pagination
    pageNumber,
    pageSize,
    totalRecords,
    totalPages,

    // ui state
    pending,
    loadError,

    // modal
    modalOpen,
    selected,
    openModal,
    closeModal,

    // actions
    fetchPagination,
  }
}