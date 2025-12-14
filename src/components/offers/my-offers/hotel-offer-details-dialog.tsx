"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Cancel01Icon,
  Clock01Icon,
  FileIcon,
  PlayCircleIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

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
  remainingRooms?: number;
  contractFile?: File | string;
  contractFileName?: string;
  invoiceFile?: File | string;
  invoiceFileName?: string;
  bookType: "hard" | "soft";
}

interface HotelOfferDetailsDialogProps {
  offer: Offer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (
    offerId: string,
    newStatus: OfferStatus
  ) => void | Promise<void>;
}

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

export function HotelOfferDetailsDialog({
  offer,
  open,
  onOpenChange,
  onStatusChange,
}: HotelOfferDetailsDialogProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<OfferStatus | null>(
    offer?.status || null
  );
  const [rooms, setRooms] = useState<any[]>([]);

  // Update local status when offer changes
  useEffect(() => {
    if (offer) {
      setCurrentStatus(offer.status);
      // Fetch room details for display
      fetchRoomDetails();
    }
  }, [offer]);

  const fetchRoomDetails = async () => {
    if (!offer) return;
    try {
      const response = await fetch("/api/rooms");
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      }
    } catch (error) {
      console.error("Error fetching room details:", error);
    }
  };

  if (!offer) return null;

  const handleStatusChange = async (newStatus: OfferStatus) => {
    if (newStatus === currentStatus || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      await onStatusChange?.(offer.id, newStatus);
      setCurrentStatus(newStatus);
    } catch (error) {
      console.error("Error updating offer status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getRoomDetails = (roomId: string) => {
    return rooms.find((r) => r.id === roomId);
  };

  const totalRooms = offer.rooms.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{offer.name}</DialogTitle>
          <DialogDescription>Offer Details</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Offer ID */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Offer ID
            </h3>
            <p className="text-sm font-mono">{offer.id}</p>
          </div>

          <Separator />

          {/* Status */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Status
            </h3>
            <StatusBadge status={currentStatus || offer.status} />
          </div>

          <Separator />

          {/* Created Date */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Created Date
            </h3>
            <p className="text-sm">{formatDate(offer.createdDate)}</p>
          </div>

          <Separator />

          {/* Description */}
          {offer.description && (
            <>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Description
                </h3>
                <p className="text-sm whitespace-pre-wrap">
                  {offer.description}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Rooms */}
          {offer.rooms && offer.rooms.length > 0 && (
            <>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Rooms & Pricing
                </h3>
                <div className="space-y-2">
                  {offer.rooms.map((room, index) => {
                    const roomDetails = getRoomDetails(room.roomId);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 border rounded-lg"
                      >
                        <div>
                          <span className="text-sm font-medium">
                            {roomDetails
                              ? `Room ${roomDetails.roomNumber} - ${roomDetails.roomType}`
                              : `Room ID: ${room.roomId}`}
                          </span>
                          {roomDetails && (
                            <div className="text-xs text-muted-foreground">
                              Floor {roomDetails.floor} • Capacity:{" "}
                              {roomDetails.capacity}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <Badge variant="outline" className="ml-2">
                            Group: $
                            {typeof room === "object" && "groupPrice" in room
                              ? room.groupPrice
                              : typeof room === "object" && "price" in room
                              ? room.price
                              : 0}
                            /night
                          </Badge>
                          {offer.allowSplitting &&
                            typeof room === "object" &&
                            "individualPrice" in room &&
                            room.individualPrice && (
                              <Badge variant="outline" className="ml-2">
                                Individual: ${room.individualPrice}/night
                              </Badge>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Book Period */}
          {(offer.bookPeriodStart || offer.bookPeriodEnd) && (
            <>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Book Period
                </h3>
                <p className="text-sm">
                  {formatDateRange(offer.bookPeriodStart, offer.bookPeriodEnd)}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Allow Splitting */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Allow Splitting
            </h3>
            <p className="text-sm">{offer.allowSplitting ? "Yes" : "No"}</p>
          </div>
          <Separator />

          {/* Book Type */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Book Type
            </h3>
            <Badge variant="outline">
              {offer.bookType === "hard" ? "Hard Book" : "Soft Book"}
            </Badge>
          </div>

          {/* Remaining Rooms (if splitting is allowed) */}
          {offer.allowSplitting && offer.remainingRooms !== undefined && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Remaining Rooms
                </h3>
                <p className="text-sm font-medium">
                  {offer.remainingRooms} of {totalRooms} rooms available
                </p>
              </div>
            </>
          )}

          {/* Contract */}
          {offer.contractFile && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Contract
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-2">
                    <HugeiconsIcon
                      icon={FileIcon}
                      strokeWidth={2}
                      className="size-3"
                    />
                    {offer.contractFileName || "contract.pdf"}
                  </Badge>
                  {offer.contractFile instanceof File ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = URL.createObjectURL(
                          offer.contractFile as File
                        );
                        window.open(url, "_blank");
                      }}
                    >
                      View PDF
                    </Button>
                  ) : typeof offer.contractFile === "string" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(offer.contractFile as string, "_blank");
                      }}
                    >
                      View PDF
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          )}

          {/* Invoice */}
          {offer.invoiceFile && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Invoice
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-2">
                    <HugeiconsIcon
                      icon={FileIcon}
                      strokeWidth={2}
                      className="size-3"
                    />
                    {offer.invoiceFileName || "invoice.pdf"}
                  </Badge>
                  {offer.invoiceFile instanceof File ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = URL.createObjectURL(
                          offer.invoiceFile as File
                        );
                        window.open(url, "_blank");
                      }}
                    >
                      View PDF
                    </Button>
                  ) : typeof offer.invoiceFile === "string" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(offer.invoiceFile as string, "_blank");
                      }}
                    >
                      View PDF
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {onStatusChange && currentStatus === "pending" && (
          <>
            <Separator />
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("active")}
                  disabled={isUpdatingStatus}
                  className="flex-1 sm:flex-initial"
                >
                  <HugeiconsIcon
                    icon={PlayCircleIcon}
                    strokeWidth={2}
                    className="size-4 mr-2"
                  />
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("completed")}
                  disabled={isUpdatingStatus}
                  className="flex-1 sm:flex-initial"
                >
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    strokeWidth={2}
                    className="size-4 mr-2"
                  />
                  Complete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("canceled")}
                  disabled={isUpdatingStatus}
                  className="flex-1 sm:flex-initial"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    strokeWidth={2}
                    className="size-4 mr-2"
                  />
                  Cancel
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
        {onStatusChange && currentStatus === "active" && (
          <>
            <Separator />
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("completed")}
                  disabled={isUpdatingStatus}
                  className="flex-1 sm:flex-initial"
                >
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    strokeWidth={2}
                    className="size-4 mr-2"
                  />
                  Complete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("canceled")}
                  disabled={isUpdatingStatus}
                  className="flex-1 sm:flex-initial"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    strokeWidth={2}
                    className="size-4 mr-2"
                  />
                  Cancel
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
