/**
 * Имена столов в зале.
 *
 * Технически стол — это всегда число: номер подписывается в QR-токене
 * (см. `lib/table-sign.ts`) и хранится в `orders.table_number`. Но часть мест
 * в зале — VIP-кабины со своей нумерацией, и персонал не должен видеть
 * «Стол №33» там, где стоит «VIP 1».
 *
 * Это единственное место, где номер превращается в подпись. Меняется зал —
 * правится только эта карта.
 */
const TABLE_ALIASES: Record<string, string> = {
  "33": "VIP 1",
  "34": "VIP 2",
  "35": "VIP 3",
};

/** Номера, отданные под кабины — в порядке нумерации VIP. */
export const VIP_TABLE_NUMBERS = Object.keys(TABLE_ALIASES).sort(
  (a, b) => Number(a) - Number(b)
);

const key = (num: string | number) => String(num).trim();

/** Собственное имя стола («VIP 1»), либо null — если это обычный номер. */
export function tableAlias(num: string | number): string | null {
  return TABLE_ALIASES[key(num)] ?? null;
}

export function isVipTable(num: string | number): boolean {
  return tableAlias(num) !== null;
}

/**
 * Подпись для персонала: «Стол №12» или «VIP 1».
 * Используется на досках официанта, цехов, в счетах, кассе и Telegram.
 */
export function tableLabel(num: string | number): string {
  return tableAlias(num) ?? `Стол №${key(num)}`;
}

/**
 * Подпись для гостя — слово «Стол» приходит из i18n, поэтому передаётся снаружи.
 * У VIP-кабины имя одинаковое на всех языках.
 */
export function guestTableLabel(
  num: string | number,
  tableWord: string
): string {
  return tableAlias(num) ?? `${tableWord} ${key(num)}`;
}
