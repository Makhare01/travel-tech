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
    status: z.enum(["pending", "active", "canceled", "completed"]),
    description: z.string().optional(),
    roomTypes: z
      .array(
        z.object({
          type: z.string(),
          quantity: z.string().refine(
            (val) => {
              if (!val) return false;
              const num = Number(val);
              return !isNaN(num) && Number.isInteger(num) && num >= 1;
            },
            { message: "Quantity must be a positive integer" }
          ),
        })
      )
      .optional(),
    bookPeriodStart: z.string().optional(),
    bookPeriodEnd: z.string().optional(),
    contractFile: z.instanceof(File).optional(),
    bookType: z.enum(["hard", "soft"]),
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
  roomTypes?: Array<{ type: string; quantity: number }>;
  bookPeriodStart?: Date;
  bookPeriodEnd?: Date;
  contractFile?: File | string;
  contractFileName?: string;
  bookType: "hard" | "soft";
}

interface EditOfferDialogProps {
  offer: Offer;
  children: React.ReactNode;
  onSubmit?: (data: {
    name: string;
    status: "pending" | "active" | "canceled" | "completed";
    description?: string;
    requiredRooms?: number;
    roomTypes?: Array<{ type: string; quantity: number }>;
    bookPeriodStart?: Date;
    bookPeriodEnd?: Date;
    contractFile?: File | string;
    contractFileName?: string;
    bookType: "hard" | "soft";
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
  const [contractFile, setContractFile] = useState<File | null>(null);
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
      roomTypes:
        offer.roomTypes?.map((rt) => ({
          type: typeof rt === "string" ? rt : rt.type,
          quantity: typeof rt === "string" ? "1" : rt.quantity.toString(),
        })) || [],
      bookPeriodStart: formatDateForInput(offer.bookPeriodStart),
      bookPeriodEnd: formatDateForInput(offer.bookPeriodEnd),
      contractFile: undefined,
      bookType: offer.bookType || "soft",
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
        roomTypes:
          offer.roomTypes?.map((rt) => ({
            type: typeof rt === "string" ? rt : rt.type,
            quantity: typeof rt === "string" ? "1" : rt.quantity.toString(),
          })) || [],
        bookPeriodStart: formatDateForInput(offer.bookPeriodStart),
        bookPeriodEnd: formatDateForInput(offer.bookPeriodEnd),
        contractFile: undefined,
        bookType: offer.bookType || "soft",
      });
      setContractFile(null);
    }
  }, [offer, open, reset]);

  const handleRoomTypeQuantityChange = (roomType: string, quantity: string) => {
    const currentTypes = selectedRoomTypes as Array<{
      type: string;
      quantity: string;
    }>;
    const quantityNum = quantity ? Number(quantity) : 0;

    if (quantityNum > 0) {
      // Update or add room type
      const existingIndex = currentTypes.findIndex(
        (rt) => rt.type === roomType
      );
      if (existingIndex >= 0) {
        const updated = [...currentTypes];
        updated[existingIndex] = { type: roomType, quantity };
        setValue("roomTypes", updated);
      } else {
        setValue("roomTypes", [...currentTypes, { type: roomType, quantity }]);
      }
    } else {
      // Remove room type if quantity is 0 or empty
      setValue(
        "roomTypes",
        currentTypes.filter((rt) => rt.type !== roomType)
      );
    }
  };

  const getRoomTypeQuantity = (roomType: string): string => {
    const currentTypes = selectedRoomTypes as Array<{
      type: string;
      quantity: string;
    }>;
    const found = currentTypes.find((rt) => rt.type === roomType);
    return found?.quantity || "";
  };

  // Calculate total required rooms from room types
  const calculatedRequiredRooms = selectedRoomTypes.reduce(
    (sum, rt) =>
      sum + (Number((rt as { type: string; quantity: string }).quantity) || 0),
    0
  );

  const onSubmitForm = async (data: EditOfferFormData) => {
    try {
      // Calculate required rooms from room types
      const calculatedRequiredRooms =
        data.roomTypes && data.roomTypes.length > 0
          ? data.roomTypes.reduce(
              (sum, rt) => sum + (Number(rt.quantity) || 0),
              0
            )
          : undefined;

      await onSubmit?.({
        name: data.name,
        status: data.status,
        description: data.description,
        requiredRooms: calculatedRequiredRooms,
        roomTypes:
          data.roomTypes && data.roomTypes.length > 0
            ? data.roomTypes.map((rt) => ({
                type: rt.type,
                quantity: Number(rt.quantity),
              }))
            : undefined,
        bookPeriodStart: data.bookPeriodStart
          ? new Date(data.bookPeriodStart)
          : undefined,
        bookPeriodEnd: data.bookPeriodEnd
          ? new Date(data.bookPeriodEnd)
          : undefined,
        contractFile: contractFile || offer.contractFile,
        contractFileName:
          contractFile instanceof File
            ? contractFile.name
            : offer.contractFileName,
        bookType: data.bookType,
      });
      setOpen(false);
      setContractFile(null);
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

          <div className="space-y-2">
            <Label>
              Book Type <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="edit-bookType-soft"
                  value="soft"
                  {...register("bookType")}
                  className="size-4 cursor-pointer"
                />
                <Label
                  htmlFor="edit-bookType-soft"
                  className="text-sm font-normal cursor-pointer"
                >
                  Soft Book
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="edit-bookType-hard"
                  value="hard"
                  {...register("bookType")}
                  className="size-4 cursor-pointer"
                />
                <Label
                  htmlFor="edit-bookType-hard"
                  className="text-sm font-normal cursor-pointer"
                >
                  Hard Book
                </Label>
              </div>
            </div>
            {errors.bookType && (
              <p className="text-sm text-destructive">
                {errors.bookType.message}
              </p>
            )}
          </div>

          {isAgency && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Room Types & Quantities</Label>
                  {calculatedRequiredRooms > 0 && (
                    <span className="text-sm text-muted-foreground">
                      Total:{" "}
                      <strong className="text-foreground">
                        {calculatedRequiredRooms}
                      </strong>{" "}
                      room{calculatedRequiredRooms !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="space-y-3 p-3 border rounded-lg">
                  {ROOM_TYPES.map((type) => (
                    <div
                      key={type}
                      className="flex items-center justify-between gap-4"
                    >
                      <Label
                        htmlFor={`edit-room-${type}`}
                        className="text-sm flex-1"
                      >
                        {type}
                      </Label>
                      <div className="flex items-center gap-2 w-32">
                        <Input
                          id={`edit-room-${type}`}
                          type="number"
                          min="0"
                          placeholder="0"
                          value={getRoomTypeQuantity(type)}
                          onChange={(e) =>
                            handleRoomTypeQuantityChange(type, e.target.value)
                          }
                          className="w-full"
                        />
                        <span className="text-sm text-muted-foreground">
                          rooms
                        </span>
                      </div>
                    </div>
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

              <div className="space-y-2">
                <Label htmlFor="edit-contractFile">Contract (PDF)</Label>
                <Input
                  id="edit-contractFile"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.type !== "application/pdf") {
                        alert("Please upload a PDF file");
                        e.target.value = "";
                        return;
                      }
                      setContractFile(file);
                      setValue("contractFile", file);
                    } else {
                      setContractFile(null);
                      setValue("contractFile", undefined);
                    }
                  }}
                  className="cursor-pointer"
                />
                {(contractFile || offer.contractFileName) && (
                  <p className="text-sm text-muted-foreground">
                    {contractFile
                      ? `Selected: ${contractFile.name} (${(
                          contractFile.size / 1024
                        ).toFixed(2)} KB)`
                      : `Current: ${offer.contractFileName || "contract.pdf"}`}
                  </p>
                )}
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setContractFile(null);
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
