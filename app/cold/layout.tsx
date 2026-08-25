import { StaffChat } from "@/components/staff/StaffChat";

export default function ZoneLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <StaffChat />
    </>
  );
}
