import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createAdsAccount,
  getAllMedia,
  getAdsAccountsByUserId,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

// GET /api/ads-accounts - Get all ads accounts for current user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [accounts, mediaList] = await Promise.all([
      getAdsAccountsByUserId(session.user.id),
      getAllMedia(),
    ]);

    return NextResponse.json({
      accounts,
      media: mediaList,
    });
  } catch (error) {
    console.error("Error fetching ads accounts:", error);

    if (error instanceof ChatSDKError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "not_found:database" ? 404 : 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch ads accounts" },
      { status: 500 }
    );
  }
}

// POST /api/ads-accounts - Create new ads account
const createSchema = z.object({
  mediaId: z.string().min(1, "Media platform is required"),
  tokenName: z.string().min(1, "Account name is required"),
  accessToken: z.string().min(1, "Access token is required"),
  accountIds: z.array(z.string()).min(1, "At least one Account ID is required"),
  accountEmail: z.string().email().optional().or(z.literal("")),
  tokenExpiresAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSchema.parse(body);

    const newAccount = await createAdsAccount({
      userId: session.user.id,
      mediaId: validatedData.mediaId,
      tokenName: validatedData.tokenName,
      accessToken: validatedData.accessToken,
      accountIds: validatedData.accountIds,
      accountEmail: validatedData.accountEmail || undefined,
      tokenExpiresAt: validatedData.tokenExpiresAt
        ? new Date(validatedData.tokenExpiresAt)
        : undefined,
    });

    return NextResponse.json({
      success: true,
      account: {
        id: newAccount.id,
        mediaId: newAccount.mediaId,
        tokenName: newAccount.tokenName,
        status: newAccount.status,
        createdAt: newAccount.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating ads account:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof ChatSDKError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create ads account" },
      { status: 500 }
    );
  }
}

