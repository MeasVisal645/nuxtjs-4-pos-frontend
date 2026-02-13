import type { PageResponse, Product } from "~/types";

export function useProduct() {
  const showModal = ref(false);
  const isEditOpen = ref(false);
  const modalMode = ref<"view" | "edit">("view");

  const products = ref<Product[]>([]);
  const pending = ref(false);
  const loadError = ref<any>(null);
  const selectedId = ref<string>("");

  const selectedItem = ref({
    id: null,
    code: "" as string | undefined,
    name: "" as string | undefined,
    cost: "" as string | undefined,
    price: "" as string | undefined,
    quantity: "" as string | undefined,
    unit: "" as string | undefined,
    active: "" as string | undefined,
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
      pending.value = true
      loadError.value = null

      const res = await useApi<PageResponse<Product>>(
        `/product?pageNumber=${pageNumber.value}`
      )

      products.value = res.content ?? []
      totalRecords.value = res.totalRecords ?? 0
      totalPages.value = res.totalPages ?? 0

      // keep in sync (optional but good)
      pageNumber.value = res.pageNumber ?? pageNumber.value
      pageSize.value = res.pageSize ?? pageSize.value
    } catch (e) {
      loadError.value = e
      products.value = []
      totalRecords.value = 0
      totalPages.value = 0
    } finally {
      pending.value = false
    }
  }


  onMounted(fetchPagination);
  watch([pageNumber, pageSize], fetchPagination);

  /** ===========================
   * RETURN EVERYTHING
   * ========================== */
  return {
    // state
    fetchPagination,
    products,
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
    pending,
    loadError,
  };
}
