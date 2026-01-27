import type { Product } from "~/types";

export function useProduct() {
  const config = useRuntimeConfig();

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
   * Fetch All Policies
   * ========================== */
  async function fetch() {
    try {
      pending.value = true;
      loadError.value = null;
      products.value = await useApi<Product[]>("/product/all");
    } catch (e) {
      loadError.value = e;
      console.error("Fetch products failed:", e);
      products.value = [];
    } finally {
      pending.value = false;
    }
  }

  onMounted(fetch);

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
   * Edit Modal
   * ========================== */
  const editById = (ids: string[]) => {
    if (ids.length !== 1) return;
    selectedId.value = ids[0] ?? "";
    modalMode.value = "edit";
    showModal.value = true;
  };

  const handleUpdated = () => {
    fetch();
    showModal.value = false;
  };

  /** ===========================
   * Inline Edit (your UModal edit)
   * ========================== */
  function openEditModal(policy: any) {
    selectedItem.value = { ...policy };
    isEditOpen.value = true;
  }

  async function submitEdit() {
    try {
      const id = selectedItem.value.id;

      await $fetch(
        `${config.public.apiBaseUrl}/api/v1/product/update?id=${id}`,
        {
          method: "PUT",
          body: selectedItem.value,
        },
      );

      await fetch();
      isEditOpen.value = false;
    } catch (error) {
      console.error("Update failed:", error);
    }
  }

  /** ===========================
   * RETURN EVERYTHING
   * ========================== */
  return {
    // state
    products,
    showModal,
    isEditOpen,
    modalMode,
    selectedId,
    selectedItem,

    // actions
    fetch,
    viewById,
    editById,
    handleUpdated,
    openEditModal,
    submitEdit,
    pending,
    loadError,
  };
}
