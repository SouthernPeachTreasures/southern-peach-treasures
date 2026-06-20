// /api/inventory
//
// This function runs on Cloudflare Pages and fetches your current
// item catalog from Square, then returns it in a simple format
// the website can display.
//
// SETUP REQUIRED (one-time):
// 1. In your Cloudflare Pages project, go to:
//    Settings -> Environment Variables
// 2. Add two variables:
//      SQUARE_ACCESS_TOKEN   = (from your Square Developer dashboard)
//      SQUARE_LOCATION_ID    = (your Square location ID)
// 3. Save and re-deploy. That's it - no code changes needed.
//
// HOW IT WORKS:
// - Pulls all items from your Square "Item Library"
// - For each item, grabs the name, description, price, and image
// - If the item has a Checkout Link set up in Square, that link
//   is used for the "Buy with Square" button
// - Items with no price or no checkout link still show, with a
//   "Coming Soon" label instead of a buy button
//
// CACHING:
// - Results are cached for 60 seconds to keep the site fast and
//   avoid hitting Square's API too often. New items added in Square
//   will appear on the site within about a minute.

export async function onRequestGet(context) {
  const { env } = context;

  const ACCESS_TOKEN = env.SQUARE_ACCESS_TOKEN;
  const LOCATION_ID = env.SQUARE_LOCATION_ID;

  // If credentials aren't set up yet, return an empty list rather than erroring
  if (!ACCESS_TOKEN || !LOCATION_ID) {
    return jsonResponse({
      items: [],
      note: "Square credentials not configured yet."
    });
  }

  const SQUARE_API_BASE = "https://connect.squareup.com/v2";

  try {
    // 1. Fetch all catalog objects (items + images) from Square
    const catalogRes = await fetch(`${SQUARE_API_BASE}/catalog/list?types=ITEM,IMAGE`, {
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Square-Version": "2024-10-17",
        "Content-Type": "application/json"
      }
    });

    if (!catalogRes.ok) {
      const errText = await catalogRes.text();
      console.error("Square catalog error:", errText);
      return jsonResponse({ items: [], error: "Could not load catalog" }, 200);
    }

    const catalogData = await catalogRes.json();
    const objects = catalogData.objects || [];

    // Build a lookup of IMAGE objects by their ID, so we can attach
    // the right photo URL to each item
    const imageMap = {};
    for (const obj of objects) {
      if (obj.type === "IMAGE" && obj.image_data && obj.image_data.url) {
        imageMap[obj.id] = obj.image_data.url;
      }
    }

    // 2. Build the simplified item list
    const items = [];

    for (const obj of objects) {
      if (obj.type !== "ITEM") continue;
      const itemData = obj.item_data;
      if (!itemData) continue;

      const name = itemData.name || "Untitled Item";
      const description = itemData.description || itemData.description_plaintext || "";

      // Image
      let imageUrl = null;
      if (itemData.image_ids && itemData.image_ids.length > 0) {
        imageUrl = imageMap[itemData.image_ids[0]] || null;
      }

      // Price - take the first variation's price
      let price = null;
      let checkoutUrl = null;

      if (itemData.variations && itemData.variations.length > 0) {
        const variation = itemData.variations[0];
        const priceMoney = variation.item_variation_data &&
                            variation.item_variation_data.price_money;

        if (priceMoney && priceMoney.amount != null) {
          price = (priceMoney.amount / 100).toFixed(2);
        }

        // 3. Try to find/create a checkout link for this variation
        const checkoutResult = await getCheckoutLink({
          ACCESS_TOKEN,
          LOCATION_ID,
          variationId: variation.id,
          itemName: name
        });
        checkoutUrl = checkoutResult.url;
        var debugError = checkoutResult.error;
      }

      items.push({
        id: obj.id,
        name,
        description,
        price,
        imageUrl,
        checkoutUrl,
        debugError
      });
    }

    return jsonResponse({ items }, 200, 60);

  } catch (err) {
    console.error("Inventory function error:", err);
    return jsonResponse({ items: [], error: "Unexpected error loading inventory" }, 200);
  }
}

// Creates (or reuses) a Square Checkout Link for a given item variation.
// Square's Payment Links API will create a hosted checkout page for
// a single item - this is what powers the "Buy with Square" button.
async function getCheckoutLink({ ACCESS_TOKEN, LOCATION_ID, variationId, itemName }) {
  const SQUARE_API_BASE = "https://connect.squareup.com/v2";

  try {
    const res = await fetch(`${SQUARE_API_BASE}/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Square-Version": "2024-10-17",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        idempotency_key: `link-${variationId}`,
        checkout_options: {
          redirect_url: "https://southernpeachtreasures.com/inventory.html"
        },
        order: {
          location_id: LOCATION_ID,
          line_items: [
            {
              quantity: "1",
              catalog_object_id: variationId
            }
          ]
        }
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`Square payment link error for "${itemName}" (${res.status}):`, errBody);
      return { url: null, error: `${res.status}: ${errBody.slice(0, 300)}` };
    }

    const data = await res.json();
    return { url: (data.payment_link && data.payment_link.url) || null, error: null };

  } catch (err) {
    console.error("Checkout link error:", err);
    return { url: null, error: String(err) };
  }
}

function jsonResponse(data, status = 200, cacheSeconds = 0) {
  const headers = {
    "Content-Type": "application/json"
  };
  if (cacheSeconds > 0) {
    headers["Cache-Control"] = `public, max-age=${cacheSeconds}`;
  }
  return new Response(JSON.stringify(data), { status, headers });
}
