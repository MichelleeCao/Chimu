import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleClassArchiveStatus } from "@/app/instructor/classes/[classId]/actions";
import { toast } from "sonner";
import { ClassFilter } from "./_components/class-filter";

export default async function InstructorDashboardPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const filterStatus = searchParams.status || "active"; // Default to active
  let query = supabase.from("classes").select("id, name, quarter, section, year, class_code, archived").eq("created_by", user?.id);

  if (filterStatus === "active") {
    query = query.eq("archived", false);
  } else if (filterStatus === "archived") {
    query = query.eq("archived", true);
  } else if (filterStatus === "all") {
    // No filter needed, fetch all
  }

  const { data: classes, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching classes:", error);
    return <p className="text-red-500">Error loading classes.</p>;
  }

  const handleToggleArchive = async (classId: string, currentStatus: boolean) => {
    "use server";
    const result = await toggleClassArchiveStatus(classId, currentStatus);
    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to update class status.");
    } else {
      toast.success(`Class ${currentStatus ? "unarchived" : "archived"} successfully!`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 md:mb-0">Instructor Dashboard</h1>
          <ClassFilter currentStatus={filterStatus} />
        </div>

        {classes && classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <Card key={cls.id}>
                <CardHeader>
                  <CardTitle>{cls.name}</CardTitle>
                  <CardDescription>
                    {cls.quarter} {cls.year} - {cls.section}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">Code: <span className="font-mono font-semibold">{cls.class_code}</span></p>
                  <p className="text-sm text-gray-700">Status: {cls.archived ? "Archived" : "Active"}</p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <form action={handleToggleArchive.bind(null, cls.id, cls.archived)}>
                    <Button variant="outline" type="submit">
                      {cls.archived ? "Unarchive" : "Archive"}
                    </Button>
                  </form>
                  <Button variant="outline" asChild>
                    <Link href={`/instructor/classes/${cls.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">You haven't created any classes yet. Click "Create New Class" to get started!</p>
        )}
      </div>
    </div>
  );
}
