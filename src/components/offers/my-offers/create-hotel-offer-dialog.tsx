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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const createHotelOfferSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(3, "Name must be at least 3 characters"),
    description: z.string().optional(),
    allowSplitting: z.boolean(),
    rooms: z
      .array(
        z.object({
          roomId: z.string(),
          groupPrice: z.string().refine(
            (val) => {
              if (!val) return false;
              const num = Number(val);
              return !isNaN(num) && num >= 0;
            },
            { message: "Group price must be a valid number" }
          ),
          individualPrice: z.string().optional(),
        })
      )
      .min(1, "At least one room is required"),
    bookPeriodStart: z.string().optional(),
    bookPeriodEnd: z.string().optional(),
    contractFile: z.instanceof(File).optional(),
    invoiceFile: z.instanceof(File).optional(),
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
  )
  .refine(
    (data) => {
      // If allowSplitting is true, all rooms must have individualPrice
      if (data.allowSplitting) {
        return data.rooms.every(
          (room) => room.individualPrice && room.individualPrice !== ""
        );
      }
      return true;
    },
    {
      message:
        "Individual price is required for all rooms when splitting is allowed",
      path: ["rooms"],
    }
  );

type CreateHotelOfferFormData = z.infer<typeof createHotelOfferSchema>;

interface HotelRoom {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  capacity: number;
  pricePerNight: number;
  facilities: string[];
  status: "available" | "occupied" | "maintenance" | "reserved";
}

interface CreateHotelOfferDialogProps {
  children: React.ReactNode;
  onSubmit?: (data: {
    name: string;
    status: "pending" | "active" | "canceled" | "completed";
    description?: string;
    rooms: Array<{
      roomId: string;
      groupPrice: number;
      individualPrice?: number;
    }>;
    bookPeriodStart?: Date;
    bookPeriodEnd?: Date;
    allowSplitting: boolean;
    contractFile?: File;
    contractFileName?: string;
    invoiceFile?: File;
    invoiceFileName?: string;
    bookType: "hard" | "soft";
  }) => void | Promise<void>;
}

export function CreateHotelOfferDialog({
  children,
  onSubmit,
}: CreateHotelOfferDialogProps) {
  const [open, setOpen] = useState(false);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<HotelRoom[]>([]);
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateHotelOfferFormData>({
    resolver: zodResolver(createHotelOfferSchema),
    defaultValues: {
      name: "",
      description: "",
      allowSplitting: false,
      rooms: [],
      bookPeriodStart: "",
      bookPeriodEnd: "",
      contractFile: undefined,
      invoiceFile: undefined,
      bookType: "soft",
    },
  });

  const selectedRooms = watch("rooms") || [];
  const bookPeriodStart = watch("bookPeriodStart");
  const bookPeriodEnd = watch("bookPeriodEnd");
  const allowSplitting = watch("allowSplitting");

  // Fetch rooms when dialog opens
  useEffect(() => {
    if (open) {
      fetchRooms();
    }
  }, [open]);

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await fetch("/api/rooms");
      if (!response.ok) {
        throw new Error("Failed to fetch rooms");
      }
      const data = await response.json();
      const fetchedRooms = data.rooms || [];
      setRooms(fetchedRooms);
      setFilteredRooms(fetchedRooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Filter rooms based on search query
  useEffect(() => {
    if (roomSearchQuery.trim() === "") {
      setFilteredRooms(rooms);
    } else {
      const query = roomSearchQuery.toLowerCase();
      setFilteredRooms(
        rooms.filter(
          (room) =>
            room.roomNumber.toLowerCase().includes(query) ||
            room.roomType.toLowerCase().includes(query) ||
            room.floor.toString().includes(query)
        )
      );
    }
  }, [roomSearchQuery, rooms]);

  const handleRoomToggle = (roomId: string, checked: boolean) => {
    const currentRooms = selectedRooms;
    if (checked) {
      const room = rooms.find((r) => r.id === roomId);
      setValue("rooms", [
        ...currentRooms,
        {
          roomId,
          groupPrice: room?.pricePerNight?.toString() || "0",
          individualPrice: allowSplitting
            ? room?.pricePerNight?.toString() || "0"
            : undefined,
        },
      ]);
    } else {
      setValue(
        "rooms",
        currentRooms.filter((r) => r.roomId !== roomId)
      );
    }
  };

  const handleGroupPriceChange = (roomId: string, price: string) => {
    const currentRooms = selectedRooms;
    const updatedRooms = currentRooms.map((r) =>
      r.roomId === roomId ? { ...r, groupPrice: price } : r
    );
    setValue("rooms", updatedRooms);
  };

  const handleIndividualPriceChange = (roomId: string, price: string) => {
    const currentRooms = selectedRooms;
    const updatedRooms = currentRooms.map((r) =>
      r.roomId === roomId ? { ...r, individualPrice: price || undefined } : r
    );
    setValue("rooms", updatedRooms);
  };

  const getRoomGroupPrice = (roomId: string): string => {
    const found = selectedRooms.find((r) => r.roomId === roomId);
    return found?.groupPrice || "";
  };

  const getRoomIndividualPrice = (roomId: string): string => {
    const found = selectedRooms.find((r) => r.roomId === roomId);
    return found?.individualPrice || "";
  };

  // Update individual prices when allowSplitting changes
  useEffect(() => {
    if (allowSplitting) {
      // Enable individual pricing for all selected rooms
      const currentRooms = selectedRooms;
      const updatedRooms = currentRooms.map((r) => ({
        ...r,
        individualPrice: r.individualPrice || r.groupPrice,
      }));
      setValue("rooms", updatedRooms);
    } else {
      // Remove individual pricing
      const currentRooms = selectedRooms;
      const updatedRooms = currentRooms.map((r) => ({
        ...r,
        individualPrice: undefined,
      }));
      setValue("rooms", updatedRooms);
    }
  }, [allowSplitting]);

  const isRoomSelected = (roomId: string): boolean => {
    return selectedRooms.some((r) => r.roomId === roomId);
  };

  const onSubmitForm = async (data: CreateHotelOfferFormData) => {
    try {
      await onSubmit?.({
        name: data.name,
        status: "pending", // Always default to pending on creation
        description: data.description,
        rooms: data.rooms.map((r) => ({
          roomId: r.roomId,
          groupPrice: Number(r.groupPrice),
          individualPrice: r.individualPrice
            ? Number(r.individualPrice)
            : undefined,
        })),
        bookPeriodStart: data.bookPeriodStart
          ? new Date(data.bookPeriodStart)
          : undefined,
        bookPeriodEnd: data.bookPeriodEnd
          ? new Date(data.bookPeriodEnd)
          : undefined,
        allowSplitting: data.allowSplitting,
        contractFile: contractFile || undefined,
        contractFileName:
          contractFile instanceof File ? contractFile.name : undefined,
        invoiceFile: invoiceFile || undefined,
        invoiceFileName:
          invoiceFile instanceof File ? invoiceFile.name : undefined,
        bookType: data.bookType,
      });
      reset({
        name: "",
        description: "",
        allowSplitting: false,
        rooms: [],
        bookPeriodStart: "",
        bookPeriodEnd: "",
        contractFile: undefined,
        invoiceFile: undefined,
        bookType: "soft",
      });
      setContractFile(null);
      setInvoiceFile(null);
      setOpen(false);
      setRoomSearchQuery("");
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  const totalRooms = selectedRooms.length;

  // Calculate total prices
  const totalGroupPrice = selectedRooms.reduce(
    (sum, r) => sum + (Number(r.groupPrice) || 0),
    0
  );

  const totalIndividualPrice = allowSplitting
    ? selectedRooms.reduce(
        (sum, r) => sum + (Number(r.individualPrice || r.groupPrice) || 0),
        0
      )
    : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Offer</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new hotel offer.
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
                  id="hotel-bookType-soft"
                  value="soft"
                  {...register("bookType")}
                  className="size-4 cursor-pointer"
                />
                <Label
                  htmlFor="hotel-bookType-soft"
                  className="text-sm font-normal cursor-pointer"
                >
                  Soft Book
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="hotel-bookType-hard"
                  value="hard"
                  {...register("bookType")}
                  className="size-4 cursor-pointer"
                />
                <Label
                  htmlFor="hotel-bookType-hard"
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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allowSplitting"
              checked={allowSplitting}
              onChange={(e) => setValue("allowSplitting", e.target.checked)}
              className="size-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
            />
            <Label
              htmlFor="allowSplitting"
              className="text-sm font-normal cursor-pointer"
            >
              Allow splitting (agencies can book individual rooms)
            </Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Rooms & Pricing</Label>
              {totalRooms > 0 && (
                <span className="text-sm text-muted-foreground">
                  {totalRooms} room{totalRooms !== 1 ? "s" : ""} selected
                </span>
              )}
            </div>
            {loadingRooms ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading rooms...
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No rooms available
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Search rooms by number, type, or floor..."
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  className="w-full"
                />
                <div className="space-y-2 p-3 border rounded-lg max-h-64 overflow-y-auto">
                  {filteredRooms.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No rooms found matching your search
                    </div>
                  ) : (
                    filteredRooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex flex-col gap-2 p-2 border rounded hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`room-${room.id}`}
                            checked={isRoomSelected(room.id)}
                            onChange={(e) =>
                              handleRoomToggle(room.id, e.target.checked)
                            }
                            className="size-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                          />
                          <Label
                            htmlFor={`room-${room.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            <div className="font-medium">
                              Room {room.roomNumber} - {room.roomType}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Floor {room.floor} • Capacity: {room.capacity}
                            </div>
                          </Label>
                        </div>
                        {isRoomSelected(room.id) && (
                          <div className="ml-7 grid grid-cols-2 gap-2">
                            <div>
                              <Label
                                htmlFor={`group-price-${room.id}`}
                                className="text-xs text-muted-foreground"
                              >
                                Group Price
                              </Label>
                              <div className="flex items-center gap-1">
                                <Input
                                  id={`group-price-${room.id}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={getRoomGroupPrice(room.id)}
                                  onChange={(e) =>
                                    handleGroupPriceChange(
                                      room.id,
                                      e.target.value
                                    )
                                  }
                                  className="w-full"
                                />
                                <span className="text-sm text-muted-foreground">
                                  $
                                </span>
                              </div>
                            </div>
                            {allowSplitting && (
                              <div>
                                <Label
                                  htmlFor={`individual-price-${room.id}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  Individual Price
                                </Label>
                                <div className="flex items-center gap-1">
                                  <Input
                                    id={`individual-price-${room.id}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={getRoomIndividualPrice(room.id)}
                                    onChange={(e) =>
                                      handleIndividualPriceChange(
                                        room.id,
                                        e.target.value
                                      )
                                    }
                                    className="w-full"
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    $
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {totalRooms > 0 && (
                  <div className="p-3 border rounded-lg bg-muted/30 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Total Group Price:</span>
                      <span className="font-semibold">
                        ${totalGroupPrice.toFixed(2)}
                      </span>
                    </div>
                    {allowSplitting && (
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">
                          Total Individual Price:
                        </span>
                        <span className="font-semibold">
                          ${totalIndividualPrice.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {errors.rooms && (
              <p className="text-sm text-destructive">{errors.rooms.message}</p>
            )}
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contractFile">Upload Contract (PDF)</Label>
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

            <div className="space-y-2">
              <Label htmlFor="invoiceFile">Upload Invoice (PDF)</Label>
              <Input
                id="invoiceFile"
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
                    setInvoiceFile(file);
                    setValue("invoiceFile", file);
                  } else {
                    setInvoiceFile(null);
                    setValue("invoiceFile", undefined);
                  }
                }}
                className="cursor-pointer"
              />
              {invoiceFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {invoiceFile.name} (
                  {(invoiceFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset({
                  name: "",
                  description: "",
                  allowSplitting: false,
                  rooms: [],
                  bookPeriodStart: "",
                  bookPeriodEnd: "",
                  contractFile: undefined,
                  invoiceFile: undefined,
                });
                setContractFile(null);
                setInvoiceFile(null);
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
