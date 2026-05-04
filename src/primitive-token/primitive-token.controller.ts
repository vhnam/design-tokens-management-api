import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth';

import { OrganizationId } from '../common/decorators/organization-id.decorator';
import { OrganizationGuard } from '../common/guards/organization.guard';

import type {
  CreatePrimitiveTokenDto,
  UpdatePrimitiveTokenDto,
} from './primitive-token.dto';
import { PrimitiveTokenService } from './primitive-token.service';

@Controller('primitive-tokens')
@UseGuards(AuthGuard, OrganizationGuard)
export class PrimitiveTokenController {
  constructor(private readonly primitiveTokenService: PrimitiveTokenService) {}

  @Post()
  create(
    @OrganizationId() organizationId: string,
    @Body() createPrimitiveTokenDto: CreatePrimitiveTokenDto,
  ) {
    return this.primitiveTokenService.create({
      ...createPrimitiveTokenDto,
      organizationId,
    });
  }

  @Get()
  findAll(@OrganizationId() organizationId: string) {
    return this.primitiveTokenService.findAll(organizationId);
  }

  @Get(':id')
  findOne(
    @OrganizationId() organizationId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.primitiveTokenService.findOne(id, organizationId);
  }

  @Patch(':id')
  update(
    @OrganizationId() organizationId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updatePrimitiveTokenDto: UpdatePrimitiveTokenDto,
  ) {
    return this.primitiveTokenService.update(
      id,
      organizationId,
      updatePrimitiveTokenDto,
    );
  }

  @Delete(':id')
  remove(
    @OrganizationId() organizationId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.primitiveTokenService.remove(id, organizationId);
  }
}
