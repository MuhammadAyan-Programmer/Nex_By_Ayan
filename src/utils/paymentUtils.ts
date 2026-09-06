import { PaymentType, PaymentAmountType, Project } from '../types';

export function formatRatePayString(
  paymentType: PaymentType = 'Per Hour',
  paymentRateType: PaymentAmountType = 'fixed',
  amount?: number | string,
  min?: number | string,
  max?: number | string,
  fallbackRate?: string
): string {
  const unit =
    paymentType === 'Per Hour'
      ? '/ hr'
      : paymentType === 'Per Item'
      ? '/ item'
      : '/ task';

  if (paymentRateType === 'range') {
    const numMin = typeof min === 'number' ? min : parseFloat(String(min || ''));
    const numMax = typeof max === 'number' ? max : parseFloat(String(max || ''));

    if (!isNaN(numMin) && !isNaN(numMax) && numMax > 0) {
      return `$${numMin % 1 === 0 ? numMin.toFixed(0) : numMin.toFixed(2)} - $${numMax % 1 === 0 ? numMax.toFixed(0) : numMax.toFixed(2)} ${unit}`;
    } else if (!isNaN(numMin) && numMin > 0) {
      return `From $${numMin % 1 === 0 ? numMin.toFixed(0) : numMin.toFixed(2)} ${unit}`;
    }
  } else {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || ''));
    if (!isNaN(numAmount) && numAmount > 0) {
      return `$${numAmount % 1 === 0 ? numAmount.toFixed(0) : numAmount.toFixed(2)} ${unit}`;
    }
  }

  if (fallbackRate && fallbackRate.trim()) {
    return fallbackRate;
  }

  return `$20.00 ${unit}`;
}

export function getProjectDisplayRate(project: Partial<Project>): string {
  if (
    project.paymentType &&
    ((project.paymentRateType === 'range' && (project.paymentAmountMin || project.paymentAmountMax)) ||
      (project.paymentRateType === 'fixed' && project.paymentAmount))
  ) {
    return formatRatePayString(
      project.paymentType,
      project.paymentRateType || 'fixed',
      project.paymentAmount,
      project.paymentAmountMin,
      project.paymentAmountMax,
      project.ratePay
    );
  }

  if (project.ratePay && project.ratePay.trim()) {
    return project.ratePay;
  }

  const pType = project.paymentType || 'Per Hour';
  return `$20.00 ${pType === 'Per Hour' ? '/ hr' : pType === 'Per Item' ? '/ item' : '/ task'}`;
}

export function getPaymentTypeBadgeInfo(paymentType?: PaymentType) {
  switch (paymentType) {
    case 'Per Hour':
      return { label: 'Per Hour', shortUnit: '/ hr', color: 'emerald' as const };
    case 'Per Item':
      return { label: 'Per Item', shortUnit: '/ item', color: 'blue' as const };
    case 'Per Task':
      return { label: 'Per Task', shortUnit: '/ task', color: 'purple' as const };
    default:
      return { label: 'Per Hour', shortUnit: '/ hr', color: 'emerald' as const };
  }
}

export function getPaymentUnitLabel(paymentType: PaymentType = 'Per Hour', includeSlash: boolean = true): string {
  const prefix = includeSlash ? '/ ' : '';
  switch (paymentType) {
    case 'Per Hour':
      return `${prefix}hr`;
    case 'Per Item':
      return `${prefix}item`;
    case 'Per Task':
      return `${prefix}task`;
    default:
      return `${prefix}hr`;
  }
}

export function formatProjectPayment(
  projectOrType?: Partial<Project> | PaymentType,
  paymentRateType?: PaymentAmountType,
  amount?: number | string,
  min?: number | string,
  max?: number | string
): string {
  if (!projectOrType) {
    return '$20.00 / hr';
  }
  if (typeof projectOrType === 'object') {
    return getProjectDisplayRate(projectOrType);
  }
  return formatRatePayString(projectOrType, paymentRateType, amount, min, max);
}
