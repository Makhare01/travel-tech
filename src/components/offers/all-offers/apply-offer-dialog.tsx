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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const applyOfferSchema = z.object({
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(500, "Message must not exceed 500 characters"),
  contactEmail: z.string().email("Please enter a valid email address"),
});

type ApplyOfferFormData = z.infer<typeof applyOfferSchema>;

interface Organization {
  id: string;
  name: string;
  type: "hotel" | "agency";
  logo?: string;
}

interface Offer {
  id: string;
  name: string;
  description: string;
  deadline: Date;
  tags: string[];
  organization: Organization;
}

interface ApplyOfferDialogProps {
  offer: Offer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: ApplyOfferFormData) => void | Promise<void>;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ApplyOfferDialog({
  offer,
  open,
  onOpenChange,
  onSubmit,
}: ApplyOfferDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ApplyOfferFormData>({
    resolver: zodResolver(applyOfferSchema),
    defaultValues: {
      message: "",
      contactEmail: "",
    },
  });

  const onSubmitForm = async (data: ApplyOfferFormData) => {
    try {
      await onSubmit?.(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error applying to offer:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Apply to Offer</DialogTitle>
          <DialogDescription>
            Submit your application for this offer. The organization will review
            your application and get back to you.
          </DialogDescription>
        </DialogHeader>

        {/* Offer Summary */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Avatar size="sm">
              <AvatarImage
                src={offer.organization.logo}
                alt={offer.organization.name}
              />
              <AvatarFallback>
                {getInitials(offer.organization.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">{offer.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">
                {offer.organization.name} •{" "}
                <span className="capitalize">{offer.organization.type}</span>
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {offer.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <HugeiconsIcon
                icon={Clock01Icon}
                strokeWidth={2}
                className="size-3.5"
              />
              <span>Deadline: {formatDate(offer.deadline)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {offer.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contactEmail">
              Contact Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="your.email@example.com"
              {...register("contactEmail")}
              aria-invalid={errors.contactEmail ? "true" : "false"}
            />
            {errors.contactEmail && (
              <p className="text-sm text-destructive">
                {errors.contactEmail.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              Application Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Tell us why you're interested in this offer and any relevant details..."
              {...register("message")}
              rows={5}
              aria-invalid={errors.message ? "true" : "false"}
            />
            {errors.message && (
              <p className="text-sm text-destructive">
                {errors.message.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters, maximum 500 characters
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
