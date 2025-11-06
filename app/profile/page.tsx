"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { profileSchema, type ProfileFormValues } from "@/lib/validators/profile";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [avatarUploadSuccess, setAvatarUploadSuccess] = useState<string | null>(null);
  const [updateProfileError, setUpdateProfileError] = useState<string | null>(null);
  const [updateProfileSuccess, setUpdateProfileSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser(user);
      form.reset({
        name: user.user_metadata?.name || "",
        email: user.email || "",
        phone: user.user_metadata?.phone || "",
      });
      if (user.user_metadata?.avatar_url) {
        setAvatarUrl(supabase.storage.from('profile_photos').getPublicUrl(user.user_metadata.avatar_url).data.publicUrl);
      }
      setLoading(false);
    };
    fetchUser();
  }, [router, supabase, form]);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarUploadError(null);
    setAvatarUploadSuccess(null);

    if (!user) {
      setAvatarUploadError("You must be logged in to upload an avatar.");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profile_photos')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      setAvatarUploadError(uploadError.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('profile_photos').getPublicUrl(filePath);

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: filePath,
      },
    });

    if (updateError) {
      setAvatarUploadError(updateError.message);
    } else {
      setAvatarUrl(publicUrl);
      setAvatarUploadSuccess("Avatar updated successfully!");
      router.refresh();
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setUpdateProfileError(null);
    setUpdateProfileSuccess(null);

    if (!user) return;

    const emailToUpdate = values.email === user.email ? undefined : values.email;

    const { error } = await supabase.auth.updateUser({
      email: emailToUpdate,
      data: {
        name: values.name,
        phone: values.phone,
      },
    });

    if (error) {
      setUpdateProfileError(error.message);
    } else {
      setUpdateProfileSuccess("Profile updated successfully!");
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold">User Profile</h2>
        <div className="flex flex-col items-center space-y-4 mb-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl || "/avatars/01.png"} alt={form.getValues("name") || "User Avatar"} />
            <AvatarFallback>{form.getValues("name") ? form.getValues("name").charAt(0).toUpperCase() : "U"}</AvatarFallback>
          </Avatar>
          <Input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="w-fit"
          />
          {avatarUploadError && <p className="text-red-500 text-sm">{avatarUploadError}</p>}
          {avatarUploadSuccess && <p className="text-green-500 text-sm">{avatarUploadSuccess}</p>}
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              required
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              {...form.register("phone")}
            />
            {form.formState.errors.phone && (
              <p className="text-red-500 text-sm">{form.formState.errors.phone.message}</p>
            )}
          </div>
          {updateProfileError && <p className="text-red-500 text-sm">{updateProfileError}</p>}
          {updateProfileSuccess && <p className="text-green-500 text-sm">{updateProfileSuccess}</p>}
          <Button type="submit" className="w-full">Update Profile</Button>
        </form>
        <div className="mt-6">
          <Link href="/profile/change-password" className="text-blue-500 hover:underline">
            Change Password
          </Link>
        </div>
      </div>
    </div>
  );
}
