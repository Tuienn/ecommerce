import multer, { memoryStorage } from 'multer'

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, path.join(__dirname, '..','uploads'));
//     },
//     filename: (req, file, cb) => {
//         // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         const uniqueName = Date.now() + '-' + file.originalname;
//         cb(null, uniqueName);
//     }
// })

const storage = memoryStorage() // Store files in memory

const upload = multer({ storage: storage })

export default upload
