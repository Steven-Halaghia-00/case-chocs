
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function isValidUUID(uuid) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

export function formatDate(dateString, format = 'default') {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  if (format === 'HH:mm') {
    return date.toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });
  }
  
  if (format === 'd MMM yyyy') {
    return date.toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return date.toLocaleDateString('fr-CH');
}

export function formatCurrency(amount, currency = 'CHF') {
  if (amount === null || amount === undefined) return '-';
  
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return '-';

  const currencySymbols = {
    'CHF': 'CHF',
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
  };
  
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

export const validateEventId = (eventId) => {
  if (!eventId) return { valid: false, error: "Event ID is missing" };
  if (!isValidUUID(eventId)) return { valid: false, error: "Invalid UUID format" };
  return { valid: true, error: null };
};

export function formatPaymentStatus(status) {
  if (!status) return 'Inconnu';
  
  const statusMap = {
    'paid': 'Payé',
    'pending': 'En attente',
    'cancelled': 'Annulé',
    'refunded': 'Remboursé',
    'failed': 'Échoué'
  };

  return statusMap[status.toLowerCase()] || status;
}
