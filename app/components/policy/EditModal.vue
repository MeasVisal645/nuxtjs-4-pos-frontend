<script setup lang="ts">
import { ref, watch } from "vue";
import { useRuntimeConfig } from "#app";

const toast = useToast();
const config = useRuntimeConfig();

const props = defineProps({
  selectedPolicyId: { type: String, required: true },
  open: { type: Boolean, default: false }
});



const emit = defineEmits(["update:open", "updated"]);

const isOpen = ref(props.open);
const policy = ref<any>(null);
const isLoading = ref(false);

const genderOptions = ["Male", "Female", "Other"];
const remarkOptions = ["New Policy", "Renew Policy", "Cancelled"];

// ------------------------
// Sync modal state
// ------------------------
watch(
  () => props.open,
  (val) => {
    isOpen.value = val;
    if (val) fetchPolicy();
  }
);

watch(isOpen, (val) => emit("update:open", val));

// ------------------------
// Helpers
// ------------------------
const toInputDate = (value: string | null) => {
  if (!value) return "";
  return value.split("T")[0]; // Convert: 2025-01-01T00:00:00 → 2025-01-01
};

// Fetch policy
const fetchPolicy = async () => {
  if (!props.selectedPolicyId) return;
  isLoading.value = true;

  try {
    const response = await $fetch<any>(
      `${config.public.apiBaseUrl}/api/v1/policy/${props.selectedPolicyId}`
    );

    const p = response?.data;
    if (!p) throw new Error("Invalid API response");

    // Normalize dates for <input type="date">
    p.inceptionDate = toInputDate(p.inceptionDate);
    p.expiredDate = toInputDate(p.expiredDate);
    p.issueDate = toInputDate(p.issueDate);
    p.dob = toInputDate(p.dob);

    policy.value = p;

  } catch (error: any) {
    toast.add({
      title: "Failed to load policy",
      description: error?.data?.message || error?.message || "Unknown error",
      color: "error"
    });
  } finally {
    isLoading.value = false;
  }
};

// Save policy
const updatePolicy = async () => {
  if (!policy.value) return;

  const payload = { ...policy.value };

  try {
    await $fetch(
      `${config.public.apiBaseUrl}/api/v1/policy/update?id=${props.selectedPolicyId}`,
      { method: "PUT", body: payload }
    );
    console.log(payload);
    
    toast.add({
      title: "Updated",
      description: "Policy updated successfully!",
      color: "success"
    });

    emit("updated");

  } catch (error: any) {
    toast.add({
      title: "Failed",
      description: error?.data?.message || "Something went wrong",
      color: "error"
    });
  }
};

watch(() => props.open, val => isOpen.value = val)
watch(isOpen, val => emit('update:open', val))

</script>

<template>
  <UModal v-model:open="isOpen" title="Edit Policy">
    <template #body>
      <UForm
        class="space-y-4"
        v-if="policy"
        @submit.prevent="updatePolicy"
      >
        <UFormField label="Policy No">
          <UInput v-model="policy.policyNo" readonly />
        </UFormField>

        <UFormField label="Policy Holder">
          <UInput v-model="policy.policyHolder" />
        </UFormField>

        <UFormField label="Inception Date">
          <UInput type="date" v-model="policy.inceptionDate" />
        </UFormField>

        <UFormField label="Expiry Date">
          <UInput type="date" v-model="policy.expiredDate" />
        </UFormField>

        <UFormField label="Issue Date">
          <UInput type="date" v-model="policy.issueDate" />
        </UFormField>

        <UFormField label="Insured Name">
          <UInput v-model="policy.insuredName" />
        </UFormField>

        <UFormField label="Date of Birth">
          <UInput type="date" v-model="policy.dob" />
        </UFormField>

        <UFormField label="Gender">
          <USelectMenu :items="genderOptions" v-model="policy.gender" />
        </UFormField>

        <UFormField label="Card No">
          <UInput v-model="policy.cardNo" />
        </UFormField>

        <UFormField label="Remark">
          <USelectMenu :items="remarkOptions" v-model="policy.remark" />
        </UFormField>

        <div class="flex justify-end gap-2 mt-3">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="isOpen = false"
          />

          <UButton
            label="Save"
            color="primary"
            variant="solid"
            type="submit"
          />
        </div>
      </UForm>

      <div v-else class="py-6 text-center text-muted">
        Loading policy...
      </div>
    </template>
  </UModal>
</template>
