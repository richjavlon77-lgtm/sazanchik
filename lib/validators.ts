import { z } from "zod";
import { parseTashkentLocal } from "@/lib/tz";

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
  idempotencyKey: z.string().max(64).optional(),
  isBirthday: z.boolean().optional(),
  lines: z.array(cartLineSchema).min(1, "Корзина не может быть пустой"),
  // The client sends its own totals for UX, but the server NEVER trusts them —
  // priceOrder() recomputes everything from the DB. Accepted-but-ignored, hence
  // optional: the contract reflects that they carry no authority.
  subtotal: z.number().int().positive().optional(),
  service: z.number().int().min(0).optional(),
  total: z.number().int().positive().optional(),
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
  // Local datetime string from <input type=datetime-local>; must be in the future.
  // Гость вводит ташкентское время — сравниваем через parseTashkentLocal, иначе
  // naive new Date() на UTC-сервере Vercel даёт слак ±5 часов.
  reservedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "Укажите дату и время")
    .refine((v) => parseTashkentLocal(v).getTime() > Date.now() - 60_000, {
      message: "Дата должна быть в будущем",
    }),
  tableNumber: z.string().trim().max(10).optional().or(z.literal("")),
  comment: z.string().trim().max(500).optional().or(z.literal("")),
  isBirthday: z.boolean().default(false),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CallWaiterInput = z.infer<typeof callWaiterSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;

/** Отзыв гостя: 1–5 звёзд, комментарий до 100 символов, имя опционально */
export const createReviewSchema = z.object({
  rating: z.number().int().min(1, "Поставьте оценку").max(5),
  comment: z.string().trim().max(100, "До 100 символов").default(""),
  guestName: z.string().trim().max(40).optional().or(z.literal("")),
  tableToken: z.string().max(64).optional(),
});
