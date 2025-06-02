// shared/shared.module.ts
import { Global, Module } from '@nestjs/common';
import { CryptoService } from './services/crypto.service';
import { CSVService } from './services/csv.service';
import { GoogleDriveService } from './services/drive.service';
import { MailerService } from './services/mailer.service';
import { BaseRepository } from './repositories/base.repository';
import { IdService } from './services/id.service';

@Global()
@Module({
    providers: [CryptoService, CSVService, GoogleDriveService, MailerService, BaseRepository, IdService],
    exports: [CryptoService, CSVService, GoogleDriveService, MailerService, BaseRepository, IdService],
})
export class SharedModule {}
