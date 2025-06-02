import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';

import { NotificationService } from './notification.service';
import { PostNotificationDto } from './dtos/post-notification.dto';
import { QueryNotificationDto } from './dtos/query-notification.dto';
import { AuthGuard, EAccountRoles, IUser, Roles, RolesGuard, User } from '../../common';
import { NotificationDocument } from './notification.schema';

@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @UseGuards(AuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    public async createNotification(@User() user: IUser, @Body() body: PostNotificationDto): Promise<NotificationDocument> {
        const res = await this.notificationService.handlePostNotification(user.sub, body.type, body.type_id);
        return res;
    }

    @UseGuards(AuthGuard)
    @Delete('/:notification_id')
    @HttpCode(HttpStatus.NO_CONTENT)
    public async deleteNotification(@User() user: IUser, @Param('notification_id') notification_id: string): Promise<void> {
        return this.notificationService.handleDeleteNotification(notification_id, user.sub);
    }

    @UseGuards(AuthGuard)
    @Get('user')
    @HttpCode(HttpStatus.OK)
    public async getUserNotifications(@User() user: IUser, @Query() query: QueryNotificationDto): Promise<{ notifications: NotificationDocument[] }> {
        const notifications = await this.notificationService.handleGetNotificationsByProfile(user.sub, query.limit, query.last_id, query.release_date);
        return { notifications };
    }

    @UseGuards(AuthGuard)
    @Get('user/count')
    @HttpCode(HttpStatus.OK)
    public async getUserNotificationsCount(@User() user: IUser): Promise<{ totalRecords: number }> {
        const totalRecords = await this.notificationService.handleGetNotificationsCountByProfile(user.sub);
        return { totalRecords };
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(EAccountRoles.SUPER_ADMIN)
    @Get()
    @HttpCode(HttpStatus.OK)
    public async getAllNotifications(@Query() query: QueryNotificationDto): Promise<{ notifications: NotificationDocument[] }> {
        const notifications = await this.notificationService.handleGetNotifications(query.limit, query.last_id, query.release_date);
        return { notifications };
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(EAccountRoles.SUPER_ADMIN)
    @Get('count')
    @HttpCode(HttpStatus.OK)
    public async getAllNotificationsCount(): Promise<{ totalRecords: number }> {
        const totalRecords = await this.notificationService.handleGetNotificationsCount();
        return { totalRecords };
    }
}
