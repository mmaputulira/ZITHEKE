import React from "react";
import { digitsOnly, formatCurrencyInput } from "../../utils/currency";

const CurrencyInput = ({ value, onChange, name, className = "", ...props }) => {
  const handleChange = (event) => {
    const raw = digitsOnly(event.target.value);
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
      inputMode="numeric"
      autoComplete="off"
      value={formatCurrencyInput(value)}
      onChange={handleChange}
      className={className}
    />
  );
};

export default CurrencyInput;
