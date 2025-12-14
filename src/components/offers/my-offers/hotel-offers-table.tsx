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
import { CreateHotelOfferDialog } from "./create-hotel-offer-dialog";
import { DeleteOfferDialog } from "./delete-offer-dialog";
import { EditHotelOfferDialog } from "./edit-hotel-offer-dialog";
import { HotelOfferDetailsDialog } from "./hotel-offer-details-dialog";

type OfferStatus = "pending" | "active" | "canceled" | "completed";

interface Offer {
  id: string;
  name: string;
  status: OfferStatus;
  createdDate: Date;
  description?: string;
  rooms: Array<{
    roomId: string;
    groupPrice: number;
    individualPrice?: number;
  }>;
  bookPeriodStart?: Date;
  bookPeriodEnd?: Date;
  allowSplitting: boolean;
  remainingRooms?: number; // Calculated if splitting is allowed
  contractFile?: File | string;
  contractFileName?: string;
  invoiceFile?: File | string;
  invoiceFileName?: string;
  bookType: "hard" | "soft";
}

// Mock data - replace with actual data fetching
const mockOffers: Offer[] = [
  {
    id: "OFF-001",
    name: "Summer Special",
    status: "active",
    createdDate: new Date("2024-01-15"),
    description: "Special summer rates for hotel rooms.",
    rooms: [
      { roomId: "1", groupPrice: 150, individualPrice: 180 },
      { roomId: "2", groupPrice: 200, individualPrice: 250 },
      { roomId: "3", groupPrice: 180, individualPrice: 220 },
    ],
    bookPeriodStart: new Date("2024-06-01"),
    bookPeriodEnd: new Date("2024-08-31"),
    allowSplitting: true,
    remainingRooms: 2,
    bookType: "soft",
  },
  {
    id: "OFF-002",
    name: "Weekend Package",
    status: "pending",
    createdDate: new Date("2024-01-20"),
    description: "Weekend getaway package with breakfast included.",
    rooms: [
      { roomId: "4", groupPrice: 120 },
      { roomId: "5", groupPrice: 120 },
    ],
    bookPeriodStart: new Date("2024-05-01"),
    bookPeriodEnd: new Date("2024-05-31"),
    allowSplitting: false,
    bookType: "hard",
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

function formatDateRange(start?: Date, end?: Date): string {
  if (!start || !end) return "Not specified";
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export const HotelOffersTable = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [offers, setOffers] = useState<Offer[]>(mockOffers);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const filteredOffers =
    statusFilter === "all"
      ? offers
      : offers.filter((offer) => offer.status === statusFilter);

  const handleCreateOffer = async (data: {
    name: string;
    status: OfferStatus;
    description?: string;
    rooms: Array<{
      roomId: string;
      groupPrice: number;
      individualPrice?: number;
    }>;
    bookPeriodStart?: Date;
    bookPeriodEnd?: Date;
    allowSplitting: boolean;
    contractFile?: File | string;
    contractFileName?: string;
    invoiceFile?: File | string;
    invoiceFileName?: string;
    bookType: "hard" | "soft";
  }) => {
    // TODO: Replace with actual API call
    const newOffer: Offer = {
      id: `OFF-${String(offers.length + 1).padStart(3, "0")}`,
      name: data.name,
      status: data.status,
      createdDate: new Date(),
      description: data.description,
      rooms: data.rooms,
      bookPeriodStart: data.bookPeriodStart,
      bookPeriodEnd: data.bookPeriodEnd,
      allowSplitting: data.allowSplitting,
      remainingRooms: data.allowSplitting ? data.rooms.length : undefined,
      contractFile: data.contractFile,
      contractFileName: data.contractFileName,
      invoiceFile: data.invoiceFile,
      invoiceFileName: data.invoiceFileName,
      bookType: data.bookType,
    };
    setOffers([...offers, newOffer]);
  };

  const handleUpdateOffer = async (
    offerId: string,
    data: {
      name: string;
      status: OfferStatus;
      description?: string;
      rooms: Array<{
        roomId: string;
        groupPrice: number;
        individualPrice?: number;
      }>;
      bookPeriodStart?: Date;
      bookPeriodEnd?: Date;
      allowSplitting: boolean;
      contractFile?: File | string;
      contractFileName?: string;
      invoiceFile?: File | string;
      invoiceFileName?: string;
      bookType: "hard" | "soft";
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
              rooms: data.rooms,
              bookPeriodStart: data.bookPeriodStart,
              bookPeriodEnd: data.bookPeriodEnd,
              allowSplitting: data.allowSplitting,
              remainingRooms: data.allowSplitting
                ? data.rooms.length
                : undefined,
              contractFile: data.contractFile,
              contractFileName: data.contractFileName,
              invoiceFile: data.invoiceFile,
              invoiceFileName: data.invoiceFileName,
              bookType: data.bookType,
            }
          : offer
      )
    );
  };

  const handleDeleteOffer = async (offerId: string) => {
    // TODO: Replace with actual API call
    setOffers(offers.filter((offer) => offer.id !== offerId));
  };

  const handleStatusChange = async (
    offerId: string,
    newStatus: OfferStatus
  ) => {
    // TODO: Replace with actual API call
    setOffers(
      offers.map((offer) =>
        offer.id === offerId ? { ...offer, status: newStatus } : offer
      )
    );
    // Update selected offer if it's the one being changed
    if (selectedOffer?.id === offerId) {
      setSelectedOffer({ ...selectedOffer, status: newStatus });
    }
  };

  const handleRowClick = (offer: Offer) => {
    setSelectedOffer(offer);
    setIsDetailsDialogOpen(true);
  };

  const getTotalRooms = (offer: Offer): number => {
    return offer.rooms.length;
  };

  const getRoomsDisplay = (offer: Offer): string => {
    const total = getTotalRooms(offer);
    if (offer.allowSplitting && offer.remainingRooms !== undefined) {
      return `${total}/${offer.remainingRooms}`;
    }
    return total.toString();
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
          <CreateHotelOfferDialog onSubmit={handleCreateOffer}>
            <Button>
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Create Offer
            </Button>
          </CreateHotelOfferDialog>
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
                  Book Period
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Allow Splitting
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Total Rooms
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
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    No offers found
                  </td>
                </tr>
              ) : (
                filteredOffers.map((offer) => (
                  <tr
                    key={offer.id}
                    className="border-b border-border transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleRowClick(offer)}
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
                      {formatDateRange(
                        offer.bookPeriodStart,
                        offer.bookPeriodEnd
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {offer.allowSplitting ? "Yes" : "No"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {getRoomsDisplay(offer)}
                    </td>
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <EditHotelOfferDialog
                          offer={offer}
                          onSubmit={(data) => handleUpdateOffer(offer.id, data)}
                        >
                          <Button variant="ghost" size="icon-sm">
                            <HugeiconsIcon
                              icon={Edit01Icon}
                              strokeWidth={2}
                              className="size-4"
                            />
                            <span className="sr-only">Edit offer</span>
                          </Button>
                        </EditHotelOfferDialog>
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

      {/* Offer Details Dialog */}
      <HotelOfferDetailsDialog
        offer={selectedOffer}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};
