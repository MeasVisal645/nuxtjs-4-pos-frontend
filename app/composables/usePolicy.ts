export function usePolicy() {
  const config = useRuntimeConfig();

  const showModal = ref(false);
  const isEditOpen = ref(false);
  const modalMode = ref<"view" | "edit">("view");

  const policies = ref<any[]>([]);
  const selectedPolicyId = ref<string>("");

  const selectedPolicyItem = ref({
    id: null,
    policyNo: "" as string | undefined,
    insuredName: "" as string | undefined,
    sex: "" as string | undefined,
    dob: "" as string | undefined,
    cardNo: "" as string | undefined,
    remark: "" as string | undefined,
    isCancel: "" as string | undefined,
    inceptionDate: "" as string | undefined,
    expiredDate: "" as string | undefined,
    issueDate: "" as string | undefined,
  });

  /** ===========================
   * Fetch All Policies
   * ========================== */
  const fetchPolicy = async () => {
    try {
      const url = `${config.public.apiBaseUrl}/api/v1/policy/all`;
      const response = await $fetch<any>(url);
      policies.value = response?.data ?? [];
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  /** ===========================
   * View Policy Modal
   * ========================== */
  const viewPolicyById = (ids: string[]) => {
    if (ids.length !== 1) return;
    selectedPolicyId.value = ids[0] ?? "";
    modalMode.value = "view";
    showModal.value = true;
  };

  /** ===========================
   * Edit Modal
   * ========================== */
  const editPolicyById = (ids: string[]) => {
    if (ids.length !== 1) return;
    selectedPolicyId.value = ids[0] ?? "";
    modalMode.value = "edit";
    showModal.value = true;
  };

  const handlePolicyUpdated = () => {
    fetchPolicy();
    showModal.value = false;
  };

  /** ===========================
   * Inline Edit (your UModal edit)
   * ========================== */
  function openEditModal(policy: any) {
    selectedPolicyItem.value = { ...policy };
    isEditOpen.value = true;
  }

  async function submitEdit() {
    try {
      const id = selectedPolicyItem.value.id;

      await $fetch(`${config.public.apiBaseUrl}/api/v1/item/update?id=${id}`, {
        method: "PUT",
        body: selectedPolicyItem.value,
      });

      await fetchPolicy();
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
    policies,
    showModal,
    isEditOpen,
    modalMode,
    selectedPolicyId,
    selectedPolicyItem,

    // actions
    fetchPolicy,
    viewPolicyById,
    editPolicyById,
    handlePolicyUpdated,
    openEditModal,
    submitEdit,
  };
}
