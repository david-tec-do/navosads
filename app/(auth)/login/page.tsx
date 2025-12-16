"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActionState, useEffect, useState, Suspense } from "react";
import Image from "next/image";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { type LoginActionState, login } from "../actions";

function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    }
  );

  const { update: updateSession } = useSession();

  useEffect(() => {
    if (state.status === "failed") {
      toast({
        type: "error",
        description: "Incorrect email or password. Please try again.",
      });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Please enter a valid email and password.",
      });
    } else if (state.status === "success") {
      setIsSuccessful(true);
      updateSession();

      // Get redirect URL from query params or default to home
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get("redirectUrl") || "/";

      router.push(redirectUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <>
      <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center relative">
        <Image
          src="/images/login/background.png"
          alt="Background"
          fill
          className="object-cover z-0 dark:brightness-50 dark:contrast-125"
          priority
        />
        <div className="w-full max-w-md mx-auto mt-10 p-8 bg-background/80 backdrop-blur-lg rounded-2xl shadow-lg flex flex-col gap-12 border border-white/10 z-10 relative">
          <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-9">
            <h3 className="font-heading text-2xl font-semibold text-login-forground">
              Sign In Navos
            </h3>
          </div>
          <AuthForm action={handleSubmit} defaultEmail={email}>
            <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
            <p className="text-center text-md text-gray-400 mt-4">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary hover:underline"
              >
                Sign up
              </Link>
              {" for free."}
            </p>
          </AuthForm>
        </div>
      </div>
    </>
  );
}

function LoginSkeleton() {
  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center relative">
      <div className="w-full max-w-md mx-auto mt-10 p-8 flex flex-col gap-12 z-10 relative">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-9">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <Skeleton className="h-10 w-full rounded-md mt-4" />
          <div className="flex justify-between mt-4">
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
