import React, { useState } from "react";
import { sanitizeAmount, formatCurrencyInput, formatCurrencyFinal } from "../../utils/currency";

// Money field: shows 200,000 while typing and 200,000.00 once you leave the
// field. onChange still receives the plain number as a string ("200000").
const CurrencyInput = ({ value, onChange, onBlur, onFocus, name, className = "", ...props }) => {
  const [editing, setEditing] = useState(false);

  const handleChange = (event) => {
    const raw = sanitizeAmount(event.target.value);
    if (typeof onChange === "function") {
      onChange({
        ...event,
        target: { ...event.target, name, value: raw, type: "text" },
      });
    }
  };

  return (
    <input
      {...props}
      name={name}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={editing ? formatCurrencyInput(value) : formatCurrencyFinal(value)}
      onFocus={(event) => { setEditing(true); onFocus?.(event); }}
      onBlur={(event) => { setEditing(false); onBlur?.(event); }}
      onChange={handleChange}
      className={`tabular-nums ${className}`}
    />
  );
};

export default CurrencyInput;
