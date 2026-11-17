import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateContactDto } from "./dto/create-contact.dto";

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateContactDto) {
    return this.prisma.contact.create({
      data: { ...dto, email: dto.email.trim().toLowerCase() },
    });
  }

  findAll() {
    return this.prisma.contact.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException("Contact not found");
    return contact;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.contact.delete({ where: { id } });
  }
}
