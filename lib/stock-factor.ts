/**
 * Чистый выбор коэффициента списания склада для варианта порции.
 *
 * Рецепт задаётся на блюдо; вариант («малая»/«большая») масштабирует его
 * через `dish_variants.stock_factor`. Позиционный variantKey клиента
 * ненадёжен (v0/v1 плывут при правках в админке), поэтому вариант ищем по
 * цене линии — она уже проверена сервером в priceOrder и хранится в
 * снапшоте заказа (значит, отмена вернёт ровно столько же).
 */

export type VariantFactor = {
  price: number;
  stockFactor: number;
  sortOrder: number;
};

/**
 * Коэффициент для линии с ценой `price`:
 *  - у блюда нет вариантов → 1 (базовый рецепт);
 *  - цена совпала с вариантом → его фактор (при дублях цены — первый по
 *    sortOrder, чтобы списание было детерминированным);
 *  - цена не совпала ни с одним вариантом (легаси-снапшот со старой ценой,
 *    вариант удалён) → 1, безопасный дефолт.
 */
export function pickStockFactor(
  variants: VariantFactor[],
  price: number | undefined
): number {
  if (!variants.length || price === undefined) return 1;
  const match = variants
    .filter((v) => v.price === price)
    .sort((a, b) => a.sortOrder - b.sortOrder)[0];
  return match ? match.stockFactor : 1;
}
