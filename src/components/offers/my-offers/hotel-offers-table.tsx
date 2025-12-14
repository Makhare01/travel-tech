"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Cancel01Icon,
  Clock01Icon,
  Delete01Icon,
  Edit01Icon,
  PlayCircleIcon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { CreateOfferDialog } from "./create-offer-dialog";
import { DeleteOfferDialog } from "./delete-offer-dialog";
import { EditOfferDialog } from "./edit-offer-dialog";

type OfferStatus = "pending" | "active" | "canceled" | "completed";

interface Offer {
  id: string;
  name: string;
  status: OfferStatus;
  createdDate: Date;
  description?: string;
}

// Mock data - replace with actual data fetching
const mockOffers: Offer[] = [
  {
    id: "OFF-001",
    name: "Summer Special",
    status: "active",
    createdDate: new Date("2024-01-15"),
    description: "Special summer rates for hotel rooms.",
  },
  {
    id: "OFF-002",
    name: "Weekend Package",
    status: "pending",
    createdDate: new Date("2024-01-20"),
    description: "Weekend getaway package with breakfast included.",
  },
];

const statusConfig: Record<
  OfferStatus,
  { label: string; icon: any; className: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock01Icon,
    className:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20",
  },
  active: {
    label: "Active",
    icon: PlayCircleIcon,
    className:
      "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20",
  },
  canceled: {
    label: "Canceled",
    icon: Cancel01Icon,
    className: "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20",
  },
  completed: {
    label: "Completed",
    icon: Tick02Icon,
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20",
  },
};

function StatusBadge({ status }: { status: OfferStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1.5 border", config.className)}>
      <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-3" />
      {config.label}
    </Badge>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export const HotelOffersTable = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [offers, setOffers] = useState<Offer[]>(mockOffers);

  const filteredOffers =
    statusFilter === "all"
      ? offers
      : offers.filter((offer) => offer.status === statusFilter);

  const handleCreateOffer = async (data: {
    name: string;
    status: OfferStatus;
    description?: string;
  }) => {
    // TODO: Replace with actual API call
    const newOffer: Offer = {
      id: `OFF-${String(offers.length + 1).padStart(3, "0")}`,
      name: data.name,
      status: data.status,
      createdDate: new Date(),
      description: data.description,
    };
    setOffers([...offers, newOffer]);
  };

  const handleUpdateOffer = async (
    offerId: string,
    data: {
      name: string;
      status: OfferStatus;
      description?: string;
    }
  ) => {
    // TODO: Replace with actual API call
    setOffers(
      offers.map((offer) =>
        offer.id === offerId
          ? {
              ...offer,
              name: data.name,
              status: data.status,
              description: data.description,
            }
          : offer
      )
    );
  };

  const handleDeleteOffer = async (offerId: string) => {
    // TODO: Replace with actual API call
    setOffers(offers.filter((offer) => offer.id !== offerId));
  };

  return (
    <div className="space-y-4">
      {/* Header with Create Button and Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My Offers</h2>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <CreateOfferDialog
            onSubmit={handleCreateOffer}
            organizationType="hotel"
          >
            <Button>
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Create Offer
            </Button>
          </CreateOfferDialog>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Offer Id
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Created Date
                </th>
                <th className="px-6 py-3 text-right text-sm font-medium text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOffers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    No offers found
                  </td>
                </tr>
              ) : (
                filteredOffers.map((offer) => (
                  <tr
                    key={offer.id}
                    className="border-b border-border transition-colors hover:bg-muted/50"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-foreground">
                      {offer.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {offer.name}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={offer.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(offer.createdDate)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <EditOfferDialog
                          offer={offer}
                          onSubmit={(data) => handleUpdateOffer(offer.id, data)}
                          organizationType="hotel"
                        >
                          <Button variant="ghost" size="icon-sm">
                            <HugeiconsIcon
                              icon={Edit01Icon}
                              strokeWidth={2}
                              className="size-4"
                            />
                            <span className="sr-only">Edit offer</span>
                          </Button>
                        </EditOfferDialog>
                        <DeleteOfferDialog
                          offerName={offer.name}
                          onConfirm={() => handleDeleteOffer(offer.id)}
                        >
                          <Button variant="ghost" size="icon-sm">
                            <HugeiconsIcon
                              icon={Delete01Icon}
                              strokeWidth={2}
                              className="size-4 text-destructive"
                            />
                            <span className="sr-only">Delete offer</span>
                          </Button>
                        </DeleteOfferDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
