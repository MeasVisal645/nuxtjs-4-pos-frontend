import type { PageResponse, Customer } from "~/types";

export function useCustomer() {
  const customers = ref<Customer[]>([]);
  const pending = ref(false);
  const loadError = ref<any>(null);

  // ---------- PAGINATION ----------
  const pageNumber = ref(1);
  const pageSize = ref(10);
  const totalRecords = ref(0);
  const totalPages = ref(0);

  // ---------- SEARCH ----------
  const search = ref('');

  // ---------- FETCH ----------
  async function fetchPagination() {
    try {
      pending.value = true;
      loadError.value = null;

      const query = new URLSearchParams({
        pageNumber: String(pageNumber.value),
        pageSize: String(pageSize.value),
      });

      if (search.value.trim()) {
        query.append('search', search.value.trim());
      }

      const res = await useApi<PageResponse<Customer>>(
        `/customer?${query.toString()}`
      );

      customers.value = res.content;
      totalRecords.value = res.totalRecords;
      totalPages.value = res.totalPages;
      pageNumber.value = res.pageNumber ?? pageNumber.value;
      pageSize.value = res.pageSize ?? pageSize.value;
    } catch (e) {
      loadError.value = e;
      customers.value = [];
      totalRecords.value = 0;
      totalPages.value = 0;
    } finally {
      pending.value = false;
    }
  }

  onMounted(fetchPagination);
  watch([pageNumber, pageSize, search], fetchPagination);

  // ---------- DELETE ----------
  async function deleteById(id: number) {
    try {
      pending.value = true;
      loadError.value = null;
      await useApi(`/customer/delete?id=${id}`, {
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
    customers,
    pageNumber,
    pageSize,
    totalRecords,
    totalPages,
    search,
    fetchPagination,
    deleteById,
    pending,
    loadError,
  };
}