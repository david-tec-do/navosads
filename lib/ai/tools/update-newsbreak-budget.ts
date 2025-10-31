import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { getDecryptedAccessToken, getAdsAccountsByUserId } from "@/lib/db/queries";

type UpdateNewsbreakBudgetProps = {
  session: Session;
};

interface BudgetUpdateItem {
  adAccountId: string;
  budget: number;
}

/**
 * NewsBreak Update Budget Tool
 * Updates account-level spending caps (budgets) for multiple ad accounts
 * Automatically uses the user's configured NewsBreak token
 */
export const updateNewsbreakBudget = ({ session }: UpdateNewsbreakBudgetProps) =>
  tool({
    description: `Update budget (spending caps) for NewsBreak ad accounts.
    This modifies the maximum spending limit for one or more ad accounts.
    Budget must be between $0-$100M and greater than current spending.
    Automatically uses the user's configured NewsBreak account token.
    Provide a list of accounts with their new budget amounts in dollars.`,
    
    inputSchema: z.object({
      budgetUpdates: z.array(z.object({
        adAccountId: z.string().describe("Ad Account ID (numeric string)"),
        budget: z.number().positive().max(100000000).describe("New budget amount in dollars (USD). Maximum $100M"),
      })).describe("Array of account budget updates. Each item must have adAccountId and budget"),
    }),
    
    execute: async (input) => {
      try {
        const userId = session.user.id;
        
        if (!userId) {
          return {
            error: "User not authenticated. Please log in to update NewsBreak budgets.",
          };
        }

        // Validate input
        if (!input.budgetUpdates || input.budgetUpdates.length === 0) {
          return {
            error: "No budget updates provided. Please specify at least one account with a budget.",
          };
        }

        // Get user's NewsBreak ad accounts
        const userAccounts = await getAdsAccountsByUserId(userId);
        const newsbreakAccounts = userAccounts.filter(
          (account) => account.mediaId === "newsbreak" && account.status === "active"
        );

        if (newsbreakAccounts.length === 0) {
          return {
            error: "No active NewsBreak account configured. Please add a NewsBreak account token in Ads Account Management.",
            setupUrl: "/settings/ads-accounts",
          };
        }

        // Use the first active account
        const account = newsbreakAccounts[0];

        // Get decrypted access token
        const accessToken = await getDecryptedAccessToken(account.id, userId);

        // Convert dollars to cents (NewsBreak API uses cents)
        const adAccountsBudgetUpdate: BudgetUpdateItem[] = input.budgetUpdates.map((item) => ({
          adAccountId: item.adAccountId,
          budget: Math.round(item.budget * 100), // Convert dollars to cents
        }));

        // Validate budget range (0 to 10,000,000,000 cents = $0 to $100M)
        for (const item of adAccountsBudgetUpdate) {
          if (item.budget < 0 || item.budget > 10000000000) {
            return {
              error: `Budget must be between $0 and $100M. Invalid budget for account ${item.adAccountId}: $${(item.budget / 100).toFixed(2)}`,
            };
          }
        }

        // Call NewsBreak API
        const response = await fetch(
          "https://business.newsbreak.com/business-api/v1/balance/updateAccountsBudget",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Access-Token": accessToken,
            },
            body: JSON.stringify({
              adAccountsBudgetUpdate,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          return {
            error: `NewsBreak API request failed: ${response.status} ${response.statusText}`,
            details: errorText,
          };
        }

        const data = await response.json();

        // Check API response code
        if (data.code !== 0) {
          return {
            error: `NewsBreak API returned error: ${data.errMsg || "Unknown error"}`,
            code: data.code,
          };
        }

        // Parse results
        const results = data.data.list || [];
        const successCount = results.filter((r: any) => 
          r.message && r.message.includes("successfully")
        ).length;
        const failureCount = results.length - successCount;

        // Return budget update results
        return {
          success: true,
          accountName: account.tokenName,
          results,
          summary: {
            totalAccounts: results.length,
            successful: successCount,
            failed: failureCount,
          },
        };
      } catch (error) {
        console.error("Error in updateNewsbreakBudget tool:", error);
        
        return {
          error: error instanceof Error ? error.message : "Failed to update NewsBreak budgets",
        };
      }
    },
  });

