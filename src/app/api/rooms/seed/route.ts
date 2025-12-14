import { createServerClient } from "@/lib/supabase/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const DUMMY_ROOMS = [
  {
    "room-number": 101,
    "room-type": "Standard Single",
    floor: 1,
    capacity: 1,
    status: "available",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Safety deposit box",
      "Linen",
    ],
  },
  {
    "room-number": 102,
    "room-type": "Standard Double",
    floor: 1,
    capacity: 2,
    status: "available",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Safety deposit box",
      "Linen",
      "Socket near the bed",
    ],
  },
  {
    "room-number": 103,
    "room-type": "Deluxe Suite",
    floor: 1,
    capacity: 2,
    status: "occupied",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Hot tub",
      "Sauna",
      "Sea view",
      "Safety deposit box",
      "Linen",
    ],
  },
  {
    "room-number": 201,
    "room-type": "Standard Single",
    floor: 2,
    capacity: 1,
    status: "reserved",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Safety deposit box",
      "Linen",
      "Reading light",
    ],
  },
  {
    "room-number": 202,
    "room-type": "Standard Double",
    floor: 2,
    capacity: 2,
    status: "available",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Safety deposit box",
      "Linen",
      "Electric kettle",
    ],
  },
  {
    "room-number": 203,
    "room-type": "Deluxe Suite",
    floor: 2,
    capacity: 3,
    status: "available",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Hot tub",
      "Sea view",
      "Safety deposit box",
      "Linen",
      "Patio",
    ],
  },
  {
    "room-number": 204,
    "room-type": "Family Room",
    floor: 2,
    capacity: 4,
    status: "available",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Cots",
      "Children's high chair",
      "Safety deposit box",
      "Linen",
      "Video games",
    ],
  },
  {
    "room-number": 301,
    "room-type": "Standard Single",
    floor: 3,
    capacity: 1,
    status: "maintenance",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Safety deposit box",
      "Linen",
    ],
  },
  {
    "room-number": 302,
    "room-type": "Standard Double",
    floor: 3,
    capacity: 2,
    status: "available",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Safety deposit box",
      "Linen",
      "Bathrobe",
    ],
  },
  {
    "room-number": 303,
    "room-type": "Deluxe Suite",
    floor: 3,
    capacity: 2,
    status: "occupied",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Hot tub",
      "Sauna",
      "Sea view",
      "Safety deposit box",
      "Linen",
      "Outdoor dining area",
    ],
  },
  {
    "room-number": 304,
    "room-type": "Presidential Suite",
    floor: 3,
    capacity: 4,
    status: "reserved",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Hot tub",
      "Sauna",
      "Sea view",
      "Safety deposit box",
      "Linen",
      "Patio",
      "Outdoor dining area",
      "Dressing room",
      "Bathrobe",
    ],
  },
  {
    "room-number": 401,
    "room-type": "Standard Single",
    floor: 4,
    capacity: 1,
    status: "available",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Safety deposit box",
      "Linen",
      "Inner courtyard view",
    ],
  },
  {
    "room-number": 402,
    "room-type": "Standard Double",
    floor: 4,
    capacity: 2,
    status: "available",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Safety deposit box",
      "Linen",
      "Sea view",
    ],
  },
  {
    "room-number": 403,
    "room-type": "Accessible Room",
    floor: 4,
    capacity: 2,
    status: "available",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Hearing accessible",
      "Adapted bath",
      "Safety deposit box",
      "Linen",
    ],
  },
  {
    "room-number": 404,
    "room-type": "Deluxe Suite",
    floor: 4,
    capacity: 3,
    status: "available",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Hot tub",
      "Sea view",
      "Safety deposit box",
      "Linen",
      "Patio",
      "Reading light",
    ],
  },
  {
    "room-number": 501,
    "room-type": "Standard Single",
    floor: 5,
    capacity: 1,
    status: "occupied",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Safety deposit box",
      "Linen",
      "Sea view",
    ],
  },
  {
    "room-number": 502,
    "room-type": "Standard Double",
    floor: 5,
    capacity: 2,
    status: "available",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Safety deposit box",
      "Linen",
      "Sea view",
      "Electric kettle",
    ],
  },
  {
    "room-number": 503,
    "room-type": "Deluxe Suite",
    floor: 5,
    capacity: 2,
    status: "reserved",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Hot tub",
      "Sauna",
      "Sea view",
      "Safety deposit box",
      "Linen",
      "Patio",
    ],
  },
  {
    "room-number": 504,
    "room-type": "Presidential Suite",
    floor: 5,
    capacity: 4,
    status: "available",
    amenities: [
      "Air conditioning",
      "Private bathroom",
      "Hot tub",
      "Sauna",
      "Sea view",
      "Safety deposit box",
      "Linen",
      "Patio",
      "Outdoor dining area",
      "Dressing room",
      "Bathrobe",
      "Stovetop",
    ],
  },
];

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
        { error: "Only hotel organizations can seed rooms" },
        { status: 403 }
      );
    }

    const supabaseClient = createServerClient();

    // Convert amenities arrays to PostgreSQL array format
    const roomsToInsert = DUMMY_ROOMS.map((room) => ({
      ...room,
      amenities:
        room.amenities.length > 0
          ? `{${room.amenities
              .map((f) => `"${f.replace(/"/g, '\\"')}"`)
              .join(",")}}`
          : "{}",
    }));

    // Insert all rooms
    const { data, error } = await supabaseClient
      .from("rooms")
      .insert(roomsToInsert)
      .select("*");

    if (error) {
      console.error("Error seeding rooms:", error);

      // Handle RLS policy error
      if (error.code === "42501") {
        const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        return NextResponse.json(
          {
            error:
              "Row-Level Security policy violation. " +
              (hasServiceRoleKey
                ? "Service role key is set but RLS is still blocking. Check your RLS policies or disable RLS for this table."
                : "Please set SUPABASE_SERVICE_ROLE_KEY in your .env.local file."),
            details: error.message,
            code: error.code,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: error.message || "Failed to seed rooms" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: `Successfully seeded ${data?.length || 0} rooms`,
        rooms: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error seeding rooms:", error);
    return NextResponse.json(
      { error: "Failed to seed rooms" },
      { status: 500 }
    );
  }
}
