import type { PageResponse, SupplierWithContacts } from "~/types";

export function useSupplier() {
  const suppliers = ref<SupplierWithContacts[]>([]);
  const pending = ref(false);
  const loadError = ref<any>(null);

  const pageNumber = ref(1);
  const pageSize = ref(10);
  const totalRecords = ref(0);
  const totalPages = ref(0);

  // Contacts modal state
  const modalOpen = ref(false);
  const selected = ref<SupplierWithContacts | null>(null);

  function openModal(row: SupplierWithContacts) {
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

      const res = await useApi<PageResponse<SupplierWithContacts>>(
        `/supplier?pageNumber=${pageNumber.value}`,
      );

      suppliers.value = res.content ?? [];

      totalRecords.value = res.totalRecords ?? 0;
      totalPages.value = res.totalPages ?? 0;

      // keep these in sync if backend returns them
      pageNumber.value = res.pageNumber ?? pageNumber.value;
      pageSize.value = res.pageSize ?? pageSize.value;
    } catch (e) {
      loadError.value = e;
      suppliers.value = [];
      totalRecords.value = 0;
      totalPages.value = 0;
    } finally {
      pending.value = false;
    }
  }

  onMounted(fetchPagination);
  watch([pageNumber, pageSize], fetchPagination);

  return {
    // data
    suppliers,

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
