import { AllOffers } from "@/components/offers/all-offers";
import { MyOffers } from "@/components/offers/my-offers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OffersPage() {
  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="my-offers" className="w-full">
        <TabsList>
          <TabsTrigger value="my-offers">My offers</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
        </TabsList>
        <TabsContent value="my-offers">
          <div className="mt-4">
            <MyOffers />
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
