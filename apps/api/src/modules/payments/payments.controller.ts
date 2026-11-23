import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { Public } from "../../common/decorators/public.decorator";
import {
  CurrentUser,
  AuthUser,
} from "../../common/decorators/current-user.decorator";
import { PaymentsService } from "./payments.service";
import { CreateIntentDto } from "./dto/create-intent.dto";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post("create-intent")
  async createIntent(
    @Body() dto: CreateIntentDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.payments.createIntent(dto.bookingId, user);
    return { success: true, data };
  }

  @Public()
  @HttpCode(200)
  @Post("webhook")
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
  ) {
    return this.payments.handleWebhook(req.rawBody as Buffer, signature);
  }
}
