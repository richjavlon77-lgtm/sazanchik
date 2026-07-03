/** Payroll positions (Russian labels). `value` is stored, label is shown. */
export const POSITIONS = [
  { value: "manager", label: "Менеджер" },
  { value: "cook", label: "Повар" },
  { value: "cook_helper", label: "Помощник повара" },
  { value: "bartender", label: "Бармен" },
  { value: "hookah", label: "Кальянщик" },
  { value: "waiter", label: "Официант" },
  { value: "dishwasher", label: "Посудомойщица" },
  { value: "cleaner", label: "Техничка" },
  { value: "other", label: "Прочее" },
] as const;

export const POSITION_LABEL: Record<string, string> = Object.fromEntries(
  POSITIONS.map((p) => [p.value, p.label])
);
