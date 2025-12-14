"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const editOfferSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(3, "Name must be at least 3 characters"),
    status: z.enum(["pending", "active", "canceled", "completed"], {
      required_error: "Status is required",
    }),
    description: z.string().optional(),
    requiredRooms: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true; // Optional field
          const num = Number(val);
          return !isNaN(num) && Number.isInteger(num) && num >= 1;
        },
        { message: "Required rooms must be a positive integer" }
      ),
    roomTypes: z.array(z.string()).optional(),
    bookPeriodStart: z.string().optional(),
    bookPeriodEnd: z.string().optional(),
  })
  .refine(
    (data) => {
      // If start date is provided, end date should also be provided
      if (data.bookPeriodStart && !data.bookPeriodEnd) return false;
      if (!data.bookPeriodStart && data.bookPeriodEnd) return false;
      // If both dates are provided, end should be after start
      if (data.bookPeriodStart && data.bookPeriodEnd) {
        return new Date(data.bookPeriodEnd) >= new Date(data.bookPeriodStart);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["bookPeriodEnd"],
    }
  );

type EditOfferFormData = z.infer<typeof editOfferSchema>;

interface Offer {
  id: string;
  name: string;
  status: "pending" | "active" | "canceled" | "completed";
  createdDate: Date;
  description?: string;
  requiredRooms?: number;
  roomTypes?: string[];
  bookPeriodStart?: Date;
  bookPeriodEnd?: Date;
}

interface EditOfferDialogProps {
  offer: Offer;
  children: React.ReactNode;
  onSubmit?: (data: {
    name: string;
    status: "pending" | "active" | "canceled" | "completed";
    description?: string;
    requiredRooms?: number;
    roomTypes?: string[];
    bookPeriodStart?: Date;
    bookPeriodEnd?: Date;
  }) => void | Promise<void>;
  organizationType?: "agency" | "hotel";
}

const ROOM_TYPES = [
  "Standard",
  "Deluxe",
  "Suite",
  "Business",
  "Executive",
  "Presidential",
  "Family",
  "Studio",
];

function formatDateForInput(date?: Date): string {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function EditOfferDialog({
  offer,
  children,
  onSubmit,
  organizationType = "agency",
}: EditOfferDialogProps) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<EditOfferFormData>({
    resolver: zodResolver(editOfferSchema),
    defaultValues: {
      name: offer.name,
      status: offer.status,
      description: offer.description || "",
      requiredRooms: offer.requiredRooms?.toString() || "",
      roomTypes: offer.roomTypes || [],
      bookPeriodStart: formatDateForInput(offer.bookPeriodStart),
      bookPeriodEnd: formatDateForInput(offer.bookPeriodEnd),
    },
  });

  const selectedStatus = watch("status");
  const selectedRoomTypes = watch("roomTypes") || [];
  const bookPeriodStart = watch("bookPeriodStart");
  const bookPeriodEnd = watch("bookPeriodEnd");

  // Reset form when offer changes or dialog opens
  useEffect(() => {
    if (open) {
      reset({
        name: offer.name,
        status: offer.status,
        description: offer.description || "",
        requiredRooms: offer.requiredRooms?.toString() || "",
        roomTypes: offer.roomTypes || [],
        bookPeriodStart: formatDateForInput(offer.bookPeriodStart),
        bookPeriodEnd: formatDateForInput(offer.bookPeriodEnd),
      });
    }
  }, [offer, open, reset]);

  const handleRoomTypeChange = (roomType: string, checked: boolean) => {
    const currentTypes = selectedRoomTypes;
    if (checked) {
      setValue("roomTypes", [...currentTypes, roomType]);
    } else {
      setValue(
        "roomTypes",
        currentTypes.filter((type) => type !== roomType)
      );
    }
  };

  const onSubmitForm = async (data: EditOfferFormData) => {
    try {
      await onSubmit?.({
        name: data.name,
        status: data.status,
        description: data.description,
        requiredRooms: data.requiredRooms
          ? Number(data.requiredRooms)
          : undefined,
        roomTypes:
          data.roomTypes && data.roomTypes.length > 0
            ? data.roomTypes
            : undefined,
        bookPeriodStart: data.bookPeriodStart
          ? new Date(data.bookPeriodStart)
          : undefined,
        bookPeriodEnd: data.bookPeriodEnd
          ? new Date(data.bookPeriodEnd)
          : undefined,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error updating offer:", error);
    }
  };

  const isAgency = organizationType === "agency";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Offer</DialogTitle>
          <DialogDescription>
            Update the details below to modify this offer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-name"
              placeholder="Enter offer name"
              {...register("name")}
              aria-invalid={errors.name ? "true" : "false"}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) =>
                setValue("status", value as EditOfferFormData["status"])
              }
            >
              <SelectTrigger
                id="edit-status"
                aria-invalid={errors.status ? "true" : "false"}
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">
                {errors.status.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="Enter offer description (optional)"
              {...register("description")}
              rows={4}
            />
          </div>

          {isAgency && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-requiredRooms">Required Rooms</Label>
                <Input
                  id="edit-requiredRooms"
                  type="number"
                  min="1"
                  placeholder="Enter number of rooms required"
                  {...register("requiredRooms")}
                  aria-invalid={errors.requiredRooms ? "true" : "false"}
                />
                {errors.requiredRooms && (
                  <p className="text-sm text-destructive">
                    {errors.requiredRooms.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Room Types</Label>
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                  {ROOM_TYPES.map((type) => (
                    <label
                      key={type}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoomTypes.includes(type)}
                        onChange={(e) =>
                          handleRoomTypeChange(type, e.target.checked)
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Book Period</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="edit-bookPeriodStart"
                      className="text-xs text-muted-foreground"
                    >
                      Start Date
                    </Label>
                    <Input
                      id="edit-bookPeriodStart"
                      type="date"
                      {...register("bookPeriodStart")}
                      aria-invalid={errors.bookPeriodStart ? "true" : "false"}
                    />
                    {errors.bookPeriodStart && (
                      <p className="text-sm text-destructive">
                        {errors.bookPeriodStart.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-bookPeriodEnd"
                      className="text-xs text-muted-foreground"
                    >
                      End Date
                    </Label>
                    <Input
                      id="edit-bookPeriodEnd"
                      type="date"
                      min={bookPeriodStart || undefined}
                      {...register("bookPeriodEnd")}
                      aria-invalid={errors.bookPeriodEnd ? "true" : "false"}
                    />
                    {errors.bookPeriodEnd && (
                      <p className="text-sm text-destructive">
                        {errors.bookPeriodEnd.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Offer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
