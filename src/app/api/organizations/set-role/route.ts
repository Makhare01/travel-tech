import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, role } = await request.json();

    if (!organizationId || !role) {
      return NextResponse.json(
        { error: "Missing organizationId or role" },
        { status: 400 }
      );
    }

    if (role !== "agency" && role !== "hotel") {
      return NextResponse.json(
        { error: "Invalid role. Must be 'agency' or 'hotel'" },
        { status: 400 }
      );
    }

    // Update organization metadata using Clerk's backend API
    const client = await clerkClient();
    await client.organizations.updateOrganizationMetadata(organizationId, {
      publicMetadata: {
        role: role,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting organization role:", error);
    return NextResponse.json(
      { error: "Failed to set organization role" },
      { status: 500 }
    );
  }
}
