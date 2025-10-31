"use client";

import Link from "next/link";
import { AlertCircleIcon } from "lucide-react";

interface NewsbreakSetupCardProps {
  message?: string;
  setupUrl?: string;
}

export function NewsbreakSetupCard({ message, setupUrl }: NewsbreakSetupCardProps) {
  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/50">
      <div className="flex items-start gap-3">
        <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-orange-600 dark:text-orange-400" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
            {message || "Configuration Required"}
          </p>
          {setupUrl && (
            <Link
              href={setupUrl}
              className="inline-flex items-center justify-center rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:bg-orange-500 dark:hover:bg-orange-600"
            >
              Go to Ads Account Management
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

