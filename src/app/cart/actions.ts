"use server";

import { revalidatePath } from "next/cache";
import {
  acknowledgePriceChanges,
  setLineQuantity,
  toggleSavedForLater,
} from "@/lib/cart";

export async function changeQuantity(lineId: string, quantity: number) {
  await setLineQuantity(lineId, Math.max(0, Math.min(20, quantity)));
  revalidatePath("/cart");
}

export async function acknowledgeChanges() {
  await acknowledgePriceChanges();
  revalidatePath("/cart");
}

export async function saveForLater(lineId: string) {
  await toggleSavedForLater(lineId);
  revalidatePath("/cart");
}
