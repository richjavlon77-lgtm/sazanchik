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
  tableToken: z.string().max(64).optional(),
  isBirthday: z.boolean().optional(),
  lines: z.array(cartLineSchema).min(1, "Корзина не может быть пустой"),
  subtotal: z.number().int().positive(),
  service: z.number().int().min(0),
  total: z.number().int().positive(),
});

export const callWaiterSchema = z.object({
  tableNumber: z.string().min(1, "Номер стола обязателен"),
  tableToken: z.string().max(64).optional(),
  type: z.enum(["waiter", "bill", "water"]),
});

export const createReservationSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(80),
  phone: z
    .string()
    .trim()
    .min(7, "Укажите телефон")
    .max(25)
    .regex(/^[+\d][\d\s()-]{6,}$/, "Некорректный телефон"),
  guests: z.number().int().min(1, "Минимум 1 гость").max(50),
  // Local datetime string from <input type=datetime-local>; must be in the future
  reservedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "Укажите дату и время")
    .refine((v) => new Date(v).getTime() > Date.now() - 60_000, {
      message: "Дата должна быть в будущем",
    }),
  tableNumber: z.string().trim().max(10).optional().or(z.literal("")),
  comment: z.string().trim().max(500).optional().or(z.literal("")),
  isBirthday: z.boolean().default(false),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CallWaiterInput = z.infer<typeof callWaiterSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
