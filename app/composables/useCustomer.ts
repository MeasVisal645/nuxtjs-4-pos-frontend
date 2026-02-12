import type { PageResponse, Customer } from "~/types";

export function useCustomer() {
  const showModal = ref(false);
  const isEditOpen = ref(false);
  const modalMode = ref<"view" | "edit">("view");

  const customers = ref<Customer[]>([]);
  const pending = ref(false);
  const loadError = ref<any>(null);
  const selectedId = ref<string>("");

  const selectedItem = ref({
    id: null,
    code: "" as string | undefined,
    name: "" as string | undefined,
    active: "" as string | undefined,
  });

  /** ===========================
   * Fetch All Customer Pagination
   * ========================== */
  const pageNumber = ref(1);
  const pageSize = ref(10);
  const totalRecords = ref(0);
  const totalPages = ref(0);

  async function fetchPagination() {
    try {
      pending.value = true;
      loadError.value = null;

      const res = await useApi<PageResponse<Customer>>(
        `/customer?pageNumber=${pageNumber.value}`,
      );

      customers.value = res.content;
      totalRecords.value = res.totalRecords;
      totalPages.value = res.totalPages;
    } catch (e) {
      loadError.value = e;
      customers.value = [];
    } finally {
      pending.value = false;
    }
  }

  onMounted(fetchPagination);
  watch([pageNumber, pageSize], fetchPagination);

  /** ===========================
   * View Policy Modal
   * ========================== */
  const viewById = (ids: string[]) => {
    if (ids.length !== 1) return;
    selectedId.value = ids[0] ?? "";
    modalMode.value = "view";
    showModal.value = true;
  };

  /** ===========================
   * RETURN EVERYTHING
   * ========================== */
  return {
    // state
    customers,
    showModal,
    isEditOpen,
    modalMode,
    selectedId,
    selectedItem,
    pageNumber,
    pageSize,
    totalRecords,
    totalPages,

    // actions
    fetchPagination,
    viewById,
    pending,
    loadError,
  };
}
