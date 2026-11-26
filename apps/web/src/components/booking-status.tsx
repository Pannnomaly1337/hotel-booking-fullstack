import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { BookingStatus } from "@repo/types";

const tone: Record<BookingStatus, BadgeProps["tone"]> = {
  pending: "brand",
  confirmed: "success",
  checked_in: "success",
  checked_out: "muted",
  cancelled: "danger",
  no_show: "danger",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={tone[status]}>{status}</Badge>;
}
