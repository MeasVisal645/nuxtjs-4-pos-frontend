<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { useRuntimeConfig } from "#app";
const toast = useToast();
const config = useRuntimeConfig()

// ---------- Props ----------
const props = defineProps({
  policyNo: String,
  policyId: Number,
  inceptionDate: String,
  expiredDate: String,
  issueDate: String
});
const emit = defineEmits(["created"]);

// ---------- Modal ----------
const open = ref(false);

// ---------- Form State ----------
const state = reactive({
  policyId: props.policyId,
  policyNo: props.policyNo,
  insuredName: "",
  sex: "",
  dob: "",
  cardNo: "",
  remark: "",
  isCancel: "No",
  inceptionDate: props.inceptionDate,
  expiredDate: props.expiredDate,
  issueDate: props.issueDate
});

// ---------- Options ----------
const genderOptions = ["Male", "Female", "Other"];
const remarkOptions = ["New Policy", "Renew Policy", "Cancelled"];
const cancelOptions = ["No", "Yes"];

// Watch props for updates
watch(() => props.policyNo, (newVal) => (state.policyNo = newVal));

// Handle remark selection
const handleRemarkChange = (newRemark: string) => {
  state.remark = newRemark;
  state.isCancel = newRemark === "Cancelled" ? "No" : "Yes";
};

// Reset form
const resetForm = () => {
  state.insuredName = "";
  state.sex = "";
  state.dob = "";
  state.cardNo = "";
  state.remark = "";
  state.isCancel = "No";
  state.inceptionDate = props.inceptionDate;
  state.expiredDate = props.expiredDate;
  state.issueDate = props.issueDate;
};

// ---------- Submit ----------
const createItem = async () => {
  if (!state.insuredName) {
    toast.add({
      title: "Validation Error",
      description: "Insured name is required",
      color: "error"
    });
    return;
  }

  try {
    const payload = {
      ...state,
      dob: state.dob ? new Date(state.dob).toISOString() : null,
      cancel: state.isCancel === "Yes"
    };

    await $fetch(`${config.public.apiBaseUrl}/api/v1/item/create`, {
      method: "POST",
      body: payload
    });

    await refreshNuxtData()
    toast.add({
      title: "Success",
      description: "Item created successfully!",
      color: "success"
    });

    emit("created");
    resetForm();
    open.value = false;
  } catch (err: any) {
    toast.add({
      title: "Failed To Create Item",
      description: err?.data?.message || "Something went wrong",
      color: "error"
    });
  }
};
</script>

<template>
  <UButton label="New Item" icon="i-lucide-plus" @click="open = true"/>

  <UModal v-model:open="open" title="New Item" description="Add new items">
    <template #body>
      <UForm class="space-y-4" @submit.prevent="createItem">
        <!-- Policy Info -->
        <UFormField label="Policy ID" hidden>
          <UInput v-model="state.policyId" class="w-full"/>
        </UFormField>
        <UFormField label="Policy No">
          <UInput v-model="state.policyNo" class="w-full"/>
        </UFormField>
        <UFormField label="Inception Date">
          <UInput type="date" v-model="state.inceptionDate" class="w-full"/>
        </UFormField>
        <UFormField label="Expiry Date">
          <UInput type="date" v-model="state.expiredDate" class="w-full"/>
        </UFormField>
        <UFormField label="Issue Date">
          <UInput type="date" v-model="state.issueDate" class="w-full"/>
        </UFormField>

        <!-- Item Info -->
        <UFormField label="Insured Name">
          <UInput v-model="state.insuredName" placeholder="Enter insured name" class="w-full"/>
        </UFormField>
        <UFormField label="Date of Birth">
          <UInput type="date" v-model="state.dob" class="w-full"/>
        </UFormField>
        <UFormField label="Gender">
          <USelectMenu v-model="state.sex" :items="genderOptions" placeholder="Select gender" class="w-full"/>
        </UFormField>
        <UFormField label="Card No">
          <UInput v-model="state.cardNo" placeholder="Enter card number" class="w-full"/>
        </UFormField>
        <UFormField label="Remark">
          <USelectMenu v-model="state.remark" :items="remarkOptions" placeholder="Select remark" @update:model-value="handleRemarkChange" class="w-full"/>
        </UFormField>

        <!-- Buttons -->
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
          <UButton label="Create" color="primary" variant="solid" type="submit" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
