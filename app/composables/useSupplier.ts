import type {
  PageResponse,
  Supplier,
  SupplierContact,
  SupplierWithContacts,
} from "~/types";

export function useSupplier() {
  const suppliers = ref<Supplier[]>([]);
  const pending = ref(false);
  const loadError = ref<any>(null);

  /** ===========================
   * Fetch All Supplier Pagination
   * ========================== */
  const pageNumber = ref(1);
  const pageSize = ref(10);
  const totalRecords = ref(0);
  const totalPages = ref(0);

  async function fetchPagination() {
    try {
      pending.value = true;
      loadError.value = null;

      const res = await useApi<PageResponse<SupplierWithContacts>>(
        `/supplier?pageNumber=${pageNumber.value}`,
      );

      suppliers.value = res.content.map((item) => ({
        ...item.supplier,
        supplierContact: item.supplierContact,
      }));
    } catch (e) {
      loadError.value = e;
      suppliers.value = [];
    } finally {
      pending.value = false;
    }
  }

  onMounted(fetchPagination);
  watch([pageNumber, pageSize], fetchPagination);

  type SupplierRow = Supplier & { supplierContact: SupplierContact[] };
  const detailOpen = ref(false);
  const selectedSupplier = ref<SupplierRow | null>(null);

  function openDetail(row: SupplierRow) {
    selectedSupplier.value = row;
    detailOpen.value = true;
  }

  /** ===========================
   * RETURN EVERYTHING
   * ========================== */
  return {
    // state
    suppliers,
    pageNumber,
    pageSize,
    totalRecords,
    totalPages,
    openDetail,

    // actions
    pending,
    loadError,
  };
}
