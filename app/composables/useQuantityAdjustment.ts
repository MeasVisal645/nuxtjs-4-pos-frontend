import type { PageResponse, QuantityAdjustment } from "~/types";

export function useQuantityAdjustment() {
  const config = useRuntimeConfig();

  const showModal = ref(false);
  const isEditOpen = ref(false);
  const modalMode = ref<"view" | "edit">("view");

  const quantityAdjustment = ref<QuantityAdjustment[]>([]);
  const pending = ref(false);
  const loadError = ref<any>(null);
  const selectedId = ref<string>("");

  const selectedItem = ref({
    id: null,
    firstName: "" as string | undefined,
    lastName: "" as string | undefined,
    email: "" as string | undefined,
  });

  /** ===========================
   * Fetch All Product Pagination
   * ========================== */
  const pageNumber = ref(1);
  const pageSize = ref(10);
  const totalRecords = ref(0);
  const totalPages = ref(0);

  async function fetchPagination() {
    try {
      pending.value = true;
      loadError.value = null;

      const res = await useApi<PageResponse<QuantityAdjustment>>(
        `/quantityAdjustment?pageNumber=${pageNumber.value}`,
      );

      quantityAdjustment.value = res.content;
      totalRecords.value = res.totalRecords;
      totalPages.value = res.totalPages;
    } catch (e) {
      loadError.value = e;
      quantityAdjustment.value = [];
    } finally {
      pending.value = false;
    }
  }

  onMounted(fetchPagination);
  watch([pageNumber, pageSize], fetchPagination);

  /** ===========================
   * RETURN EVERYTHING
   * ========================== */
  return {
    // state
    quantityAdjustment,
    showModal,
    isEditOpen,
    modalMode,
    selectedId,
    selectedItem,

    // actions
    fetch,
    pending,
    loadError,
    pageNumber,
    pageSize,
    totalPages,
    totalRecords,
  };
}
