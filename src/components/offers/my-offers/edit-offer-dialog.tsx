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

const editOfferSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(3, "Name must be at least 3 characters"),
  status: z.enum(["pending", "active", "canceled", "completed"], {
    required_error: "Status is required",
  }),
  description: z.string().optional(),
});

type EditOfferFormData = z.infer<typeof editOfferSchema>;

interface Offer {
  id: string;
  name: string;
  status: "pending" | "active" | "canceled" | "completed";
  createdDate: Date;
}

interface EditOfferDialogProps {
  offer: Offer;
  children: React.ReactNode;
  onSubmit?: (data: EditOfferFormData) => void | Promise<void>;
}

export function EditOfferDialog({
  offer,
  children,
  onSubmit,
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
      description: "",
    },
  });

  const selectedStatus = watch("status");

  // Reset form when offer changes or dialog opens
  useEffect(() => {
    if (open) {
      reset({
        name: offer.name,
        status: offer.status,
        description: "",
      });
    }
  }, [offer, open, reset]);

  const onSubmitForm = async (data: EditOfferFormData) => {
    try {
      await onSubmit?.(data);
      setOpen(false);
    } catch (error) {
      console.error("Error updating offer:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
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
