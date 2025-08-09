import multer from 'multer'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url';
import fs from 'fs'

// Replicate __dirname functionality in ES Modules since it's not available by default.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
    destination: (req,file,cb)=>{
        const dir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req,file,cb)=>{
        const uniqueSuffix = Date.now() + '--' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

export default storage;