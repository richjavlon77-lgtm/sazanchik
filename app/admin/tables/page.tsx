import { TablesQR } from "@/components/admin/TablesQR";

export const dynamic = "force-dynamic";

export default function TablesPage() {
  return (
    <div>
      <div className="mb-6 print:hidden">
        <h1 className="font-heading text-3xl">Столы · QR-коды</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Защищённые QR: номер стола подписан, его нельзя подменить в ссылке.
        </p>
      </div>
      <TablesQR />
    </div>
  );
}
