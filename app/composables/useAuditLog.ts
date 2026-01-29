import type { AuditLog, PageResponse } from "~/types";

export function useAuditLog() {
  const config = useRuntimeConfig();

  const showModal = ref(false);
  const isEditOpen = ref(false);
  const modalMode = ref<"view" | "edit">("view");

  const auditLog = ref<AuditLog[]>([]);
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

      const res = await useApi<PageResponse<AuditLog>>(
        `/admin/auditlog?pageNumber=${pageNumber.value}`,
      );

      auditLog.value = res.content;
      totalRecords.value = res.totalRecords;
      totalPages.value = res.totalPages;
    } catch (e) {
      loadError.value = e;
      auditLog.value = [];
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
    auditLog,
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
