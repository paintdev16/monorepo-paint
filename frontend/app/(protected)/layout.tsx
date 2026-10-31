import { Protected } from "@/components/auth/protected";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected>{(user) => (
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar user={user} />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
              <div className="flex items-center gap-3"><SidebarTrigger /><span className="text-sm font-medium">Tu espacio</span></div>
              <ThemeToggle />
            </header>
            {children}
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    )}</Protected>
  );
}
