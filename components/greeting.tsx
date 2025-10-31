"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

type AdsAccount = {
  id: string;
  mediaId: string;
  tokenName: string;
  accountIds: string[] | null;
  status: "active" | "expired" | "invalid" | "revoked";
};

export const Greeting = () => {
  const { data, isLoading } = useSWR<{ accounts: AdsAccount[] }>(
    "/api/ads-accounts",
    fetcher
  );

  const hasActiveNewsbreakAccount =
    data?.accounts?.some(
      (account) => account.mediaId === "newsbreak" && account.status === "active"
    ) ?? false;

  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8"
      key="overview"
    >
      {!isLoading && !hasActiveNewsbreakAccount && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.4 }}
        >
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-orange-600 dark:text-orange-400" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Configure your NewsBreak account to access budget management
                  features
                </p>
                <Link
                  href="/settings/ads-accounts"
                  className="inline-flex items-center justify-center rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:bg-orange-500 dark:hover:bg-orange-600"
                >
                  Go to Ads Account Management
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold text-xl md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        Hello there!
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-xl text-zinc-500 md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        How can I help you today?
      </motion.div>
    </div>
  );
};
