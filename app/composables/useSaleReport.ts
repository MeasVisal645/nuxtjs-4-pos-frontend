import type { PageResponse, OrderItemDetails, OrderItems } from "~/types";

export function useSaleReport() {
  const orderItems = ref<OrderItemDetails[]>([]);
  const pending = ref(false);
  const loadError = ref<any>(null);

  const pageNumber = ref(1);
  const pageSize = ref(10);
  const totalRecords = ref(0);
  const totalPages = ref(0);

  // Contacts modal state
  const modalOpen = ref(false);
  const selected = ref<OrderItemDetails | null>(null);

  function openModal(row: OrderItemDetails) {
    selected.value = row;
    modalOpen.value = true;
  }

  function closeModal() {
    modalOpen.value = false;
    selected.value = null;
  }

  async function fetchPagination() {
    try {
      pending.value = true;
      loadError.value = null;

      const res = await useApi<PageResponse<OrderItemDetails>>(
        `/order?pageNumber=${pageNumber.value}`,
      );

      orderItems.value = res.content ?? [];
      totalRecords.value = res.totalRecords ?? 0;
      totalPages.value = res.totalPages ?? 0;

      // keep these in sync if backend returns them
      pageNumber.value = res.pageNumber ?? pageNumber.value;
      pageSize.value = res.pageSize ?? pageSize.value;
    } catch (e) {
      loadError.value = e;
      orderItems.value = [];
      totalRecords.value = 0;
      totalPages.value = 0;
      console.log('orderItem fetch error:', e)

    } finally {
      pending.value = false;
    }
  }

  onMounted(fetchPagination);
  watch([pageNumber, pageSize], fetchPagination);

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
  };
}
