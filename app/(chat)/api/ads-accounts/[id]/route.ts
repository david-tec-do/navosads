import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  deleteAdsAccount,
  getAdsAccountById,
  updateAdsAccount,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

// GET /api/ads-accounts/[id] - Get single ads account
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const account = await getAdsAccountById(id, session.user.id);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Error fetching ads account:", error);

    if (error instanceof ChatSDKError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "not_found:database" ? 404 : 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch ads account" },
      { status: 500 }
    );
  }
}

// PATCH /api/ads-accounts/[id] - Update ads account
const updateSchema = z.object({
  tokenName: z.string().min(1).optional(),
  accessToken: z.string().min(1).optional(),
  accountIds: z.array(z.string()).optional(),
  accountEmail: z.string().email().optional().or(z.literal("")),
  tokenExpiresAt: z.string().datetime().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    const updated = await updateAdsAccount({
      accountId: id,
      userId: session.user.id,
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
        id: updated.id,
        tokenName: updated.tokenName,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating ads account:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof ChatSDKError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "not_found:database" ? 404 : 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update ads account" },
      { status: 500 }
    );
  }
}

// DELETE /api/ads-accounts/[id] - Delete (revoke) ads account
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteAdsAccount(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ads account:", error);

    if (error instanceof ChatSDKError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "not_found:database" ? 404 : 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete ads account" },
      { status: 500 }
    );
  }
}

