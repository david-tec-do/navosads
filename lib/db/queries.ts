import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import type { AppUsage } from "../usage";
import { generateUUID } from "../utils";
import {
  adsAccountToken,
  type Chat,
  chat,
  type DBMessage,
  document,
  invitationCode,
  media,
  message,
  type Suggestion,
  stream,
  suggestion,
  type User,
  user,
  vote,
} from "./schema";
import { generateHashedPassword } from "./utils";
import { encryptTokenForStorage, decryptTokenFromStorage } from "./encryption";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<User[]> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword }).returning();
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create guest user"
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const userChats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(eq(chat.userId, userId));

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map(c => c.id);

    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await db
      .delete(chat)
      .where(eq(chat.userId, userId))
      .returning();

    return { deletedCount: deletedChats.length };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete all chats by user id"
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  // Store merged server-enriched usage object
  context: AppUsage;
}) {
  try {
    return await db
      .update(chat)
      .set({ lastContext: context })
      .where(eq(chat.id, chatId));
  } catch (error) {
    console.warn("Failed to update lastContext for chat", chatId, error);
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}

// ==================== Ads Account Token Management ====================

/**
 * Get all available media platforms
 */
export async function getAllMedia() {
  try {
    return await db
      .select()
      .from(media)
      .where(eq(media.isActive, true))
      .orderBy(asc(media.displayName));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to fetch media platforms"
    );
  }
}

/**
 * Get all ads accounts for a user (without decrypted tokens)
 */
export async function getAdsAccountsByUserId(userId: string) {
  try {
    return await db
      .select({
        id: adsAccountToken.id,
        mediaId: adsAccountToken.mediaId,
        tokenName: adsAccountToken.tokenName,
        accountIds: adsAccountToken.accountIds,
        accountEmail: adsAccountToken.accountEmail,
        status: adsAccountToken.status,
        tokenExpiresAt: adsAccountToken.tokenExpiresAt,
        lastValidatedAt: adsAccountToken.lastValidatedAt,
        lastUsedAt: adsAccountToken.lastUsedAt,
        lastErrorMessage: adsAccountToken.lastErrorMessage,
        createdAt: adsAccountToken.createdAt,
        updatedAt: adsAccountToken.updatedAt,
      })
      .from(adsAccountToken)
      .where(eq(adsAccountToken.userId, userId))
      .orderBy(desc(adsAccountToken.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to fetch ads accounts"
    );
  }
}

/**
 * Get a single ads account by ID (with ownership check)
 */
export async function getAdsAccountById(accountId: string, userId: string) {
  try {
    const [account] = await db
      .select({
        id: adsAccountToken.id,
        mediaId: adsAccountToken.mediaId,
        tokenName: adsAccountToken.tokenName,
        accountIds: adsAccountToken.accountIds,
        accountEmail: adsAccountToken.accountEmail,
        status: adsAccountToken.status,
        tokenExpiresAt: adsAccountToken.tokenExpiresAt,
        lastValidatedAt: adsAccountToken.lastValidatedAt,
        lastUsedAt: adsAccountToken.lastUsedAt,
        lastErrorMessage: adsAccountToken.lastErrorMessage,
        createdAt: adsAccountToken.createdAt,
        updatedAt: adsAccountToken.updatedAt,
      })
      .from(adsAccountToken)
      .where(
        and(eq(adsAccountToken.id, accountId), eq(adsAccountToken.userId, userId))
      );

    return account || null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to fetch ads account"
    );
  }
}

/**
 * Create a new ads account with encrypted token
 */
export async function createAdsAccount({
  userId,
  mediaId,
  tokenName,
  accessToken,
  accountIds,
  accountEmail,
  tokenExpiresAt,
}: {
  userId: string;
  mediaId: string;
  tokenName: string;
  accessToken: string;
  accountIds?: string[];
  accountEmail?: string;
  tokenExpiresAt?: Date;
}) {
  try {
    const { encryptedData, iv } = encryptTokenForStorage(accessToken);

    const [newAccount] = await db
      .insert(adsAccountToken)
      .values({
        userId,
        mediaId,
        tokenName,
        encryptedAccessToken: encryptedData,
        tokenIv: iv,
        accountIds: accountIds || null,
        accountEmail,
        tokenExpiresAt,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newAccount;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create ads account"
    );
  }
}

/**
 * Update ads account information
 */
export async function updateAdsAccount({
  accountId,
  userId,
  tokenName,
  accessToken,
  accountIds,
  accountEmail,
  tokenExpiresAt,
}: {
  accountId: string;
  userId: string;
  tokenName?: string;
  accessToken?: string;
  accountIds?: string[];
  accountEmail?: string;
  tokenExpiresAt?: Date;
}) {
  try {
    // Verify ownership
    const existing = await getAdsAccountById(accountId, userId);
    if (!existing) {
      throw new ChatSDKError("not_found:database", "Ads account not found");
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (tokenName !== undefined) updateData.tokenName = tokenName;
    if (accountIds !== undefined) updateData.accountIds = accountIds;
    if (accountEmail !== undefined) updateData.accountEmail = accountEmail;
    if (tokenExpiresAt !== undefined) updateData.tokenExpiresAt = tokenExpiresAt;

    // If updating token, encrypt it
    if (accessToken) {
      const { encryptedData, iv } = encryptTokenForStorage(accessToken);
      updateData.encryptedAccessToken = encryptedData;
      updateData.tokenIv = iv;
      updateData.status = "active";
    }

    const [updated] = await db
      .update(adsAccountToken)
      .set(updateData)
      .where(eq(adsAccountToken.id, accountId))
      .returning();

    return updated;
  } catch (_error) {
    if (_error instanceof ChatSDKError) throw _error;
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update ads account"
    );
  }
}

/**
 * Get decrypted access token (only when needed)
 */
export async function getDecryptedAccessToken(
  accountId: string,
  userId: string
): Promise<string> {
  try {
    const [account] = await db
      .select()
      .from(adsAccountToken)
      .where(
        and(eq(adsAccountToken.id, accountId), eq(adsAccountToken.userId, userId))
      );

    if (!account) {
      throw new ChatSDKError("not_found:database", "Ads account not found");
    }

    if (account.status !== "active") {
      throw new ChatSDKError(
        "forbidden:ads_account",
        `Account status is ${account.status}`
      );
    }

    // Check if token is expired
    if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
      await db
        .update(adsAccountToken)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(adsAccountToken.id, accountId));

      throw new ChatSDKError("forbidden:ads_account", "Token expired");
    }

    // Decrypt token
    const decryptedToken = decryptTokenFromStorage(
      account.encryptedAccessToken,
      account.tokenIv
    );

    // Update last used timestamp
    await db
      .update(adsAccountToken)
      .set({ lastUsedAt: new Date() })
      .where(eq(adsAccountToken.id, accountId));

    return decryptedToken;
  } catch (_error) {
    if (_error instanceof ChatSDKError) throw _error;

    throw new ChatSDKError(
      "bad_request:database",
      "Failed to decrypt access token"
    );
  }
}

/**
 * Update token status and error message
 */
export async function updateAdsAccountStatus({
  accountId,
  userId,
  status,
  errorMessage,
}: {
  accountId: string;
  userId: string;
  status: "active" | "expired" | "invalid" | "revoked";
  errorMessage?: string;
}) {
  try {
    // Verify ownership
    const existing = await getAdsAccountById(accountId, userId);
    if (!existing) {
      throw new ChatSDKError("not_found:database", "Ads account not found");
    }

    await db
      .update(adsAccountToken)
      .set({
        status,
        lastErrorMessage: errorMessage || null,
        lastValidatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(adsAccountToken.id, accountId));

    return { success: true };
  } catch (_error) {
    if (_error instanceof ChatSDKError) throw _error;

    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update ads account status"
    );
  }
}

/**
 * Delete (revoke) an ads account
 */
export async function deleteAdsAccount(accountId: string, userId: string) {
  try {
    // Verify ownership
    const existing = await getAdsAccountById(accountId, userId);
    if (!existing) {
      throw new ChatSDKError("not_found:database", "Ads account not found");
    }

    // Soft delete: mark as revoked
    await db
      .update(adsAccountToken)
      .set({
        status: "revoked",
        updatedAt: new Date(),
      })
      .where(eq(adsAccountToken.id, accountId));

    return { success: true };
  } catch (_error) {
    if (_error instanceof ChatSDKError) throw _error;

    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete ads account"
    );
  }
}

// Invitation Code Functions
export async function validateAndUseInvitationCode(code: string, userId: string) {
  try {
    // Check if code exists and is unused
    const [invCode] = await db
      .select()
      .from(invitationCode)
      .where(eq(invitationCode.code, code));

    if (!invCode) {
      throw new ChatSDKError(
        "bad_request:invitation_code",
        "Invalid invitation code"
      );
    }

    if (invCode.usedBy) {
      throw new ChatSDKError(
        "bad_request:invitation_code",
        "Invitation code has already been used"
      );
    }

    // Mark code as used
    await db
      .update(invitationCode)
      .set({
        usedBy: userId,
        usedAt: new Date(),
      })
      .where(eq(invitationCode.code, code));

    return { success: true };
  } catch (_error) {
    if (_error instanceof ChatSDKError) throw _error;
    
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to validate invitation code"
    );
  }
}
