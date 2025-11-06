"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TestRolesPage() {
  const [user, setUser] = useState<any>(null);
  const [currentTestRole, setCurrentTestRole] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      // Load test role from local storage
      setCurrentTestRole(localStorage.getItem("test_role"));
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          router.refresh(); // Refresh to re-evaluate middleware and server components
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase, router]);

  const handleRoleChange = (role: string) => {
    setCurrentTestRole(role);
    localStorage.setItem("test_role", role);
    alert(`Test role set to: ${role}. This change is local to your browser and does not affect the actual database roles.`);
    router.refresh(); // Refresh to apply local role change
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold">Test Role Switching (Development Only)</h2>
        <p className="mb-4">Current User ID: {user?.id}</p>
        <p className="mb-4">Current User Email: {user?.email}</p>
        <p className="mb-4">Current Test Role (Local): {currentTestRole || "None"}</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="test-role">Select Test Role</Label>
            <Select onValueChange={handleRoleChange} value={currentTestRole || ""}>
              <SelectTrigger id="test-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="TA">TA</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-gray-600">Note: This feature is for development purposes only. Changes are stored locally and do not affect actual database roles.</p>
        </div>
      </div>
    </div>
  );
}
