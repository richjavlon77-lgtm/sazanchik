import Link from "next/link";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default function NewCategoryPage() {
  return (
    <div>
      <Link
        href="/admin/categories"
        className="mb-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
      >
        ← Категории
      </Link>
      <h1 className="mb-6 font-heading text-3xl">Новая категория</h1>
      <CategoryForm catId={null} />
    </div>
  );
}
