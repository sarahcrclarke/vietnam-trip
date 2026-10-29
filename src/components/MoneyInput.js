"use client";

import { useState } from "react";
import { formatMoneyInput } from "@/lib/money";

// A text input for a monetary amount. While you are typing it shows exactly
// what you typed; once you leave it, a valid amount is displayed to 2 decimals
// (8.5 -> 8.50). Display only: `value` and `onChange` are untouched, so what
// is stored and saved never changes.
export default function MoneyInput({ value, onFocus, onBlur, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...rest}
      value={focused ? (value ?? "") : formatMoneyInput(value)}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
    />
  );
}
