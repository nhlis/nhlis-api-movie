import * as nodemailer from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
    private readonly user: string;
    private readonly password: string;
    private readonly mailsend: string;
    private readonly logger = new Logger(MailerService.name);

    constructor(private readonly configService: ConfigService) {
        this.user = this.configService.get<string>('MAIL_SEND');
        this.password = this.configService.get<string>('MAIL_PASSWORD');
        this.mailsend = this.configService.get<string>('MAIL_SEND');
    }

    async Gmail(emailUser: string, subject: string, htmlMailForm: string): Promise<void> {
        const mailTransporter = nodemailer.createTransport({
            service: 'gmail', // Using Gmail as the email service
            auth: {
                user: this.user, // Email address for authentication
                pass: this.password, // Password for authentication
            },
        });

        const mailOptions = {
            from: this.mailsend, // Sender's email address
            to: emailUser, // Recipient's email address
            subject: subject, // Email subject
            html: htmlMailForm, // Email HTML content
        };

        try {
            const info = await mailTransporter.sendMail(mailOptions);
            this.logger.log('Email sent: ' + info.response);
        } catch (error) {
            this.logger.error('Send email with error:', error.stack);
        }
    }
}
