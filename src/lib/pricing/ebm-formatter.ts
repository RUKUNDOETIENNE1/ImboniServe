/**
 * EBM (Electronic Billing Machine) Receipt Formatter
 * Rwanda RRA-compliant receipt formatting
 */

import { FeeCalculationResult } from './fee-calculator';
import type { PaymentMethod } from './fee-config';
import { formatRWF } from './fee-calculator';
import { formatDateTimeRW } from '@/utils/datetimeRW';
import { CurrencyService } from '@/lib/services/currency.service';

export interface EBMReceiptLine {
  description: string;
  descriptionRW: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
}

export interface EBMReceipt {
  lines: EBMReceiptLine[];
  subtotal: number;
  totalVAT: number;
  convenienceFee: number;
  convenienceFeeVAT: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  timestamp: Date;
  currency?: string;
}

/**
 * Format order items for EBM receipt
 */
export function formatEBMReceipt(
  orderItems: Array<{
    name: string;
    nameRW?: string;
    quantity: number;
    price: number;
    vatRate?: number;
  }>,
  feeCalculation: FeeCalculationResult,
  currency: string = 'RWF'
): EBMReceipt {
  const vatRate = 18.0; // Rwanda standard VAT

  // Format order items
  const lines: EBMReceiptLine[] = orderItems.map((item) => {
    const amount = item.quantity * item.price;
    const itemVatRate = item.vatRate || vatRate;
    const vatAmount = Math.round((amount * itemVatRate) / (100 + itemVatRate));
    const totalAmount = amount;

    return {
      description: item.name,
      descriptionRW: item.nameRW || item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      amount,
      vatRate: itemVatRate,
      vatAmount,
      totalAmount,
    };
  });

  // Add convenience fee as separate line if applicable
  if (feeCalculation.feeApplied && feeCalculation.convenienceFee > 0) {
    lines.push({
      description: 'Digital Payment Convenience Fee',
      descriptionRW: 'Amafaranga ya Serivisi (Kwishyura kuri Sisitemu)',
      quantity: 1,
      unitPrice: feeCalculation.convenienceFee,
      amount: feeCalculation.convenienceFee,
      vatRate: vatRate,
      vatAmount: feeCalculation.convenienceFeeVAT,
      totalAmount: feeCalculation.convenienceFee,
    });
  }

  // Calculate totals
  const subtotal = feeCalculation.subtotal;
  const totalVAT = lines.reduce((sum, line) => sum + line.vatAmount, 0);
  const grandTotal = feeCalculation.total;

  return {
    lines,
    subtotal,
    totalVAT,
    convenienceFee: feeCalculation.convenienceFee,
    convenienceFeeVAT: feeCalculation.convenienceFeeVAT,
    grandTotal,
    paymentMethod: feeCalculation.paymentMethod,
    timestamp: new Date(),
    currency,
  };
}

/**
 * Generate EBM-compliant receipt text
 */
export function generateEBMReceiptText(receipt: EBMReceipt, language: 'en' | 'rw' = 'en'): string {
  const lines: string[] = [];
  
  lines.push('========================================');
  lines.push(language === 'en' ? 'IMBONI SERVE - OFFICIAL RECEIPT' : 'IMBONI SERVE - INYEMEZABUGUZI');
  lines.push('========================================');
  lines.push(`Date/Itariki: ${formatDateTimeRW(receipt.timestamp, language)}`);
  lines.push('');
  
  lines.push(language === 'en' ? 'ITEMS / IBINTU:' : 'IBINTU:');
  lines.push('----------------------------------------');
  
  const currency = receipt.currency || 'RWF';
  const formatAmount = (cents: number) => CurrencyService.formatAmount(cents, currency);
  
  receipt.lines.forEach((line) => {
    const desc = language === 'en' ? line.description : line.descriptionRW;
    lines.push(`${desc}`);
    lines.push(`  ${line.quantity} x ${formatAmount(line.unitPrice)} = ${formatAmount(line.amount)}`);
    if (line.vatRate > 0) {
      lines.push(`  VAT (${line.vatRate}%): ${formatAmount(line.vatAmount)}`);
    }
  });
  
  lines.push('----------------------------------------');
  lines.push(`${language === 'en' ? 'Subtotal' : 'Ikiguzi Rusange'}: ${formatAmount(receipt.subtotal)}`);
  
  if (receipt.convenienceFee > 0) {
    lines.push(`${language === 'en' ? 'Convenience Fee' : 'Amafaranga ya Serivisi'}: ${formatAmount(receipt.convenienceFee)}`);
  }
  
  lines.push(`${language === 'en' ? 'Total VAT' : 'TVA Yose'}: ${formatAmount(receipt.totalVAT)}`);
  lines.push('========================================');
  lines.push(`${language === 'en' ? 'TOTAL' : 'YOSE HAMWE'}: ${formatAmount(receipt.grandTotal)}`);
  lines.push('========================================');
  lines.push(`${language === 'en' ? 'Payment Method' : 'Uburyo bwo Kwishyura'}: ${receipt.paymentMethod.toUpperCase()}`);
  lines.push('');
  lines.push(language === 'en' ? 'Thank you for your business!' : 'Murakoze cyane!');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Generate JSON for EBM integration
 */
export function generateEBMJSON(receipt: EBMReceipt): object {
  return {
    receipt_type: 'NS',
    receipt_date: receipt.timestamp.toISOString(),
    items: receipt.lines.map((line, index) => ({
      item_sequence: index + 1,
      item_code: line.description.replace(/\s+/g, '_').toUpperCase(),
      item_designation: line.description,
      item_quantity: line.quantity,
      item_price: line.unitPrice,
      item_ct: line.vatRate === 18 ? 'B' : line.vatRate === 0 ? 'E' : 'A',
      item_tl: line.vatRate,
      item_price_nvat: Math.round(line.amount / (1 + line.vatRate / 100)),
      item_vat: line.vatAmount,
      item_price_wvat: line.totalAmount,
    })),
    payment_type: receipt.paymentMethod === 'CASH' ? '1' : '4',
    vat_total: receipt.totalVAT,
    total_amount: receipt.grandTotal,
  };
}
