import { getApplications } from "@/app/actions/tracker";
import { CreateApplicationForm } from "@/components/tracker/CreateApplicationForm";
import { ApplicationList } from "@/components/tracker/ApplicationList";

export const metadata = {
  title: "Job Application Tracker | CV-Wiz",
  description: "Track your job applications and interviews",
};

export default async function TrackerPage() {
  const applications = await getApplications();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Job Tracker</h1>
          <p className="text-gray-600">Keep track of your applications</p>
        </div>
        <CreateApplicationForm />
      </div>

      <div className="grid gap-6">
        <ApplicationList applications={applications} />
      </div>
    </div>
  );
}
