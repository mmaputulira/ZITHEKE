import Swal from "sweetalert2";
import { digitsOnly, formatCurrencyInput, parseCurrencyInput } from "./currency";

export const promptCurrencyAmount = async ({ title, label, placeholder, confirmButtonText = "Continue", initialValue = "" }) => {
  const result = await Swal.fire({
    title,
    input: "text",
    inputLabel: label,
    inputValue: formatCurrencyInput(initialValue),
    inputPlaceholder: placeholder ? formatCurrencyInput(placeholder) : "e.g. 150,000",
    inputAttributes: { inputmode: "numeric", autocomplete: "off" },
    showCancelButton: true,
    confirmButtonText,
    confirmButtonColor: "#2E3192",
    didOpen: () => {
      const input = Swal.getInput();
      if (!input) return;
      input.addEventListener("input", () => {
        const digits = digitsOnly(input.value);
        input.value = formatCurrencyInput(digits);
        input.setSelectionRange(input.value.length, input.value.length);
      });
    },
    preConfirm: (value) => {
      const amount = parseCurrencyInput(value);
      if (!amount || amount <= 0) {
        Swal.showValidationMessage("Enter a valid amount");
        return false;
      }
      return amount;
    },
  });

  return result.isConfirmed ? Number(result.value) : null;
};
