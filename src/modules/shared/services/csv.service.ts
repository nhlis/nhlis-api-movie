import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as csv from 'csvtojson';

@Injectable()
export class CSVService {
    private readonly logger = new Logger(CSVService.name);
    constructor() {}

    public async CSVToJSON(file: Express.Multer.File, key: string[]) {
        try {
            const csvBuffer = file.buffer.toString('utf8');
            if (!this.IsCSV(csvBuffer)) throw new BadRequestException({ message: 'Uploaded file is not a CSV.' });
            const fileJSON = await csv({
                delimiter: ';',
                noheader: false,
                headers: key,
            }).fromString(csvBuffer);
            return fileJSON;
        } catch (error) {
            this.logger.error(error);
        }
    }

    private IsCSV(content: any) {
        const lines = content.split('\n');
        const firstLine = lines[0].trim();
        return firstLine.includes(';');
    }
}
