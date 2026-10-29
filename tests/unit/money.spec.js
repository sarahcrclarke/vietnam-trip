import { test, expect } from "@playwright/test";
import { formatMoney, formatMoneyInput } from "../../src/lib/money";
import { formatMoney as costFormatMoney, destinationBreakdown } from "../../src/lib/cost";
import { formatMoney as accFormatMoney, pricePerPerson, derivePricePerNight, deriveTotalPrice } from "../../src/lib/accommodation";

test("formatMoney always shows 2 decimal places", () => {
  expect(formatMoney(8.5)).toBe("8.50");
  expect(formatMoney(10)).toBe("10.00");
  expect(formatMoney(0)).toBe("0.00"); // a valid 0 is not blank
  expect(formatMoney(8.55)).toBe("8.55");
  expect(formatMoney("12.3")).toBe("12.30");
  expect(formatMoney(1.005)).toBe("1.01");
  expect(formatMoney(1234.5)).toBe("1234.50");
});

test("the cost and accommodation helpers share the one formatter", () => {
  expect(costFormatMoney).toBe(formatMoney);
  expect(accFormatMoney).toBe(formatMoney);
  expect(pricePerPerson(100, 4)).toBe("25.00");
  expect(derivePricePerNight(300, 3)).toBe("100.00");
  expect(deriveTotalPrice("8.5", 2)).toBe("17.00");
  expect(pricePerPerson(0, 4)).toBeNull(); // missing-price behaviour unchanged
  expect(derivePricePerNight("", 3)).toBeNull();
});

test("amount inputs: valid numbers get 2dp, blank and half-typed text are left alone", () => {
  expect(formatMoneyInput("8.5")).toBe("8.50");
  expect(formatMoneyInput("0")).toBe("0.00");
  expect(formatMoneyInput("")).toBe("");
  expect(formatMoneyInput(null)).toBe("");
  expect(formatMoneyInput(".")).toBe(".");
});

test("cost calculations are unchanged (numbers, not strings)", () => {
  const stop = {
    selectedAccommodationId: "a",
    accommodations: [{ id: "a", totalPrice: 100.5 }],
    activities: [{ readyToBook: true, cost: "8.5" }, { readyToBook: false, cost: "99" }],
  };
  expect(destinationBreakdown(stop)).toEqual({ accommodation: 100.5, activities: 8.5, total: 109, priceNeeded: false });
});
