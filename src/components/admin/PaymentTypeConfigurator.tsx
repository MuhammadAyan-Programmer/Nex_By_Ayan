import React from 'react';
import { PaymentType, PaymentAmountType } from '../../types';
import { Clock, Box, CheckSquare, DollarSign } from 'lucide-react';
import { getPaymentUnitLabel } from '../../utils/paymentUtils';

interface PaymentTypeConfiguratorProps {
  paymentType: PaymentType;
  onChangePaymentType: (type: PaymentType) => void;
  rateType: PaymentAmountType;
  onChangeRateType: (type: PaymentAmountType) => void;
  fixedAmount: string;
  onChangeFixedAmount: (val: string) => void;
  minAmount: string;
  onChangeMinAmount: (val: string) => void;
  maxAmount: string;
  onChangeMaxAmount: (val: string) => void;
}

export const PaymentTypeConfigurator: React.FC<PaymentTypeConfiguratorProps> = ({
  paymentType,
  onChangePaymentType,
  rateType,
  onChangeRateType,
  fixedAmount,
  onChangeFixedAmount,
  minAmount,
  onChangeMinAmount,
  maxAmount,
  onChangeMaxAmount,
}) => {
  const unitLabel = getPaymentUnitLabel(paymentType, false);

  // Calculate live preview
  let previewText = '';
  if (rateType === 'fixed') {
    const amt = parseFloat(fixedAmount);
    previewText = !isNaN(amt) && amt > 0 ? `$${amt.toFixed(2)} ${unitLabel}` : `$0.00 ${unitLabel}`;
  } else {
    const min = parseFloat(minAmount);
    const max = parseFloat(maxAmount);
    const minStr = !isNaN(min) && min > 0 ? `$${min.toFixed(2)}` : '$0.00';
    const maxStr = !isNaN(max) && max > 0 ? `$${max.toFixed(2)}` : '$0.00';
    previewText = `${minStr} - ${maxStr} ${unitLabel}`;
  }

  const paymentOptions: { id: PaymentType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'Per Hour',
      label: 'Per Hour',
      icon: <Clock className="w-4 h-4" />,
      desc: 'Paid based on logged or tracked working hours',
    },
    {
      id: 'Per Item',
      label: 'Per Item',
      icon: <Box className="w-4 h-4" />,
      desc: 'Paid per labeled image, translated segment, or review unit',
    },
    {
      id: 'Per Task',
      label: 'Per Task',
      icon: <CheckSquare className="w-4 h-4" />,
      desc: 'Paid upon full completion & sign-off of an assigned task packet',
    },
  ];

  return (
    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          Project Payment & Compensation Model
        </h4>
        <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
          Step 1: Payment Type → Step 2: Rate Amount
        </span>
      </div>

      {/* 1. Payment Type Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Select Payment Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {paymentOptions.map((opt) => {
            const isSelected = paymentType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangePaymentType(opt.id)}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/80 text-purple-950 ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`p-1.5 rounded-md ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {opt.icon}
                  </span>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </span>
                </div>
                <div className="font-bold text-xs">{opt.label}</div>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Fixed USD Amount or Amount Range */}
      <div className="pt-2 border-t border-slate-200/80 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-semibold text-slate-700">
            Select Rate Structure <span className="text-red-500">*</span>
          </label>
          <div className="inline-flex rounded-lg p-0.5 bg-slate-200/80 border border-slate-200">
            <button
              type="button"
              onClick={() => onChangeRateType('fixed')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                rateType === 'fixed'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fixed USD Amount
            </button>
            <button
              type="button"
              onClick={() => onChangeRateType('range')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                rateType === 'range'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              USD Amount Range
            </button>
          </div>
        </div>

        {/* Inputs */}
        {rateType === 'fixed' ? (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Fixed USD Amount ({unitLabel})
            </label>
            <div className="relative rounded-lg shadow-2xs max-w-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-slate-500 font-bold text-xs">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={fixedAmount}
                onChange={(e) => onChangeFixedAmount(e.target.value)}
                placeholder="25.00"
                className="w-full rounded-lg border border-slate-300 py-2 pl-7 pr-16 text-xs text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-slate-400 text-xs font-medium">USD {unitLabel}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Minimum Amount ({unitLabel})
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-slate-500 font-bold text-xs">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={minAmount}
                  onChange={(e) => onChangeMinAmount(e.target.value)}
                  placeholder="20.00"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-7 pr-12 text-xs text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                  <span className="text-slate-400 text-[11px]">Min</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Maximum Amount ({unitLabel})
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-slate-500 font-bold text-xs">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={maxAmount}
                  onChange={(e) => onChangeMaxAmount(e.target.value)}
                  placeholder="35.00"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-7 pr-12 text-xs text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                  <span className="text-slate-400 text-[11px]">Max</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Formatted Preview */}
        <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-900">
            <span className="font-semibold text-emerald-800">User Panel Display Preview:</span>
            <span className="font-bold bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-800">
              {previewText}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
            Type: {paymentType}
          </span>
        </div>
      </div>
    </div>
  );
};
