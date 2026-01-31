import { getSharedLinks, createShareLink } from "@/app/actions/sharing";
import { ShareList } from "@/components/resumes/ShareList";

export const metadata = {
  title: "Share Resume | CV-Wiz",
  description: "Share your resume with the world",
};

export default async function SharePage() {
  const links = await getSharedLinks();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Share Resume</h1>
          <p className="text-gray-600">Create public links to your resume</p>
        </div>
        <form action={async () => {
          'use server'
          await createShareLink(true) // Create snapshot link by default
        }}>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            + New Public Link
          </button>
        </form>
      </div>

      <ShareList links={links} />
    </div>
  );
}
