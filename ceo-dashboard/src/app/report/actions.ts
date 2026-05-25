"use server";
import { composeReport } from "@/lib/report";

export async function generateReport(): Promise<string> {
  return composeReport();
}
