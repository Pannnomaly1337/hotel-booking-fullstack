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

  async createIntent(bookingId: string, user: AuthUser) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException("Booking not found");
    assertCanAccess(booking.bookerId, user, [...STAFF_ROLES]);

    if (booking.status !== "pending") {
      throw new ConflictException("Booking is not awaiting payment");
    }
    if (booking.expiresAt && booking.expiresAt < new Date()) {
      throw new ConflictException("Booking hold has expired");
    }

    const amount = booking.totalAmount.mul(100).toNumber();

    const intent = await this.stripe.paymentIntents.create({
      amount,
      currency: booking.currency.toLowerCase(),
      metadata: {
        bookingId: booking.id,
        confirmationNumber: booking.confirmationNumber,
      },
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });

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
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      amount,
      currency: booking.currency,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
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
        break;
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
    if (payment.status === "paid") return;

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
}