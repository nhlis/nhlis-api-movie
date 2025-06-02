import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IdService {
    private readonly epoch = 1700000000000n;
    private readonly machineId: bigint;
    private sequence = 0n;
    private lastTimestamp = 0n;

    constructor(private readonly configService: ConfigService) {
        const machineIdFromConfig = this.configService.get<string>('MACHINE_ID');
        this.machineId = machineIdFromConfig ? BigInt(machineIdFromConfig) : 2n;
    }

    handleGenerateId(): string {
        let now = BigInt(Date.now());

        if (now === this.lastTimestamp) {
            this.sequence = (this.sequence + 1n) & 4095n;
            if (this.sequence === 0n) {
                while (now <= this.lastTimestamp) {
                    now = BigInt(Date.now());
                }
            }
        } else {
            this.sequence = 0n;
        }

        this.lastTimestamp = now;

        return ((((now - this.epoch) ^ (this.machineId << 6n) ^ this.sequence) << 22n) | (this.machineId << 12n) | this.sequence).toString();
    }
}
