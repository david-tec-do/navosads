import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { getDecryptedAccessToken, getAdsAccountsByUserId } from "@/lib/db/queries";

type RechargeNewsbreakBudgetProps = {
  session: Session;
};

interface BudgetUpdateItem {
  adAccountId: string;
  budget: number;
}

/**
 * NewsBreak Recharge Budget Tool
 * Adds money to existing account budgets by reading current spending cap and adding recharge amount
 * Automatically uses the user's configured NewsBreak token
 */
export const rechargeNewsbreakBudget = ({ session }: RechargeNewsbreakBudgetProps) =>
  tool({
    description: `Recharge (add money to) NewsBreak ad account budgets.
    This tool reads the current spending cap for specified accounts,
    adds the recharge amount to each account's current budget,
    and updates the accounts with the new budget total.
    Automatically uses the user's configured NewsBreak account token.
    Provide a list of accounts with the amount to add to each account's budget.`,
    
    inputSchema: z.object({
      rechargeUpdates: z.array(z.object({
        adAccountId: z.string().describe("Ad Account ID (numeric string)"),
        rechargeAmount: z.number().positive().max(100000000).describe("Amount to add to the account budget in dollars (USD). Maximum $100M recharge"),
      })).describe("Array of account recharge updates. Each item must have adAccountId and rechargeAmount"),
    }),
    
    execute: async (input) => {
      try {
        const userId = session.user.id;
        
        if (!userId) {
          return {
            error: "User not authenticated. Please log in to recharge NewsBreak budgets.",
          };
        }

        // Validate input
        if (!input.rechargeUpdates || input.rechargeUpdates.length === 0) {
          return {
            error: "No recharge updates provided. Please specify at least one account with a recharge amount.",
          };
        }

        // Validate recharge amounts (maximum $100M per recharge)
        for (const item of input.rechargeUpdates) {
          if (item.rechargeAmount <= 0 || item.rechargeAmount > 100000000) {
            return {
              error: `Recharge amount must be between $0 and $100M. Invalid recharge for account ${item.adAccountId}: $${item.rechargeAmount.toFixed(2)}`,
            };
          }
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

        // Step 1: Fetch current budget information for all accounts
        const accountIdsToQuery = input.rechargeUpdates.map(item => item.adAccountId);
        
        const budgetResponse = await fetch(
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

        if (!budgetResponse.ok) {
          const errorText = await budgetResponse.text();
          return {
            error: `Failed to fetch current budget info: ${budgetResponse.status} ${budgetResponse.statusText}`,
            details: errorText,
          };
        }

        const budgetData = await budgetResponse.json();

        if (budgetData.code !== 0) {
          return {
            error: `Failed to fetch budget info: ${budgetData.errMsg || "Unknown error"}`,
            code: budgetData.code,
          };
        }

        // Step 2: Calculate new budgets (current spending cap + recharge amount)
        const budgetInfoMap = new Map<string, number>();
        const budgetInfoList = budgetData.data.list || [];
        
        for (const item of budgetInfoList) {
          if (item.spendingCap !== undefined && item.spendingCap !== null) {
            budgetInfoMap.set(item.accountId, item.spendingCap);
          }
        }

        const adAccountsBudgetUpdate: BudgetUpdateItem[] = [];
        const rechargeResults: Array<{
          adAccountId: string;
          rechargeAmount: number;
          currentBudget?: number;
          newBudget?: number;
          error?: string;
        }> = [];

        for (const rechargeItem of input.rechargeUpdates) {
          const currentBudgetCents = budgetInfoMap.get(rechargeItem.adAccountId);
          
          if (currentBudgetCents === undefined || currentBudgetCents === null) {
            rechargeResults.push({
              adAccountId: rechargeItem.adAccountId,
              rechargeAmount: rechargeItem.rechargeAmount,
              error: "Could not retrieve current budget for this account",
            });
            continue;
          }

          const rechargeAmountCents = Math.round(rechargeItem.rechargeAmount * 100);
          const newBudgetCents = currentBudgetCents + rechargeAmountCents;

          // Validate the new total budget doesn't exceed $100M
          if (newBudgetCents > 10000000000) {
            rechargeResults.push({
              adAccountId: rechargeItem.adAccountId,
              rechargeAmount: rechargeItem.rechargeAmount,
              currentBudget: currentBudgetCents / 100,
              error: `New budget total would exceed $100M limit. Current: $${(currentBudgetCents / 100).toFixed(2)}, Recharge: $${rechargeItem.rechargeAmount.toFixed(2)}, Total: $${(newBudgetCents / 100).toFixed(2)}`,
            });
            continue;
          }

          adAccountsBudgetUpdate.push({
            adAccountId: rechargeItem.adAccountId,
            budget: newBudgetCents,
          });

          rechargeResults.push({
            adAccountId: rechargeItem.adAccountId,
            rechargeAmount: rechargeItem.rechargeAmount,
            currentBudget: currentBudgetCents / 100,
            newBudget: newBudgetCents / 100,
          });
        }

        // If no valid updates to make, return early results
        if (adAccountsBudgetUpdate.length === 0) {
          return {
            success: false,
            accountName: account.tokenName,
            rechargeResults,
            summary: {
              totalAccounts: rechargeResults.length,
              successful: 0,
              failed: rechargeResults.length,
            },
            error: "No valid budget updates could be calculated. All accounts had errors.",
          };
        }

        // Step 3: Update budgets with new totals
        const updateResponse = await fetch(
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

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          return {
            success: false,
            accountName: account.tokenName,
            rechargeResults,
            error: `Failed to update budgets: ${updateResponse.status} ${updateResponse.statusText}`,
            details: errorText,
          };
        }

        const updateData = await updateResponse.json();

        if (updateData.code !== 0) {
          return {
            success: false,
            accountName: account.tokenName,
            rechargeResults,
            error: `Failed to update budgets: ${updateData.errMsg || "Unknown error"}`,
            code: updateData.code,
          };
        }

        // Step 4: Parse update results and combine with recharge info
        const updateResults = updateData.data.list || [];
        const successCount = updateResults.filter((r: any) => 
          r.message && r.message.includes("successfully")
        ).length;
        const failureCount = updateResults.length - successCount;

        // Merge update results with recharge info
        const finalResults = rechargeResults.map(rechargeResult => {
          const updateResult = updateResults.find((u: any) => 
            u.adAccountId === rechargeResult.adAccountId
          );
          
          return {
            ...rechargeResult,
            updateMessage: updateResult?.message,
            updateSuccess: updateResult && updateResult.message?.includes("successfully"),
          };
        });

        return {
          success: true,
          accountName: account.tokenName,
          rechargeResults: finalResults,
          summary: {
            totalAccounts: finalResults.length,
            successful: successCount,
            failed: failureCount,
          },
        };
      } catch (error) {
        console.error("Error in rechargeNewsbreakBudget tool:", error);
        
        return {
          error: error instanceof Error ? error.message : "Failed to recharge NewsBreak budgets",
        };
      }
    },
  });

