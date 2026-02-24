import type { PageResponse, EmployeeUser } from "~/types";

export function useEmployee() {
  const employees = ref<EmployeeUser[]>([]);
  const pending = ref(false);
  const loadError = ref<any>(null);

  const pageNumber = ref(1);
  const pageSize = ref(10);
  const totalRecords = ref(0);
  const totalPages = ref(0);

  // Contacts modal state
  const modalOpen = ref(false);
  const selected = ref<EmployeeUser | null>(null);

  function openModal(row: EmployeeUser) {
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

      const res = await useApi<PageResponse<EmployeeUser>>(
        `/employee?pageNumber=${pageNumber.value}`,
      );

      employees.value = res.content ?? [];

      totalRecords.value = res.totalRecords ?? 0;
      totalPages.value = res.totalPages ?? 0;

      pageNumber.value = res.pageNumber ?? pageNumber.value;
      pageSize.value = res.pageSize ?? pageSize.value;
    } catch (e) {
      loadError.value = e;
      employees.value = [];
      totalRecords.value = 0;
      totalPages.value = 0;
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
      await useApi(`/employee/delete?id=${id}`, {
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
    // data
    employees,
    pageNumber,
    pageSize,
    totalRecords,
    totalPages,
    pending,
    loadError,

    // modal
    modalOpen,
    selected,
    openModal,
    closeModal,

    // actions
    fetchPagination,
    deleteById,
  };
}
