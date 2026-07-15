import { getApplications } from "@/app/actions/tracker";
import { CreateApplicationForm } from "@/components/tracker/CreateApplicationForm";
import { ApplicationList } from "@/components/tracker/ApplicationList";

export const metadata = {
  title: "Job Application Tracker | MatchQuill",
  description: "Track your job applications and interviews",
};

export default async function TrackerPage() {
  const applications = await getApplications();

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}
            >
              Job Tracker
            </h1>
            <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Keep track of your applications
            </p>
          </div>
          <CreateApplicationForm />
        </div>

        <div className="grid gap-6">
          <ApplicationList applications={applications} />
        </div>
      </main>
    </div>
  );
}
