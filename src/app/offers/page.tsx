import { AllOffers } from "@/components/offers/all-offers";
import { AgencyOffersTable } from "@/components/offers/my-offers/agency-offers-table";
import { HotelOffersTable } from "@/components/offers/my-offers/hotel-offers-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function OffersPage() {
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

  const organizationType = organization.publicMetadata?.type as
    | "agency"
    | "hotel"
    | undefined;

  // Default to agency if type is not set
  const isAgency = organizationType === "agency" || !organizationType;
  const isHotel = organizationType === "hotel";

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="my-offers" className="w-full">
        <TabsList>
          <TabsTrigger value="my-offers">My offers</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
        </TabsList>
        <TabsContent value="my-offers">
          <div className="mt-4">
            {isAgency && <AgencyOffersTable />}
            {isHotel && <HotelOffersTable />}
          </div>
        </TabsContent>
        <TabsContent value="offers">
          <div className="mt-4">
            <AllOffers />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
