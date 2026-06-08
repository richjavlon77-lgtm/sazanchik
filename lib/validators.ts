import { z } from "zod";

const cartLineSchema = z.object({
  id: z.string().min(1),
  variantKey: z.string().optional(),
  qty: z.number().int().positive(),
  price: z.number().int().positive(),
  name: z.object({
    ru: z.string().min(1),
    uz: z.string().min(1),
    en: z.string().min(1),
  }),
  variantLabel: z
    .object({
      ru: z.string().optional(),
      uz: z.string().optional(),
      en: z.string().optional(),
    })
    .optional(),
});

export const createOrderSchema = z.object({
  tableNumber: z.string().min(1, "Номер стола обязателен"),
  lines: z.array(cartLineSchema).min(1, "Корзина не может быть пустой"),
  subtotal: z.number().int().positive(),
  service: z.number().int().min(0),
  total: z.number().int().positive(),
});

export const callWaiterSchema = z.object({
  tableNumber: z.string().min(1, "Номер стола обязателен"),
  type: z.enum(["waiter", "bill", "water"]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CallWaiterInput = z.infer<typeof callWaiterSchema>;
