import React from "react";
import {digitsOnly,formatCurrencyInput} from "../../utils/currency.js";
const CurrencyInput=({value,onChange,name,className="",...props})=><input {...props} name={name} type="text" inputMode="numeric" autoComplete="off" value={formatCurrencyInput(value)} onChange={(e)=>{const raw=digitsOnly(e.target.value);onChange?.({...e,target:{...e.target,name,value:raw,type:"text"}})}} className={className}/>;
export default CurrencyInput;
