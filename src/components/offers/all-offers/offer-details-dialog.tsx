"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Clock01Icon, FileIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

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
  // Agency-specific fields
  requiredRooms?: number;
  roomTypes?: Array<{ type: string; quantity: number }>;
  // Hotel-specific fields
  rooms?: Array<{
    roomId: string;
    groupPrice: number;
    individualPrice?: number;
  }>;
  allowSplitting?: boolean;
  remainingRooms?: number;
  // Common fields
  bookPeriodStart?: Date;
  bookPeriodEnd?: Date;
  contractFile?: File | string;
  contractFileName?: string;
  invoiceFile?: File | string;
  invoiceFileName?: string;
  bookType?: "hard" | "soft";
}

interface OfferDetailsDialogProps {
  offer: Offer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: () => void;
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function OfferDetailsDialog({
  offer,
  open,
  onOpenChange,
  onApply,
}: OfferDetailsDialogProps) {
  if (!offer) return null;

  const isAgencyOffer = offer.organization.type === "agency";
  const isHotelOffer = offer.organization.type === "hotel";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{offer.name}</DialogTitle>
          <DialogDescription>Offer Details</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Organization Info */}
          <div className="flex items-start gap-3 pb-4 border-b">
            <Avatar size="md">
              <AvatarImage
                src={offer.organization.logo}
                alt={offer.organization.name}
              />
              <AvatarFallback>
                {getInitials(offer.organization.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1">
                {offer.organization.name}
              </h3>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline" className="capitalize">
                  {offer.organization.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ID: {offer.organization.id}
                </span>
              </div>
            </div>
          </div>

          {/* Offer ID */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Offer ID
            </h3>
            <p className="text-sm font-mono">{offer.id}</p>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Description
            </h3>
            <p className="text-sm whitespace-pre-wrap">
              {offer.description || "No description provided"}
            </p>
          </div>

          <Separator />

          {/* Deadline */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Application Deadline
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <HugeiconsIcon
                icon={Clock01Icon}
                strokeWidth={2}
                className="size-4"
              />
              <span>{formatDate(offer.deadline)}</span>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Tags
            </h3>
            {offer.tags && offer.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {offer.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags</p>
            )}
          </div>

          <Separator />

          {/* Agency-specific fields */}
          {isAgencyOffer && (
            <>
              {/* Required Rooms */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Required Rooms
                </h3>
                <p className="text-sm font-medium">
                  {offer.requiredRooms !== undefined
                    ? offer.requiredRooms
                    : "Not specified"}
                </p>
              </div>

              <Separator />

              {/* Room Types */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Room Types & Quantities
                </h3>
                {offer.roomTypes && offer.roomTypes.length > 0 ? (
                  <div className="space-y-2">
                    {offer.roomTypes.map((rt, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 border rounded-lg"
                      >
                        <span className="text-sm font-medium">{rt.type}</span>
                        <Badge variant="outline">
                          {rt.quantity} room{rt.quantity !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No room types specified
                  </p>
                )}
              </div>

              <Separator />
            </>
          )}

          {/* Hotel-specific fields */}
          {isHotelOffer && (
            <>
              {/* Rooms & Pricing */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Rooms & Pricing
                </h3>
                {offer.rooms && offer.rooms.length > 0 ? (
                  <div className="space-y-2">
                    {offer.rooms.map((room, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 border rounded-lg"
                      >
                        <div>
                          <span className="text-sm font-medium">
                            Room ID: {room.roomId}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <Badge variant="outline">
                            Group: ${room.groupPrice}/night
                          </Badge>
                          {offer.allowSplitting && room.individualPrice && (
                            <Badge variant="outline">
                              Individual: ${room.individualPrice}/night
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No rooms specified
                  </p>
                )}
              </div>

              <Separator />

              {/* Allow Splitting */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Allow Splitting
                </h3>
                <p className="text-sm">
                  {offer.allowSplitting !== undefined
                    ? offer.allowSplitting
                      ? "Yes"
                      : "No"
                    : "Not specified"}
                </p>
              </div>

              <Separator />

              {/* Remaining Rooms */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Remaining Rooms
                </h3>
                <p className="text-sm font-medium">
                  {offer.allowSplitting
                    ? offer.remainingRooms !== undefined && offer.rooms
                      ? `${offer.remainingRooms} of ${offer.rooms.length} rooms available`
                      : "Not specified"
                    : "Not applicable (splitting not allowed)"}
                </p>
              </div>

              <Separator />

              {/* Invoice (Hotel only) */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Invoice
                </h3>
                {offer.invoiceFile ? (
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
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No invoice file
                  </p>
                )}
              </div>

              <Separator />
            </>
          )}

          {/* Common fields */}
          {/* Book Period */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Book Period
            </h3>
            <p className="text-sm">
              {offer.bookPeriodStart || offer.bookPeriodEnd
                ? formatDateRange(offer.bookPeriodStart, offer.bookPeriodEnd)
                : "Not specified"}
            </p>
          </div>

          <Separator />

          {/* Book Type */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Book Type
            </h3>
            {offer.bookType ? (
              <Badge variant="outline">
                {offer.bookType === "hard" ? "Hard Book" : "Soft Book"}
              </Badge>
            ) : (
              <p className="text-sm text-muted-foreground">Not specified</p>
            )}
          </div>

          <Separator />

          {/* Contract */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Contract
            </h3>
            {offer.contractFile ? (
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
            ) : (
              <p className="text-sm text-muted-foreground">No contract file</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onApply && <Button onClick={onApply}>Apply to Offer</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
