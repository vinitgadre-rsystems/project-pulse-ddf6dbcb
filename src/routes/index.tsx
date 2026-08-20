import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutGrid,
  FileText,
  Settings,
  Bell,
  Search,
  Plus,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Workspace — Clean Slate" },
      {
        name: "description",
        content: "Your empty workspace is ready for whatever you want to build.",
      },
      { property: "og:title", content: "Workspace — Clean Slate" },
      {
        property: "og:description",
        content: "Your empty workspace is ready for whatever you want to build.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const navItems = [
  { icon: LayoutGrid, label: "Dashboard", active: true },
  { icon: FileText, label: "Projects", active: false },
  { icon: Settings, label: "Settings", active: false },
];

function Index() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">Workspace</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                item.active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
            <div className="h-8 w-8 rounded-full bg-primary/10" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Guest</span>
              <span className="text-xs text-muted-foreground">Signed in</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b px-4 sm:px-8">
          <div className="flex items-center gap-4 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">Workspace</span>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">Search</span>
              <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-xs font-medium lg:inline">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Bell className="h-4 w-4" />
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
        </header>

        {/* Empty workspace state */}
        <main className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12">
          <Card className="w-full max-w-md border-dashed bg-transparent text-center shadow-none">
            <CardContent className="flex flex-col items-center gap-5 py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <LayoutGrid className="h-7 w-7 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-semibold tracking-tight">
                  Your workspace is empty
                </h1>
                <p className="text-sm text-muted-foreground">
                  Start by creating your first project, or invite your team to
                  collaborate here.
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create project
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
