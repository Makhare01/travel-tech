"use client";

import type { HotelRoom } from "@/app/api/rooms/route";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Download01Icon,
  HomeIcon,
  PlusSignIcon,
  Tick02Icon,
  Upload01Icon,
  UserIcon,
  WrenchIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const statusConfig: Record<
  HotelRoom["status"],
  { label: string; icon: any; className: string }
> = {
  available: {
    label: "Available",
    icon: Tick02Icon,
    className:
      "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20",
  },
  occupied: {
    label: "Occupied",
    icon: UserIcon,
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20",
  },
  reserved: {
    label: "Reserved",
    icon: HomeIcon,
    className:
      "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20",
  },
  maintenance: {
    label: "Maintenance",
    icon: WrenchIcon,
    className: "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20",
  },
};

function StatusBadge({ status }: { status: HotelRoom["status"] }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1.5 border", config.className)}>
      <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-3" />
      {config.label}
    </Badge>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function convertToCSV(rooms: HotelRoom[]): string {
  const headers = [
    "Room ID",
    "Room Number",
    "Room Type",
    "Floor",
    "Capacity",
    "Facilities",
    "Status",
    "Created At",
    "Updated At",
  ];

  const rows = rooms.map((room) => [
    room.id,
    room.roomNumber,
    room.roomType,
    room.floor.toString(),
    room.capacity.toString(),
    room.facilities.join("; "),
    room.status,
    room.createdAt,
    room.updatedAt,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}

function downloadCSV(rooms: HotelRoom[]) {
  const csvContent = convertToCSV(rooms);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `hotel-rooms-${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function parseCSV(csvText: string): HotelRoom[] {
  const lines = csvText.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  // Parse CSV properly handling quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.trim().replace(/^"|"$/g, "")
  );

  const rooms: HotelRoom[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length !== headers.length) continue;

    const room: Partial<HotelRoom> = {};
    headers.forEach((header, index) => {
      let value = values[index].replace(/^"|"$/g, "").replace(/""/g, '"');

      switch (header.toLowerCase()) {
        case "id":
          room.id = value;
          break;
        case "room-number":
        case "room number":
          room.roomNumber = value;
          break;
        case "room-type":
        case "room type":
          room.roomType = value;
          break;
        case "floor":
          room.floor = parseInt(value, 10) || 0;
          break;
        case "capacity":
          room.capacity = parseInt(value, 10) || 0;
          break;
        case "amenities":
        case "facilities":
          // Handle JSON string format from Supabase export
          try {
            if (value.startsWith("[") && value.endsWith("]")) {
              room.facilities = JSON.parse(value);
            } else if (value.includes(";")) {
              room.facilities = value
                .split(";")
                .map((a) => a.trim())
                .filter(Boolean);
            } else {
              room.facilities = value ? [value] : [];
            }
          } catch (e) {
            room.facilities = value
              ? value
                  .split(",")
                  .map((a) => a.trim())
                  .filter(Boolean)
              : [];
          }
          break;
        case "status":
          room.status = value as HotelRoom["status"];
          break;
        case "created_at":
        case "created at":
          room.createdAt = value || new Date().toISOString();
          break;
        case "updated_at":
        case "updated at":
          room.updatedAt = value || new Date().toISOString();
          break;
      }
    });

    if (room.roomNumber && room.roomType) {
      // Set defaults for required fields
      rooms.push({
        id:
          room.id ||
          `RM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        floor: room.floor || 1,
        capacity: room.capacity || 1,
        pricePerNight: 0,
        facilities: room.facilities || [],
        status: room.status || "available",
        createdAt: room.createdAt || new Date().toISOString(),
        updatedAt: room.updatedAt || new Date().toISOString(),
      } as HotelRoom);
    }
  }

  return rooms;
}

const FACILITIES_LIST = [
  "Dressing room",
  "Stovetop",
  "Shower",
  "Bathrobe",
  "Private bathroom",
  "Patio",
  "Outdoor dining area",
  "Hearing accessible",
  "Adapted bath",
  "Cots",
  "Socket near the bed",
  "Hot tub",
  "Sauna",
  "Linen",
  "Air conditioning",
  "Video games",
  "Safety deposit box",
  "Sea view",
  "Tumble dryer",
  "Reading light",
  "Fax",
  "Inner courtyard view",
  "Pants press",
  "Electric kettle",
  "Children's high chair",
] as const;

const createRoomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  roomType: z.string().min(1, "Room type is required"),
  floor: z
    .string()
    .min(1, "Floor is required")
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && Number.isInteger(num) && num >= 1;
      },
      { message: "Floor must be a positive integer" }
    ),
  capacity: z
    .string()
    .min(1, "Capacity is required")
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && Number.isInteger(num) && num >= 1;
      },
      { message: "Capacity must be a positive integer" }
    ),
  facilities: z.array(z.string()).optional(),
  status: z.enum(["available", "occupied", "maintenance", "reserved"]),
});

type CreateRoomFormData = z.infer<typeof createRoomSchema>;

function CreateRoomDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      roomNumber: "",
      roomType: "",
      floor: "1",
      capacity: "1",
      facilities: [],
      status: "available",
    },
  });

  const selectedStatus = watch("status") as CreateRoomFormData["status"];
  const selectedFacilities = watch("facilities") || [];

  const handleFacilityChange = (facility: string, checked: boolean) => {
    const currentFacilities = selectedFacilities;
    if (checked) {
      setValue("facilities", [...currentFacilities, facility]);
    } else {
      setValue(
        "facilities",
        currentFacilities.filter((a) => a !== facility)
      );
    }
  };

  const onSubmitForm = async (data: CreateRoomFormData) => {
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomNumber: data.roomNumber,
          roomType: data.roomType,
          floor: Number(data.floor),
          capacity: Number(data.capacity),
          facilities: data.facilities || [],
          status: data.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create room");
      }

      reset();
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Create Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new hotel room.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(
            onSubmitForm as (data: CreateRoomFormData) => Promise<void>
          )}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="roomNumber">
              Room Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="roomNumber"
              placeholder="e.g., 101"
              {...register("roomNumber")}
              aria-invalid={errors.roomNumber ? "true" : "false"}
            />
            {errors.roomNumber && (
              <p className="text-sm text-destructive">
                {errors.roomNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomType">
              Room Type <span className="text-destructive">*</span>
            </Label>
            <Input
              id="roomType"
              placeholder="e.g., Standard Single"
              {...register("roomType")}
              aria-invalid={errors.roomType ? "true" : "false"}
            />
            {errors.roomType && (
              <p className="text-sm text-destructive">
                {errors.roomType.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floor">
                Floor <span className="text-destructive">*</span>
              </Label>
              <Input
                id="floor"
                type="number"
                placeholder="1"
                {...register("floor")}
                aria-invalid={errors.floor ? "true" : "false"}
              />
              {errors.floor && (
                <p className="text-sm text-destructive">
                  {errors.floor.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">
                Capacity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="capacity"
                type="number"
                placeholder="1"
                {...register("capacity")}
                aria-invalid={errors.capacity ? "true" : "false"}
              />
              {errors.capacity && (
                <p className="text-sm text-destructive">
                  {errors.capacity.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) =>
                setValue("status", value as CreateRoomFormData["status"])
              }
            >
              <SelectTrigger
                id="status"
                aria-invalid={errors.status ? "true" : "false"}
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">
                {errors.status.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Facilities</Label>
            <div className="border border-input rounded-xl p-4 max-h-64 overflow-y-auto bg-input/30">
              <div className="grid grid-cols-1 gap-3">
                {FACILITIES_LIST.map((facility) => (
                  <label
                    key={facility}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFacilities.includes(facility)}
                      onChange={(e) =>
                        handleFacilityChange(facility, e.target.checked)
                      }
                      className="size-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                    />
                    <span className="text-sm text-foreground">{facility}</span>
                  </label>
                ))}
              </div>
            </div>
            {selectedFacilities.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedFacilities.length} facilit
                {selectedFacilities.length === 1 ? "y" : "ies"} selected
              </p>
            )}
          </div>

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
              {isSubmitting ? "Creating..." : "Create Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function HotelRoomsTable() {
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/rooms");
      if (!response.ok) {
        throw new Error("Failed to fetch rooms");
      }
      const data = await response.json();
      setRooms(data.rooms || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleExportCSV = () => {
    if (rooms.length === 0) {
      return;
    }
    downloadCSV(rooms);
  };

  const handleImportCSV = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const text = await file.text();
      const parsedRooms = parseCSV(text);

      if (parsedRooms.length === 0) {
        throw new Error("No valid room data found in CSV file");
      }

      // Send to API to import
      const response = await fetch("/api/rooms/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rooms: parsedRooms }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import rooms");
      }

      // Refresh the rooms list
      await fetchRooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import CSV");
      console.error("Error importing CSV:", err);
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading rooms...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Import/Export Buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Hotel Rooms</h2>
        <div className="flex items-center gap-3">
          <CreateRoomDialog onSuccess={fetchRooms} />
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
          <Button
            onClick={handleImportClick}
            disabled={importing}
            variant="outline"
          >
            <HugeiconsIcon
              icon={Upload01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            {importing ? "Importing..." : "Import CSV"}
          </Button>
          <Button onClick={handleExportCSV} disabled={rooms.length === 0}>
            <HugeiconsIcon
              icon={Download01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Export as CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Room ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Room Number
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Room Type
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Floor
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Facilities
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    No rooms found
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr
                    key={room.id}
                    className="border-b border-border transition-colors hover:bg-muted/50"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-foreground">
                      {room.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      {room.roomNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {room.roomType}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {room.floor}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {room.capacity}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex flex-wrap gap-1">
                        {room.facilities.map((facility, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {facility}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={room.status} />
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
}
