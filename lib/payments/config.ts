import "server-only";

/**
 * Включение платёжных провайдеров через env. Пока мерчант-аккаунтов нет —
 * всё выключено: колбэки отвечают 404, кнопки оплаты не рендерятся.
 * Появятся ключи → прописать в Vercel → работает без правок кода.
 */

export function paymeConfig() {
  const merchantId = process.env.PAYME_MERCHANT_ID;
  const key = process.env.PAYME_KEY;
  return merchantId && key ? { merchantId, key } : null;
}

export function clickConfig() {
  const serviceId = process.env.CLICK_SERVICE_ID;
  const merchantId = process.env.CLICK_MERCHANT_ID;
  const secretKey = process.env.CLICK_SECRET_KEY;
  return serviceId && merchantId && secretKey
    ? { serviceId, merchantId, secretKey }
    : null;
}

export const paymentsEnabled = () => !!(paymeConfig() || clickConfig());

/**
 * Демо-режим витрины оплаты: кнопки Payme/Click видны гостю и официанту,
 * но ведут в тост «скоро» — для показа воронки до подключения мерчанта.
 * Включается NEXT_PUBLIC_PAYMENTS_DEMO=1; при появлении реальных ключей
 * боевой режим автоматически важнее демо.
 */
export const paymentsDemo = () =>
  process.env.NEXT_PUBLIC_PAYMENTS_DEMO === "1" && !paymentsEnabled();
