import { exec } from 'child_process';
import path from 'path';

const MONGO_URI = process.env.MONGO_URI;

const collections = ['overviews', 'seasons', 'episodes', 'profiles'];

collections.forEach((col) => {
    const filePath = path.resolve(__dirname, `${col}.json`);
    const cmd = `mongoimport --uri="${MONGO_URI}" --collection=${col} --file="${filePath}" --jsonArray --mode=upsert`;

    console.log(`📂 Đang import: ${filePath}`);

    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error importing ${col}: ${stderr || err.message}`);
            return;
        }
        console.log(`Imported ${col} successfully!`);
    });
});
