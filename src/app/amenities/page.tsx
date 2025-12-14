import { HotelRoomsTable } from "@/components/amenities/hotel-rooms-table";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AmenitiesPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  if (!orgId) {
    redirect("/onboarding");
  }

  // Get organization details to check the type
  const client = await clerkClient();
  const organization = await client.organizations.getOrganization({
    organizationId: orgId,
  });

  const organizationType = organization.publicMetadata?.type as string;

  // Only allow hotel organizations to access this page
  if (organizationType !== "hotel") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6 max-w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Amenities</h1>
        <p className="text-muted-foreground mt-2">
          Manage your hotel amenities and services
        </p>
      </div>
      <div className="mt-4 w-full">
        <HotelRoomsTable />
      </div>
    </div>
  );
}
