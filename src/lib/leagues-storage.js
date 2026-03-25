import fs from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "src/data/leagues-db.json");

export async function readLeagues() {
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
}

export async function writeLeagues(leagues) {
  await fs.writeFile(filePath, JSON.stringify(leagues, null, 2), "utf-8");
}
