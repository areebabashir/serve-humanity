import { Link } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { CHAPTER_ROLE_LABEL, resolveChapterRole } from "@/lib/chapterRoles";

export function ChapterTopBar({ onMenu }: { onMenu?: () => void }) {
  const { user, logout } = useAuth();
  const role = resolveChapterRole(user ?? {});

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-white/70 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        {onMenu ? (
          <button
            type="button"
            onClick={onMenu}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        ) : null}
        <div>
          <p className="text-sm font-semibold text-foreground">Chapter Dashboard</p>
          <p className="text-[11px] text-muted-foreground">{CHAPTER_ROLE_LABEL[role]}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="hidden rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
        >
          Public site
        </Link>
        <button
          type="button"
          onClick={() => void logout().then(() => {
            window.location.href = "/login";
          })}
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
}
