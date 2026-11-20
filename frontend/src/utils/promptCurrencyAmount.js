import Swal from "sweetalert2";
import { formatCurrencyInput, formatCurrencyFinal, parseCurrencyInput } from "./currency";

export const promptCurrencyAmount = async ({ title, label, placeholder, confirmButtonText = "Continue", initialValue = "" }) => {
  const result = await Swal.fire({
    title,
    input: "text",
    inputLabel: label,
    inputValue: formatCurrencyFinal(initialValue),
    inputPlaceholder: placeholder ? formatCurrencyFinal(placeholder) : "e.g. 150,000.00",
    inputAttributes: { inputmode: "decimal", autocomplete: "off" },
    showCancelButton: true,
    confirmButtonText,
    confirmButtonColor: "#2E3192",
    didOpen: () => {
      const input = Swal.getInput();
      if (!input) return;
      input.addEventListener("input", () => {
        input.value = formatCurrencyInput(input.value);
        input.setSelectionRange(input.value.length, input.value.length);
      });
      input.addEventListener("blur", () => {
        input.value = formatCurrencyFinal(input.value);
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
