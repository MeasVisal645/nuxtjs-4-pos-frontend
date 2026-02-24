import type { PageResponse, Category } from "~/types";

export function useCategory() {
  const showModal = ref(false);
  const isEditOpen = ref(false);
  const modalMode = ref<"view" | "edit">("view");

  const categories = ref<Category[]>([]);
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
      pending.value = true;
      loadError.value = null;

      const res = await useApi<PageResponse<Category>>(
        `/category?pageNumber=${pageNumber.value}`,
      );

      categories.value = res.content;
      totalRecords.value = res.totalRecords;
      totalPages.value = res.totalPages;
    } catch (e) {
      loadError.value = e;
      categories.value = [];
    } finally {
      pending.value = false;
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
      await useApi(`/category/delete?id=${id}`, {
        method: "DELETE",
      });
      await fetchPagination();
    } catch (e) {
      loadError.value = e;
    } finally {
      pending.value = false;
    }
  }

  return {
    // state
    categories,
    showModal,
    isEditOpen,
    modalMode,
    pageNumber,
    pageSize,
    totalRecords,
    totalPages,
    deleteById,

    // actions
    fetchPagination,
    pending,
    loadError,
  };
}
