import { MediaTeamPanel } from "@/components/team/MediaTeamPanel";
import { ChapterPageHeader } from "@/components/chapter/ChapterPage";
import { useChapterRole } from "@/components/chapter/ChapterGuard";
import { canWriteChapterModule } from "@/lib/chapterRoles";

export default function ChapterMediaCasesPage() {
  const role = useChapterRole();
  const canWrite = canWriteChapterModule(role, "media");

  return (
    <div>
      <ChapterPageHeader
        title="Reference File – Team Media and Graphic"
        description="Media and graphic reference file — same interface as verification. Date, Ref No, Description."
      />
      <MediaTeamPanel canWrite={canWrite} />
    </div>
  );
}
