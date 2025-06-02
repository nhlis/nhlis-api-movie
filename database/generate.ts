import fs from 'fs';

const epoch = 1700000000000n;
const machineId = 2n;
let sequence = 0n;
let lastTimestamp = 0n;

function handleGenerateId(): string {
    let now = BigInt(Date.now());

    if (now === lastTimestamp) {
        sequence = (sequence + 1n) & 4095n;
        if (sequence === 0n) {
            while (now <= lastTimestamp) {
                now = BigInt(Date.now());
            }
        }
    } else {
        sequence = 0n;
    }

    lastTimestamp = now;

    return (((now - epoch) << 22n) | (machineId << 12n) | sequence).toString();
}

const filePath = 'database/test.json';
const fileData = fs.readFileSync(filePath, 'utf-8');
const data = JSON.parse(fileData);

const updatedComments = data.map((prev) => ({
    ...prev,
    _id: handleGenerateId(),
}));

const newFilePath = 'database/updated_test.json';
fs.writeFileSync(newFilePath, JSON.stringify(updatedComments, null, 4), 'utf-8');

console.log(`✅ Dữ liệu đã được cập nhật và lưu vào ${newFilePath}`);
