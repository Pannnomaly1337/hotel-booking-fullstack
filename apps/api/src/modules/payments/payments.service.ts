import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { PrismaService } from "../../prisma/prisma.service";
import { assertCanAccess } from "../../common/auth/ownership.util";
import { AuthUser } from "../../common/decorators/current-user.decorator";

const STAFF_ROLES = ["frontdesk", "manager", "admin"] as const;

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.stripe = new Stripe(config.get<string>("STRIPE_SECRET_KEY") ?? "");
    this.webhookSecret = config.get<string>("STRIPE_WEBHOOK_SECRET") ?? "";
  }

  /** สร้าง PaymentIntent สำหรับ booking → คืน clientSecret ให้ frontend เอาไปจ่าย */
  async createIntent(bookingId: string, user: AuthUser) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    assertCanAccess(booking.bookerId, user, [...STAFF_ROLES]); // เจ้าของ/staff เท่านั้น

    if (booking.status !== "pending") {
      throw new ConflictException("Booking is not awaiting payment");
    }
    if (booking.expiresAt && booking.expiresAt < new Date()) {
      throw new ConflictException("Booking hold has expired");
    }

    // บาท → สตางค์ (Stripe รับหน่วยย่อยสุดเป็นจำนวนเต็ม): 2808.00 → 280800
    const amount = booking.totalAmount.mul(100).toNumber();

    const intent = await this.stripe.paymentIntents.create({
      amount,
      currency: booking.currency.toLowerCase(), // "thb"
      metadata: {
        bookingId: booking.id, // ← webhook ใช้ตัวนี้บอกว่า payment ของ booking ไหน
        confirmationNumber: booking.confirmationNumber,
      },
      // enabled: ให้ Stripe จัดการวิธีจ่าย · allow_redirects: "never" = ไม่เอาวิธีที่ต้อง redirect
      // → เหลือ card เป็นหลัก + confirm ผ่าน CLI ได้โดยไม่ต้องมี return_url
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });

    // 1 booking = 1 Payment (bookingId unique) → upsert เผื่อกดจ่ายซ้ำ
    await this.prisma.payment.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        method: "card",
        status: "pending",
        amount: booking.totalAmount,
        currency: booking.currency,
        provider: "stripe",
        providerIntentId: intent.id,
      },
      update: { providerIntentId: intent.id, status: "pending" },
    });

    return {
      paymentIntentId: intent.id, // ไม่ลับ (client_secret ต่างหากที่ลับ) — ไว้เทสผ่าน CLI
      clientSecret: intent.client_secret,
      amount,
      currency: booking.currency,
    };
  }

  /** รับ webhook จาก Stripe (แหล่งความจริง) → verify signature แล้วจัดการตาม event */
  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
      // signature ไม่ผ่าน = อาจเป็น webhook ปลอม → ปฏิเสธ
      this.logger.warn(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );
      throw new BadRequestException("Invalid webhook signature");
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        await this.markPaid(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await this.markFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        break; // event อื่นๆ ไม่สน
    }
    return { received: true };
  }

  private async markPaid(intent: Stripe.PaymentIntent) {
    const bookingId = intent.metadata?.bookingId;
    if (!bookingId) return;

    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });
    if (!payment) return;
    if (payment.status === "paid") return; // 🔁 idempotent — เคยยืนยันแล้ว (Stripe ส่งซ้ำได้) ข้าม

    // guard: ยืนยันเฉพาะ booking ที่ยัง "รอจ่าย" — กันเคสจ่ายช้าหลัง booking ถูกยกเลิก
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.status !== "pending") {
      this.logger.warn(
        `Skip confirm — booking ${bookingId} not pending (status: ${booking?.status ?? "missing"})`,
      );
      return;
    }

    // อัปเดต payment + booking พร้อมกันใน transaction (ทั้งคู่สำเร็จ หรือย้อนกลับทั้งคู่)
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { bookingId },
        data: {
          status: "paid",
          paidAt: new Date(),
          amountPaid: payment.amount,
          providerIntentId: intent.id,
        },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: "confirmed" },
      }),
    ]);
    this.logger.log(`Booking ${bookingId} confirmed (intent ${intent.id})`);
  }

  private async markFailed(intent: Stripe.PaymentIntent) {
    const bookingId = intent.metadata?.bookingId;
    if (!bookingId) return;
    await this.prisma.payment.updateMany({
      where: { bookingId, status: { not: "paid" } },
      data: { status: "failed" },
    });
  }

  /**
   * จัดการเงินตอนยกเลิก booking (เรียกจาก BookingsService.cancel)
   * - paid    → refund เต็มผ่าน Stripe → Payment=refunded
   * - pending → ยกเลิก PaymentIntent ที่ค้าง → Payment=failed
   */
  async handleCancellationPayment(
    bookingId: string,
  ): Promise<"refunded" | "cancelled" | "none"> {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });
    if (!payment || !payment.providerIntentId) return "none";

    if (payment.status === "paid") {
      await this.stripe.refunds.create({
        payment_intent: payment.providerIntentId,
      });
      await this.prisma.payment.update({
        where: { bookingId },
        data: { status: "refunded" },
      });
      return "refunded";
    }

    if (payment.status === "pending") {
      try {
        await this.stripe.paymentIntents.cancel(payment.providerIntentId);
      } catch {
        // intent อาจ succeeded/ถูกยกเลิกไปแล้ว — ไม่เป็นไร
      }
      await this.prisma.payment.update({
        where: { bookingId },
        data: { status: "failed" },
      });
      return "cancelled";
    }

    return "none";
  }
}
