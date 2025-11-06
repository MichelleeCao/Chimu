"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ClassFilterProps {
  currentStatus: string;
}

export function ClassFilter({ currentStatus }: ClassFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("status", value);
    router.push(`/instructor/dashboard?${newSearchParams.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
      <Select value={currentStatus} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active Classes</SelectItem>
          <SelectItem value="archived">Archived Classes</SelectItem>
          <SelectItem value="all">All Classes</SelectItem>
        </SelectContent>
      </Select>
      <Button asChild className="w-full sm:w-auto">
        <Link href="/instructor/classes/create">Create New Class</Link>
      </Button>
    </div>
  );
}
