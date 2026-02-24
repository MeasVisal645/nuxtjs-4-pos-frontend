import type { PageResponse, Product } from "~/types";

export function useProduct() {
  const showModal = ref(false);
  const isEditOpen = ref(false);
  const modalMode = ref<"view" | "edit">("view");

  const products = ref<Product[]>([]);
  const pending = ref(false);
  const loadError = ref<any>(null);

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
  * Delete By Id
  * ========================== */
  async function deleteById(id: number) {
    try {
      pending.value = true;
      loadError.value = null;
      await useApi(`/product/delete?id=${id}`, {
        method: "DELETE",
      });
      await fetchPagination();
    } catch (e) {
      loadError.value = e;
    } finally {
      pending.value = false;
    }
  }

  /** ===========================
   * RETURN EVERYTHING
   * ========================== */
  return {
    // data
    products,

    // state
    showModal,
    isEditOpen,
    modalMode,
    pageNumber,
    pageSize,
    totalRecords,
    totalPages,

    // actions
    pending,
    loadError,
    fetchPagination,
    deleteById,

  };
}
