import type { Employee } from "~/types";

export function useEmployee() {
  const config = useRuntimeConfig();

  const showModal = ref(false);
  const isEditOpen = ref(false);
  const modalMode = ref<"view" | "edit">("view");

  const employees = ref<Employee[]>([]);
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
   * Fetch All Policies
   * ========================== */
  async function fetch() {
    try {
      pending.value = true;
      loadError.value = null;
      employees.value = await useApi<Employee[]>("/employee/all");
    } catch (e) {
      loadError.value = e;
      console.error("Fetch employees failed:", e);
      employees.value = [];
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
        `${config.public.apiBaseUrl}/api/v1/employee/update?id=${id}`,
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
    employees,
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
