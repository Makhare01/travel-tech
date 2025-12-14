import { createServerClient } from "@/lib/supabase/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export interface HotelRoom {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  capacity: number;
  pricePerNight: number;
  facilities: string[];
  status: "available" | "occupied" | "maintenance" | "reserved";
  checkInDate?: string;
  checkOutDate?: string;
  guestName?: string;
  guestEmail?: string;
  bookingId?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to convert database row to HotelRoom
export function mapDbRowToHotelRoom(row: any): HotelRoom {
  let facilities: string[] = [];
  try {
    if (row.amenities) {
      // amenities is text[] (array) in Supabase schema
      if (Array.isArray(row.amenities)) {
        facilities = row.amenities;
      } else if (typeof row.amenities === "string") {
        // Fallback: if it's a string, try to parse as JSON or PostgreSQL array format
        try {
          // Try JSON first
          facilities = JSON.parse(row.amenities);
        } catch {
          // If JSON fails, try PostgreSQL array format {value1,value2}
          const match = row.amenities.match(/^\{(.+)\}$/);
          if (match) {
            facilities = match[1]
              .split(",")
              .map((s: string) => s.trim().replace(/^"|"$/g, ""))
              .filter(Boolean);
          }
        }
      }
    }
  } catch (e) {
    console.error("Error parsing amenities:", e);
    facilities = [];
  }

  return {
    id: row.id.toString(),
    // Handle both view (room_number) and direct table (room-number) column names
    roomNumber: (row.room_number || row["room-number"])?.toString() || "",
    roomType: row.room_type || row["room-type"] || "",
    floor: row.floor || 0,
    capacity: row.capacity || 0,
    pricePerNight: 0, // Not in DB schema
    facilities,
    status: row.status || "available",
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.created_at || new Date().toISOString(),
  };
}

export async function GET(request: Request) {
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
        { error: "Only hotel organizations can access rooms" },
        { status: 403 }
      );
    }

    // Fetch rooms from Supabase
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rooms from Supabase:", error);
      return NextResponse.json(
        { error: "Failed to fetch rooms" },
        { status: 500 }
      );
    }

    // Map database rows to HotelRoom format
    const rooms = (data || []).map(mapDbRowToHotelRoom);

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

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
        { error: "Only hotel organizations can create rooms" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { roomNumber, roomType, floor, capacity, facilities, status } = body;

    // Validate required fields
    if (!roomNumber || !roomType) {
      return NextResponse.json(
        { error: "Room number and room type are required" },
        { status: 400 }
      );
    }

    // Prepare data for Supabase insert
    // Note: Column names use kebab-case and amenities stores JSON string
    // Convert roomNumber to integer (handles both string and number inputs)
    const roomNumberInt =
      typeof roomNumber === "string" ? parseInt(roomNumber, 10) : roomNumber;

    if (isNaN(roomNumberInt)) {
      return NextResponse.json(
        { error: "Room number must be a valid number" },
        { status: 400 }
      );
    }

    // Insert into Supabase
    // Use direct table insert (RPC function approach requires setup)
    const supabaseClient = createServerClient();

    // Log if service role key is being used (for debugging)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn(
        "⚠️ SUPABASE_SERVICE_ROLE_KEY not set. Using anon key which will trigger RLS. Add SUPABASE_SERVICE_ROLE_KEY to .env.local"
      );
    }

    // Convert facilities array to PostgreSQL array format for text[] column
    // PostgreSQL arrays use format: {value1,value2,value3}
    const facilitiesArray = Array.isArray(facilities) ? facilities : [];
    // Format as PostgreSQL array: {value1,value2,value3}
    const amenitiesArray =
      facilitiesArray.length > 0
        ? `{${facilitiesArray
            .map((f) => `"${f.replace(/"/g, '\\"')}"`)
            .join(",")}}`
        : "{}";

    // Direct insert with hyphenated column names
    // Note: amenities is text[] (array), so we send as PostgreSQL array format
    const insertData: Record<string, any> = {
      "room-number": roomNumberInt,
      "room-type": roomType,
      floor: floor || 1,
      capacity: capacity || 1,
      status: status || "available",
      amenities: amenitiesArray, // Store as PostgreSQL array format for text[] column
    };

    // Try direct insert first
    let { data, error } = await supabaseClient
      .from("rooms")
      .insert(insertData)
      .select("*")
      .single();

    // If direct insert fails, try REST API fallback
    // Handles: schema cache issues (PGRST204/PGRST202) and array parsing errors (22P02)
    if (error) {
      const shouldUseFallback =
        error.code === "PGRST204" ||
        error.code === "PGRST202" ||
        error.code === "22P02";

      if (shouldUseFallback) {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          if (supabaseUrl && supabaseKey) {
            // Use REST API - amenities is text[] so send as PostgreSQL array format
            const restInsertData = {
              ...insertData,
              amenities: amenitiesArray, // PostgreSQL array format for text[]
            };

            // Use PostgREST with explicit casting via query parameter
            const response = await fetch(
              `${supabaseUrl}/rest/v1/rooms?select=*`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`,
                  Prefer: "return=representation",
                  // Explicitly tell PostgREST to treat amenities as text
                  Accept: "application/json",
                },
                body: JSON.stringify(restInsertData),
              }
            );

            if (response.ok) {
              const result = await response.json();
              data = Array.isArray(result) ? result[0] : result;
              error = null;
            } else {
              const errorText = await response.text();
              const originalError = error;
              error = {
                ...originalError,
                code: originalError.code || "PGRST204",
                message: `REST API insert failed: ${errorText}`,
              } as typeof originalError;
            }
          }
        } catch (restError) {
          console.error("REST API fallback failed:", restError);
        }
      }
    }

    if (error) {
      console.error("Error creating room in Supabase:", error);
      console.error("Insert data attempted:", {
        "room-number": roomNumberInt,
        "room-type": roomType,
        floor: floor || 1,
        capacity: capacity || 1,
        status: status || "available",
        amenities: amenitiesArray,
      });

      // Provide helpful error message
      if (error.code === "PGRST204" || error.code === "PGRST202") {
        return NextResponse.json(
          {
            error:
              "PostgREST cannot find columns with hyphenated names. Please either: 1) Refresh schema cache in Supabase Dashboard (Settings > API > Reload Schema), or 2) Run the SQL in supabase-fix.sql to create the insert_room function.",
            details: error.message,
            code: error.code,
          },
          { status: 500 }
        );
      }

      // Handle PostgreSQL array parsing error
      if (error.code === "22P02") {
        return NextResponse.json(
          {
            error:
              "PostgreSQL array parsing error. The amenities column is text[] and expects PostgreSQL array format. Please check your database schema.",
            details: error.message,
            code: error.code,
          },
          { status: 500 }
        );
      }

      // Handle RLS policy error
      if (error.code === "42501") {
        const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        return NextResponse.json(
          {
            error:
              "Row-Level Security policy violation. " +
              (hasServiceRoleKey
                ? "Service role key is set but RLS is still blocking. Check your RLS policies or disable RLS for this table."
                : "Please set SUPABASE_SERVICE_ROLE_KEY in your .env.local file. Get it from Supabase Dashboard > Settings > API > service_role key"),
            details: error.message,
            code: error.code,
            hint: hasServiceRoleKey
              ? "You may need to disable RLS for the rooms table or update your RLS policies"
              : "Add SUPABASE_SERVICE_ROLE_KEY=your_service_role_key to .env.local and restart the server",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: error.message || "Failed to create room" },
        { status: 500 }
      );
    }

    // Map database row to HotelRoom format
    const newRoom = mapDbRowToHotelRoom(data);

    return NextResponse.json({ room: newRoom }, { status: 201 });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
