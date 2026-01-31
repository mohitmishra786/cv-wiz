import { getResumeVersions, createResumeSnapshot } from "@/app/actions/resume-history";
import { HistoryList } from "@/components/resumes/HistoryList";

export const metadata = {
  title: "Version History | CV-Wiz",
  description: "Manage resume versions and backups",
};

export default async function HistoryPage() {
  const versions = await getResumeVersions();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Version History</h1>
          <p className="text-gray-600">Save snapshots and restore previous versions</p>
        </div>
        <form action={async () => {
          'use server'
          await createResumeSnapshot()
        }}>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Save Current Version
          </button>
        </form>
      </div>

      <HistoryList versions={versions} />
    </div>
  );
}
