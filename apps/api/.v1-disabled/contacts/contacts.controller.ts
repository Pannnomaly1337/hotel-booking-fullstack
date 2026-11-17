import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ContactsService } from "./contacts.service";
import { CreateContactDto } from "./dto/create-contact.dto";

@Controller("contacts")
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  // Anyone can submit the contact form.
  @Public()
  @Post()
  async create(@Body() dto: CreateContactDto) {
    const data = await this.contacts.create(dto);
    return { success: true, data };
  }

  // Admin only — the original exposed every message to the public.
  @Roles("admin")
  @Get()
  async findAll() {
    const data = await this.contacts.findAll();
    return { success: true, data };
  }

  @Roles("admin")
  @Get(":id")
  async findOne(@Param("id") id: string) {
    const data = await this.contacts.findOne(id);
    return { success: true, data };
  }

  @Roles("admin")
  @Delete(":id")
  @HttpCode(200)
  async remove(@Param("id") id: string) {
    await this.contacts.remove(id);
    return { success: true, data: null };
  }
}
