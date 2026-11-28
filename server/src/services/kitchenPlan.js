import { store } from '../db/store.js';
import { pool } from '../db/postgres.js';

// =============================================================
// KITCHEN PLAN — which chef makes which order
//
// The admin picks a chef for each menu item (Admin → Kitchen Plan).
// For a food order:
//   • each item goes to its planned chef, if that chef is on duty today
//   • items with no (on-duty) planned chef go to the planned chef who
//     already has the most items in this order — so a planned order is
//     never left open to every chef because of one unplanned item
//   • if no planned chef is on duty, the order is open to every chef
//     on duty (as before)
// =============================================================

async function chefsOnDuty(ids) {
  if (ids.length === 0) return new Map();

  const result = await pool.query(
    `SELECT s.id::text AS id, s.login_id, s.full_name
       FROM staff_accounts s
       JOIN staff_shifts sh
         ON sh.staff_id = s.id
        AND sh.work_date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
      WHERE s.role = 'CHEF' AND s.is_active = TRUE AND s.id::text = ANY($1::text[])`,
    [ids]
  );

  return new Map(result.rows.map((row) => [row.id, row]));
}

// items → { items (with chefId/chefName), chefs: [{ id, name, loginId }] }
export async function planKitchen(items) {
  const plannedIds = [...new Set(
    items
      .map((item) => store.getProductById(item.productId)?.chefId)
      .filter(Boolean)
      .map(String)
  )];

  const clearChef = (item) => ({ ...item, chefId: null, chefName: null, chefLoginId: null });

  if (plannedIds.length === 0) {
    return { items: items.map(clearChef), chefs: [] };
  }

  const onDuty = await chefsOnDuty(plannedIds);

  const withChef = (item, chef) => ({
    ...item,
    chefId: chef.id,
    chefName: chef.full_name,
    chefLoginId: chef.login_id
  });

  // 1. Planned chef (if on duty)
  let planned = items.map((item) => {
    const chef = onDuty.get(String(store.getProductById(item.productId)?.chefId || ''));
    return chef ? withChef(item, chef) : clearChef(item);
  });

  // 2. Leftover items → the busiest planned chef in this order
  const counts = new Map();
  for (const item of planned) {
    if (item.chefId) counts.set(item.chefId, (counts.get(item.chefId) || 0) + 1);
  }

  if (counts.size > 0) {
    const mainChefId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const mainChef = onDuty.get(mainChefId);
    planned = planned.map((item) => (item.chefId ? item : withChef(item, mainChef)));
  }

  const usedIds = [...new Set(planned.map((item) => item.chefId).filter(Boolean))];

  return {
    items: planned,
    chefs: usedIds.map((id) => ({
      id,
      name: onDuty.get(id).full_name,
      loginId: onDuty.get(id).login_id
    }))
  };
}

// Route new (not yet accepted) food orders again with the current plan
// and duty list. Called when the admin saves the kitchen plan or
// changes today's duty list, so a chef who comes on duty late still
// gets the orders planned for them. Orders the admin sent to one chef
// by hand are left alone. Returns how many orders changed.
export async function replanWaitingOrders() {
  const waiting = store
    .getOrders()
    .filter((order) =>
      order.orderType !== 'zuxu' &&
      order.status === 'placed' &&
      !order.assignedChefId
    );

  let changed = 0;

  for (const order of waiting) {
    const kitchen = await planKitchen(order.items || []);
    const before = JSON.stringify((order.kitchenChefIds || []).map(String).sort());
    const after = JSON.stringify(kitchen.chefs.map((chef) => chef.id).sort());
    const itemsBefore = JSON.stringify((order.items || []).map((item) => item.chefId || null));
    const itemsAfter = JSON.stringify(kitchen.items.map((item) => item.chefId || null));

    if (before === after && itemsBefore === itemsAfter) continue;

    store.updateOrderFields(order.id, {
      items: kitchen.items,
      kitchenChefIds: kitchen.chefs.map((chef) => chef.id),
      kitchenChefs: kitchen.chefs
    });
    changed += 1;
  }

  return changed;
}
