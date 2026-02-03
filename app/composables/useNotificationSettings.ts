export function useNotificationSettings() {
  const lowStockThreshold = useState<number>("lowStockThreshold", () => 10);

  onMounted(() => {
    const raw = localStorage.getItem("lowStockThreshold");
    if (raw) {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) lowStockThreshold.value = n;
    }
  });

  watch(lowStockThreshold, (v) => {
    localStorage.setItem("lowStockThreshold", String(v));
  });

  return { lowStockThreshold };
}
