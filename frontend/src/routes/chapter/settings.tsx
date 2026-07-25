import { ChapterCard, ChapterPageHeader } from "@/components/chapter/ChapterPage";
import { isChapterLeadership, resolveChapterRole } from "@/lib/chapterRoles";
import { useAuth } from "@/lib/auth";
import { Navigate } from "react-router-dom";

export default function ChapterSettingsPage() {
  const { user } = useAuth();
  const role = resolveChapterRole(user ?? {});
  if (!isChapterLeadership(role)) {
    return <Navigate to="/chapter" replace />;
  }

  const chapterName =
    user?.chapter && typeof user.chapter === "object" ? user.chapter.name : "Chapter";

  return (
    <div>
      <ChapterPageHeader
        title="Chapter settings"
        description="Leadership preferences for your chapter workspace."
      />
      <ChapterCard>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-3 border-b border-border pb-3">
            <dt className="text-muted-foreground">Chapter</dt>
            <dd className="font-medium">{chapterName}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-border pb-3">
            <dt className="text-muted-foreground">City</dt>
            <dd className="font-medium">
              {user?.chapter && typeof user.chapter === "object" ? user.chapter.city || "—" : "—"}
            </dd>
          </div>
          <p className="text-muted-foreground">
            Role assignments are managed under Team & Roles. Contact the CEO office for chapter
            profile changes (name, city, budget).
          </p>
        </dl>
      </ChapterCard>
    </div>
  );
}
