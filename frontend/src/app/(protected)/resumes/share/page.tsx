import { getSharedLinks, createShareLink } from "@/app/actions/sharing";
import { ShareList } from "@/components/resumes/ShareList";

export const metadata = {
  title: "Share Resume | MatchQuill",
  description: "Share your resume with the world",
};

export default async function SharePage() {
  const links = await getSharedLinks();

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}
            >
              Share Resume
            </h1>
            <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Create public links to your resume
            </p>
          </div>
          <form action={async () => {
            'use server'
            await createShareLink(true) // Create snapshot link by default
          }}>
            <button
              className="px-4 py-2.5 min-h-[44px] font-semibold rounded-xl transition-opacity hover:opacity-90"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              + New Public Link
            </button>
          </form>
        </div>

        <ShareList links={links} />
      </main>
    </div>
  );
}
