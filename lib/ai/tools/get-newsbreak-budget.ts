import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { getDecryptedAccessToken, getAdsAccountsByUserId } from "@/lib/db/queries";

type GetNewsbreakBudgetProps = {
  session: Session;
};

/**
 * NewsBreak Budget Info Tool
 * Fetches account budget information from NewsBreak Ads API
 * Automatically uses the user's configured NewsBreak token
 */
export const getNewsbreakBudget = ({ session }: GetNewsbreakBudgetProps) =>
  tool({
    description: `Get budget information for NewsBreak ad accounts. 
    This shows account remaining budget, spending cap, and total spend.
    Automatically uses the user's configured NewsBreak account token.
    You can specify account IDs to query, or omit to use the default account.`,
    
    inputSchema: z.object({
      accountIds: z.array(z.string()).optional().describe(
        "Optional array of NewsBreak account IDs to query. If not provided, uses all available accounts. Maximum 500 IDs."
      ),
    }),
    
    execute: async (input) => {
      try {
        const userId = session.user.id;
        
        if (!userId) {
          return {
            error: "User not authenticated. Please log in to access NewsBreak budget information.",
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

      // Use the first active account (or the user could specify which one)
      const account = newsbreakAccounts[0];

      // Get decrypted access token
      const accessToken = await getDecryptedAccessToken(account.id, userId);

      // Prepare account IDs for the request
      const accountIdsToQuery = input.accountIds || [];
      
      if (accountIdsToQuery.length > 500) {
        return {
          error: "Too many account IDs. Maximum 500 accounts per request.",
        };
      }

      // Call NewsBreak API
      const response = await fetch(
        "https://business.newsbreak.com/business-api/v1/balance/getAccountBudgetInfo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Token": accessToken,
          },
          body: JSON.stringify({
            accountIds: accountIdsToQuery,
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

      // Return budget information
      return {
        success: true,
        accountName: account.tokenName,
        budgetInfo: data.data.list,
        summary: {
          totalAccounts: data.data.list.length,
          accountsWithAccess: data.data.list.filter((a: any) => a.canViewBudget).length,
        },
      };
    } catch (error) {
      console.error("Error in getNewsbreakBudget tool:", error);
      
      return {
        error: error instanceof Error ? error.message : "Failed to fetch NewsBreak budget information",
      };
    }
  });

