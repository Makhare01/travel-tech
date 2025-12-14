"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Clock01Icon, SearchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";
import { ApplyOfferDialog } from "./apply-offer-dialog";

type OrganizationType = "hotel" | "agency";

interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  logo?: string;
}

interface Offer {
  id: string;
  name: string;
  description: string;
  deadline: Date;
  tags: string[];
  organization: Organization;
}

// Mock data - replace with actual data fetching
const mockOffers: Offer[] = [
  {
    id: "OFF-001",
    name: "Summer Vacation Package",
    description:
      "Enjoy a luxurious summer getaway with our all-inclusive vacation package. Includes flights, hotel accommodation, and daily breakfast.",
    deadline: new Date("2024-08-15"),
    tags: ["Summer", "All-Inclusive", "Beach"],
    organization: {
      id: "ORG-001",
      name: "Paradise Travel Agency",
      type: "agency",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Paradise",
    },
  },
  {
    id: "OFF-002",
    name: "Business Travel Deal",
    description:
      "Perfect for corporate travelers. Special rates on premium hotel rooms with meeting facilities and high-speed internet.",
    deadline: new Date("2024-07-30"),
    tags: ["Business", "Corporate", "Premium"],
    organization: {
      id: "ORG-002",
      name: "Grand Plaza Hotel",
      type: "hotel",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Grand",
    },
  },
  {
    id: "OFF-003",
    name: "Weekend Getaway",
    description:
      "Escape the city for a relaxing weekend. Two nights accommodation with spa access and complimentary dinner.",
    deadline: new Date("2024-09-20"),
    tags: ["Weekend", "Spa", "Relaxation"],
    organization: {
      id: "ORG-003",
      name: "Serenity Resorts",
      type: "hotel",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Serenity",
    },
  },
  {
    id: "OFF-004",
    name: "Adventure Tour Package",
    description:
      "Thrilling adventure tour including hiking, rafting, and camping. All equipment and guides included.",
    deadline: new Date("2024-10-10"),
    tags: ["Adventure", "Outdoor", "Sports"],
    organization: {
      id: "ORG-004",
      name: "Adventure Explorers",
      type: "agency",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Adventure",
    },
  },
  {
    id: "OFF-005",
    name: "Luxury Spa Retreat",
    description:
      "Indulge in a premium spa experience with multiple treatments, gourmet meals, and ocean-view rooms.",
    deadline: new Date("2024-08-25"),
    tags: ["Luxury", "Spa", "Wellness"],
    organization: {
      id: "ORG-005",
      name: "Ocean Breeze Hotel",
      type: "hotel",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Ocean",
    },
  },
  {
    id: "OFF-006",
    name: "Family Fun Package",
    description:
      "Perfect for families with kids. Includes theme park tickets, family rooms, and kid-friendly activities.",
    deadline: new Date("2024-09-05"),
    tags: ["Family", "Kids", "Entertainment"],
    organization: {
      id: "ORG-006",
      name: "Family Travel Co",
      type: "agency",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=Family",
    },
  },
];

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Generate a colorful border color based on offer ID
function getBorderColor(offerId: string): string {
  const colors = [
    "border-blue-500/50 hover:border-blue-500",
    "border-purple-500/50 hover:border-purple-500",
    "border-pink-500/50 hover:border-pink-500",
    "border-orange-500/50 hover:border-orange-500",
    "border-green-500/50 hover:border-green-500",
    "border-cyan-500/50 hover:border-cyan-500",
    "border-indigo-500/50 hover:border-indigo-500",
    "border-rose-500/50 hover:border-rose-500",
  ];
  // Use offer ID to consistently assign a color
  const index = offerId.charCodeAt(offerId.length - 1) % colors.length;
  return colors[index];
}

export const AllOffers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredOffers = useMemo(() => {
    return mockOffers.filter((offer) => {
      const matchesSearch =
        searchQuery === "" ||
        offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.organization.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        offer.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesType =
        typeFilter === "all" || offer.organization.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [searchQuery, typeFilter]);

  const handleApply = (offer: Offer) => {
    setSelectedOffer(offer);
    setIsDialogOpen(true);
  };

  const handleSubmitApplication = async (data: {
    message: string;
    contactEmail: string;
  }) => {
    if (!selectedOffer) return;
    // TODO: Replace with actual API call
    console.log("Applying to offer:", selectedOffer.id, data);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">All Offers</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <InputGroup className="w-full sm:w-[300px]">
            <InputGroupAddon align="inline-start">
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              placeholder="Search offers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="hotel">Hotels</SelectItem>
              <SelectItem value="agency">Agencies</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Offers Grid */}
      {filteredOffers.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            No offers found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
            <Card
              key={offer.id}
              className={cn(
                "flex flex-col transition-all duration-300 cursor-pointer",
                "hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/30",
                "hover:-translate-y-1",
                getBorderColor(offer.id)
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{offer.name}</CardTitle>
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar size="sm">
                        <AvatarImage
                          src={offer.organization.logo}
                          alt={offer.organization.name}
                        />
                        <AvatarFallback>
                          {getInitials(offer.organization.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {offer.organization.name}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {offer.organization.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="line-clamp-3">
                  {offer.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HugeiconsIcon
                    icon={Clock01Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                  <span>Deadline: {formatDate(offer.deadline)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {offer.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleApply(offer)}>
                  Apply
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Apply Offer Dialog */}
      {selectedOffer && (
        <ApplyOfferDialog
          offer={selectedOffer}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleSubmitApplication}
        />
      )}
    </div>
  );
};
