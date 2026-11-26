"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { homeForRole } from "@/lib/roles";
import { safeInternalPath } from "@/lib/utils";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  password: z.string().min(8, "At least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

function RegisterInner() {
  const { login } = useAuth();
  const router = useRouter();
  const next = safeInternalPath(useSearchParams().get("next"));
  const [err, setErr] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: FormValues) => {
    setErr(null);
    try {
      await api.post("/users", v);
      const user = await login({ email: v.email, password: v.password });
      router.push(next || homeForRole(user?.role));
    } catch (e) {
      const msg =
        (e as AxiosError<{ message?: string }>)?.response?.data?.message ??
        "Could not create account";
      setErr(Array.isArray(msg) ? msg[0] : String(msg));
    }
  };

  const field = "space-y-2";

  return (
    <AuthShell tab="register" next={next ?? undefined}>
      <h2 className="mb-2 font-display text-2xl font-semibold">
        Create account
      </h2>
      <p className="mb-7 text-sm text-dim">Join Aurelia to book your stay.</p>

      {err && (
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {err}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex gap-3">
          <div className={`${field} flex-1`}>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" {...register("firstName")} />
            {errors.firstName && (
              <p className="text-xs text-danger">{errors.firstName.message}</p>
            )}
          </div>
          <div className={`${field} flex-1`}>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" {...register("lastName")} />
            {errors.lastName && (
              <p className="text-xs text-danger">{errors.lastName.message}</p>
            )}
          </div>
        </div>
        <div className={field}>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && (
            <p className="text-xs text-danger">{errors.email.message}</p>
          )}
        </div>
        <div className={field}>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div className={field}>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-danger">{errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-dim">
        Already have an account?{" "}
        <Link
          href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-brand"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-16 text-dim">Loading…</div>}>
      <RegisterInner />
    </Suspense>
  );
}
