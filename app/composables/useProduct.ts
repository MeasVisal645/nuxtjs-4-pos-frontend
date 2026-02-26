import { ref, watch, onMounted } from 'vue'
import type { PageResponse, Product } from "~/types"

export function useProduct() {
  // ---------- DATA ----------
  const products = ref<Product[]>([])
  const pending = ref(false)
  const loadError = ref<any>(null)

  // ---------- PAGINATION ----------
  const pageNumber = ref(1)
  const pageSize = ref(10)
  const totalRecords = ref(0)
  const totalPages = ref(0)

  // ---------- SEARCH ----------
  const search = ref('')

  // ---------- FILTER ----------
  const isActive = ref<boolean | null>(null)

  // ---------- MODAL ----------
  const modalOpen = ref(false)
  const selected = ref<Product | null>(null)

  function openModal(row: Product) {
    selected.value = row
    modalOpen.value = true
  }

  function closeModal() {
    modalOpen.value = false
    selected.value = null
  }

  // ---------- FETCH ----------
  async function fetchPagination() {
    try {
      pending.value = true
      loadError.value = null

      const query = new URLSearchParams({
        pageNumber: String(pageNumber.value),
        pageSize: String(pageSize.value),
      })

      if (search.value.trim()) {
        query.append('search', search.value.trim())
      }

      if (isActive.value !== null) {
        query.append('isActive', String(isActive.value))
      }

      const res = await useApi<PageResponse<Product>>(
        `/product?${query.toString()}`
      )

      products.value = res.content ?? []
      totalRecords.value = res.totalRecords ?? 0
      totalPages.value = res.totalPages ?? 0
      pageNumber.value = res.pageNumber ?? pageNumber.value
      pageSize.value = res.pageSize ?? pageSize.value

    } catch (e) {
      loadError.value = e
      products.value = []
      totalRecords.value = 0
      totalPages.value = 0
      console.error('category fetch error:', e)
    } finally {
      pending.value = false
    }
  }

  // ---------- DELETE ----------
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

  // ---------- INITIAL LOAD ----------
  onMounted(fetchPagination)

  // ---------- WATCHERS ----------
  watch([pageNumber, pageSize, search, isActive], fetchPagination)

  return {
    products,
    pageNumber,
    pageSize,
    totalRecords,
    totalPages,
    pending,
    loadError,
    modalOpen,
    selected,
    openModal,
    closeModal,
    search,
    isActive,
    fetchPagination,
    deleteById
  }
}