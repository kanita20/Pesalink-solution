import { Router } from 'express';
import multer from 'multer';
import { parseCSV } from '../utils/csvParser';
import { validateAccount } from '../services/validationWorker';

const router = Router();
const upload = multer({ dest: 'uploads/' });

let results: any[] = [];

router.post('/', upload.single('file'), async (req, res) => {
  const rows = await parseCSV(req.file!.path);
  results = [];

  for (const row of rows) {
    const result = await validateAccount(row[0], row[1]);
    results.push({ ...row, ...result });
  }

  res.json({ message: `${rows.length} accounts validated.` });
});

export default router;