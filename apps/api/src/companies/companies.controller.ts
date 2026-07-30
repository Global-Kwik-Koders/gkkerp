import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';

@Controller('company')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  me(@CurrentUser() user: any) {
    return this.companiesService.findById(user.company_id);
  }

  @Patch()
  @Roles(Role.Admin)
  update(@CurrentUser() user: any, @Body() body: any) {
    return this.companiesService.update(user.company_id, body);
  }
}
