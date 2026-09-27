import { NextResponse } from "next/server";
import { z } from "zod";
import { addItemsToCart, getCartView } from "@/lib/cart";

const addSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        nightDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        quantity: z.number().int().min(1).max(20),
        tableId: z.string().uuid().optional(),
      })
    )
    .min(1)
    .max(20),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  try {
    await addItemsToCart(parsed.data.items);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Couldn't add to cart" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const view = await getCartView();
  return NextResponse.json({
    count: view.lines
      .filter((l) => !l.savedForLater)
      .reduce((n, l) => n + l.quantity, 0),
    subtotal: view.subtotal,
  });
}
