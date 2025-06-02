import { FileValidator } from '@nestjs/common';

type FileType = Express.Multer.File | Express.Multer.File[] | Record<string, Express.Multer.File[]>;
type Result = { errorFileName?: string; isValid: boolean };

const runFileValidation = async (args: { multiple: boolean; file: FileType; validator: (file: Express.Multer.File) => Promise<boolean> | boolean }): Promise<Result> => {
    if (args.multiple) {
        const fileFields = Object.keys(args.file);
        for (const field of fileFields) {
            const fieldFile = args.file[field];
            if (Array.isArray(fieldFile)) {
                for (const f of fieldFile) {
                    if (!(await args.validator(f))) {
                        return { errorFileName: f.originalname, isValid: false };
                    }
                }
            } else {
                if (!(await args.validator(fieldFile))) {
                    return { errorFileName: fieldFile.originalname, isValid: false };
                }
            }
        }
        return { isValid: true };
    }

    if (Array.isArray(args.file)) {
        for (const f of args.file) {
            if (!(await args.validator(f))) {
                return { errorFileName: f.originalname, isValid: false };
            }
        }
        return { isValid: true };
    }

    if (!(await args.validator(args.file as Express.Multer.File))) {
        return { errorFileName: (args.file as Express.Multer.File).originalname, isValid: false };
    }

    return { isValid: true };
};

class FileSizeValidator extends FileValidator {
    private maxSizeBytes: number;
    private multiple: boolean;
    private errorFileName: string;

    constructor(args: { maxSizeBytes: number; multiple: boolean }) {
        super({});
        this.maxSizeBytes = args.maxSizeBytes;
        this.multiple = args.multiple;
    }

    async isValid(file?: Express.Multer.File | Express.Multer.File[] | Record<string, Express.Multer.File[]>): Promise<boolean> {
        const result = await runFileValidation({
            file,
            multiple: this.multiple,
            validator: (f) => f.size < this.maxSizeBytes,
        });
        this.errorFileName = result.errorFileName;
        return result.isValid;
    }

    buildErrorMessage(file: any): string {
        return `File ${this.errorFileName || ''} exceeded the size limit of ` + parseFloat((this.maxSizeBytes / 1024 / 1024).toFixed(2)) + ' MB';
    }
}

class FileTypeValidator extends FileValidator {
    private multiple: boolean;
    private errorFileName: string;
    private filetype: RegExp | string;

    constructor(args: { multiple: boolean; filetype: RegExp | string }) {
        super({});
        this.multiple = args.multiple;
        this.filetype = args.filetype;
    }

    isMimeTypeValid(file: Express.Multer.File) {
        return typeof this.filetype === 'string' ? file.mimetype === this.filetype : this.filetype.test(file.mimetype);
    }

    async isValid(file?: Express.Multer.File | Express.Multer.File[] | Record<string, Express.Multer.File[]>): Promise<boolean> {
        const result = await runFileValidation({
            multiple: this.multiple,
            file: file,
            validator: (f) => this.isMimeTypeValid(f),
        });
        this.errorFileName = result.errorFileName;
        return result.isValid;
    }

    buildErrorMessage(file: any): string {
        return `File ${this.errorFileName || ''} must be of type ${this.filetype}`;
    }
}

export { FileSizeValidator, FileTypeValidator, runFileValidation };
