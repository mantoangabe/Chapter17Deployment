import { redirect } from "next/navigation";
import { getDbStatus, requireTables, select, withTransaction } from "@/lib/db";
import { getActingCustomerId } from "@/lib/session";

const LINE_ITEM_ROWS = 5;

function nowTimestamp() {
  return new Date().toISOString();
}

async function placeOrderAction(formData) {
  "use server";

  const customerId = await getActingCustomerId();
  if (!customerId) redirect("/select-customer");

  const required = await requireTables(["orders", "order_items", "products"]);
  if (!required.ok) {
    redirect(`/place-order?error=${encodeURIComponent(`Missing required tables: ${required.missing.join(", ")}`)}`);
  }

  const rawLineItems = [];
  for (let i = 0; i < LINE_ITEM_ROWS; i += 1) {
    const rawProduct = String(formData.get(`product_id_${i}`) || "").trim();
    const rawQty = String(formData.get(`quantity_${i}`) || "").trim();
    const productId = Number(rawProduct);
    const quantity = Number(rawQty);
    if (!rawProduct && !rawQty) continue;

    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0 || quantity > 999) {
      redirect("/place-order?error=Each+line+must+include+a+valid+product+and+quantity+(1-999)");
    }

    if (Number.isInteger(productId) && Number.isInteger(quantity) && quantity > 0) {
      rawLineItems.push({ productId, quantity });
    }
  }

  // Validation rule: at least one valid line item is required.
  if (rawLineItems.length === 0) {
    redirect("/place-order?error=At+least+one+line+item+is+required");
  }

  const products = await select(
    `
      SELECT product_id, product_name, price
      FROM products
      WHERE is_active = TRUE
      ORDER BY product_name
    `
  );
  const productMap = new Map(products.map((p) => [p.product_id, p]));

  const lineItems = [];
  for (const item of rawLineItems) {
    const product = productMap.get(item.productId);
    if (!product) {
      redirect("/place-order?error=One+or+more+selected+products+are+invalid");
    }
    lineItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: Number(product.price),
      lineTotal: Number(product.price) * item.quantity
    });
  }

  const totalValue = lineItems.reduce((acc, item) => acc + item.lineTotal, 0);
  await withTransaction(async (tx) => {
    const now = nowTimestamp();
    const orderInsert = await tx.selectOne(
      `
        INSERT INTO orders (
          customer_id, order_datetime, billing_zip, shipping_zip, shipping_state,
          payment_method, device_type, ip_country, promo_used, promo_code,
          order_subtotal, shipping_fee, tax_amount, order_total, risk_score, is_fraud
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING order_id
      `,
      [
        customerId,
        now,
        "84058",
        "84058",
        "UT",
        "card",
        "desktop",
        "US",
        false,
        null,
        totalValue,
        0,
        0,
        totalValue,
        5,
        false
      ]
    );

    const orderId = Number(orderInsert?.order_id);
    for (const item of lineItems) {
      await tx.execute(
        `
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
          VALUES (?, ?, ?, ?, ?)
        `,
        [orderId, item.productId, item.quantity, item.unitPrice, item.lineTotal]
      );
    }
  });
  redirect("/orders?placed=1");
}

export default async function PlaceOrderPage({ searchParams }) {
  const customerId = await getActingCustomerId();
  if (!customerId) redirect("/select-customer");
  const errorMessage = searchParams?.error ? String(searchParams.error) : "";
  const dbStatus = getDbStatus();
  if (!dbStatus.ok) {
    return (
      <section className="card">
        <h2>Place Order</h2>
        <p>Database unavailable at <code>{dbStatus.path}</code>.</p>
        <p>{dbStatus.error || "Unknown database error."}</p>
      </section>
    );
  }
  const required = await requireTables(["products", "orders", "order_items"]);
  if (!required.ok) {
    return (
      <section className="card">
        <h2>Place Order</h2>
        <p>Missing required tables: {required.missing.join(", ")}.</p>
      </section>
    );
  }

  const products = await select(
    `SELECT product_id, product_name, price FROM products WHERE is_active = TRUE ORDER BY product_name`
  );

  return (
    <section className="card">
      <h2>Place Order</h2>
      <p>Create an order with one or more line items.</p>
      {errorMessage ? <p style={{ color: "#b91c1c" }}>{errorMessage}</p> : null}
      {products.length === 0 ? <p>No active products found. Add products before placing orders.</p> : null}

      <form action={placeOrderAction}>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: LINE_ITEM_ROWS }).map((_, idx) => (
              <tr key={idx}>
                <td>
                  <select name={`product_id_${idx}`} defaultValue="">
                    <option value="">-- choose --</option>
                    {products.map((p) => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.product_name} - ${Number(p.price).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input name={`quantity_${idx}`} type="number" min="1" max="999" placeholder="0" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="submit" disabled={products.length === 0}>
          Submit Order
        </button>
      </form>
    </section>
  );
}
