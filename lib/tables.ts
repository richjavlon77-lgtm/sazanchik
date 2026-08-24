/**
 * Имена столов в зале.
 *
 * Технически стол — это всегда число 1–35: номер подписывается в QR-токене
 * (см. `lib/table-sign.ts`) и хранится в `orders.table_number`. Зал размечен
 * зонами, и персонал видит «STREET 5», а не «Стол №5»:
 *
 *   1–20  → STREET 1–20   (улица)
 *   21–32 → HALL 1–12     (зал)
 *   33–35 → VIP 1–3       (кабины)
 *
 * Это единственное место, где номер превращается в подпись. Меняется зал —
 * правится только эта карта.
 */
const TABLE_ALIASES: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (let n = 1; n <= 20; n++) map[String(n)] = `STREET ${n}`;
  for (let n = 21; n <= 32; n++) map[String(n)] = `HALL ${n - 20}`;
  for (let n = 33; n <= 35; n++) map[String(n)] = `VIP ${n - 32}`;
  return map;
})();


/** Номера, отданные под кабины — в порядке нумерации VIP. */
export const VIP_TABLE_NUMBERS = ["33", "34", "35"];

/** Собственные имена VIP-кабин (печать, вывески). */
export const VIP_NAMES: Record<string, string> = {
  "33": "SILK ROAD",
  "34": "SAMARQAND",
  "35": "XIVA",
};

/** Имя кабины («SILK ROAD») или null для обычного стола. */
export function vipName(num: string | number): string | null {
  return VIP_NAMES[key(num)] ?? null;
}

const key = (num: string | number) => String(num).trim();

/** Собственное имя стола («VIP 1»), либо null — если это обычный номер. */
export function tableAlias(num: string | number): string | null {
  return TABLE_ALIASES[key(num)] ?? null;
}

export function isVipTable(num: string | number): boolean {
  return VIP_TABLE_NUMBERS.includes(key(num));
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
