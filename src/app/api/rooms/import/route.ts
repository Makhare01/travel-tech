import { createServerClient } from "@/lib/supabase/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { mapDbRowToHotelRoom } from "../route";

export async function POST(request: Request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID required" },
        { status: 400 }
      );
    }

    // Get organization details to verify it's a hotel
    const client = await clerkClient();
    const organization = await client.organizations.getOrganization({
      organizationId: orgId,
    });

    const organizationType = organization.publicMetadata?.type as string;

    if (organizationType !== "hotel") {
      return NextResponse.json(
        { error: "Only hotel organizations can import rooms" },
        { status: 403 }
      );
    }

    const { rooms } = await request.json();

    if (!Array.isArray(rooms) || rooms.length === 0) {
      return NextResponse.json(
        { error: "Invalid rooms data" },
        { status: 400 }
      );
    }

    // Prepare rooms for Supabase insert
    const roomsToInsert = rooms.map((room: any) => {
      const roomNumberInt =
        typeof room.roomNumber === "string"
          ? parseInt(room.roomNumber, 10)
          : room.roomNumber;

      // Convert facilities to PostgreSQL array format for text[] column
      const facilitiesArray = Array.isArray(room.facilities)
        ? room.facilities
        : [];
      const amenitiesArray =
        facilitiesArray.length > 0
          ? `{${facilitiesArray
              .map((f: string) => `"${String(f).replace(/"/g, '\\"')}"`)
              .join(",")}}`
          : "{}";

      const insertData: Record<string, any> = {};
      insertData["room-number"] = roomNumberInt;
      insertData["room-type"] = room.roomType || "";
      insertData.floor = room.floor || 0;
      insertData.capacity = room.capacity || 1;
      insertData.status = room.status || "available";
      // amenities is text[] (array) in Supabase schema, store as PostgreSQL array format
      insertData.amenities = amenitiesArray;
      return insertData;
    });

    // Insert rooms into Supabase
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("rooms")
      .insert(roomsToInsert)
      .select("*");

    if (error) {
      console.error("Error importing rooms to Supabase:", error);
      return NextResponse.json(
        { error: error.message || "Failed to import rooms" },
        { status: 500 }
      );
    }

    // Map database rows to HotelRoom format
    const importedRooms = (data || []).map(mapDbRowToHotelRoom);

    return NextResponse.json({
      success: true,
      rooms: importedRooms,
      message: `Successfully imported ${importedRooms.length} room(s)`,
    });
  } catch (error) {
    console.error("Error importing rooms:", error);
    return NextResponse.json(
      { error: "Failed to import rooms" },
      { status: 500 }
    );
  }
}
