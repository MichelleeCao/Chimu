import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const handleLogout = async () => {
    "use server";
    await supabase.auth.signOut();
    redirect("/auth/login");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Welcome to Chimu!</h1>
      {user ? (
        <div className="text-center">
          <p className="text-lg mb-2">You are logged in as {user.email}</p>
          <form action={handleLogout}>
            <Button type="submit" variant="outline">Log out</Button>
          </form>
        </div>
      ) : (
        <p className="text-lg">Please log in to continue.</p>
      )}
    </main>
  );
}

