import { Router } from 'express';

const router = Router();
let results: any[] = [];

router.get('/', (req, res) => {
  res.json(results);
});

export default router;