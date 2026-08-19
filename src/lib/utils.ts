import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function getCleanPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = `55${cleaned}`;
  }
  return cleaned;
}

export function getStatusBadgeInfo(status: string) {
  switch (status) {
    case "frio":
      return { label: "Frio", color: "bg-blue-100 text-blue-800 border-blue-200", icon: "❄️" };
    case "morno":
      return { label: "Morno", color: "bg-amber-100 text-amber-800 border-amber-200", icon: "🌤️" };
    case "quente":
      return { label: "Quente", color: "bg-orange-100 text-orange-800 border-orange-200", icon: "🔥" };
    case "vendido":
      return { label: "Vendido", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: "🏆" };
    case "desativado":
      return { label: "Desativado", color: "bg-rose-100 text-rose-800 border-rose-200", icon: "⛔" };
    default:
      return { label: status, color: "bg-gray-100 text-gray-800 border-gray-200", icon: "📋" };
  }
}
