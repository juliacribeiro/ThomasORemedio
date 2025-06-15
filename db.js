import fs from 'fs';
import { DB_FILE } from './config.js';

export const readDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    return {};
  }
  const data = fs.readFileSync(DB_FILE);
  return JSON.parse(data);
};

export const saveDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};
