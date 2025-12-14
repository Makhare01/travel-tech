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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const createOfferSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(3, "Name must be at least 3 characters"),
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

type CreateOfferFormData = z.infer<typeof createOfferSchema>;

interface CreateOfferDialogProps {
  children: React.ReactNode;
  onSubmit?: (data: {
    name: string;
    status: "pending" | "active" | "canceled" | "completed";
    description?: string;
    requiredRooms?: number;
    roomTypes?: Array<{ type: string; quantity: number }>;
    bookPeriodStart?: Date;
    bookPeriodEnd?: Date;
    contractFile?: File | string; // File object or URL/base64 string
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

export function CreateOfferDialog({
  children,
  onSubmit,
  organizationType = "agency",
}: CreateOfferDialogProps) {
  const [open, setOpen] = useState(false);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateOfferFormData>({
    resolver: zodResolver(createOfferSchema),
    defaultValues: {
      name: "",
      description: "",
      roomTypes: [],
      bookPeriodStart: "",
      bookPeriodEnd: "",
      contractFile: undefined,
      bookType: "soft",
    },
  });

  const selectedRoomTypes = watch("roomTypes") || [];
  const bookPeriodStart = watch("bookPeriodStart");
  const bookPeriodEnd = watch("bookPeriodEnd");

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

  const onSubmitForm = async (data: CreateOfferFormData) => {
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
        status: "pending", // Always default to pending on creation
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
        contractFile: contractFile || undefined,
        bookType: data.bookType,
      });
      reset({
        name: "",
        description: "",
        roomTypes: [],
        bookPeriodStart: "",
        bookPeriodEnd: "",
        contractFile: undefined,
        bookType: "soft",
      });
      setContractFile(null);
      setOpen(false);
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  const isAgency = organizationType === "agency";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Offer</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new offer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter offer name"
              {...register("name")}
              aria-invalid={errors.name ? "true" : "false"}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
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
                  id="bookType-soft"
                  value="soft"
                  {...register("bookType")}
                  className="size-4 cursor-pointer"
                />
                <Label
                  htmlFor="bookType-soft"
                  className="text-sm font-normal cursor-pointer"
                >
                  Soft Book
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="bookType-hard"
                  value="hard"
                  {...register("bookType")}
                  className="size-4 cursor-pointer"
                />
                <Label
                  htmlFor="bookType-hard"
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
                        htmlFor={`room-${type}`}
                        className="text-sm flex-1"
                      >
                        {type}
                      </Label>
                      <div className="flex items-center gap-2 w-32">
                        <Input
                          id={`room-${type}`}
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
                      htmlFor="bookPeriodStart"
                      className="text-xs text-muted-foreground"
                    >
                      Start Date
                    </Label>
                    <Input
                      id="bookPeriodStart"
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
                      htmlFor="bookPeriodEnd"
                      className="text-xs text-muted-foreground"
                    >
                      End Date
                    </Label>
                    <Input
                      id="bookPeriodEnd"
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
                <Label htmlFor="contractFile">Contract (PDF)</Label>
                <Input
                  id="contractFile"
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
                {contractFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {contractFile.name} (
                    {(contractFile.size / 1024).toFixed(2)} KB)
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
                setOpen(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Offer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
