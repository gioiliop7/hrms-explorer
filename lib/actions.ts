// src/lib/actions.ts
"use server";

import path from "path";
import { promises as fs } from "fs";
import { getDiavgeiaData } from "./diavgeia";
import { getOpenGovConsultations } from "./opengov";

const FILES = ["1.json", "2.json"];

let cachedData: any[] | null = null;

async function getCachedData() {
  if (cachedData) return cachedData;

  const dataDirectory = path.join(process.cwd());
  let allItems: any[] = [];

  for (const fileName of FILES) {
    try {
      const filePath = path.join(dataDirectory, fileName);
      const fileContents = await fs.readFile(filePath, "utf8");
      const json = JSON.parse(fileContents);
      if (json.data && Array.isArray(json.data)) {
        allItems = [...allItems, ...json.data];
      }
    } catch (error) {
      console.error(`Error reading ${fileName}:`, error);
    }
  }

  cachedData = allItems;
  return allItems;
}

export async function getDescriptionById(id: number | string) {
  const data = await getCachedData();
  const searchId = Number(id);
  const foundItem = data.find((item: any) => item.id === searchId);
  return foundItem ? foundItem.description : null;
}

export async function fetchDiavgeiaAction(name: string) {
  try {
    const data = await getDiavgeiaData(name);
    return data;
  } catch (error) {
    console.error("Failed to fetch Diavgeia data via Server Action", error);
    return null;
  }
}

export async function fetchOpenGovAction(name: string) {
  try {
    const data = await getOpenGovConsultations(name);
    return data;
  } catch (error) {
    console.error("Failed to fetch OpenGov data via Server Action", error);
    return null;
  }
}