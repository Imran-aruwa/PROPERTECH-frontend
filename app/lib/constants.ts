
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "https://propertechsoftware.co.ke";

export const PAYMENT_TYPES = {
  RENT: "rent",
  WATER: "water",
  ELECTRICITY: "electricity"
};

export const USER_ROLES = {
  OWNER: "owner",
  AGENT: "agent",
  CARETAKER: "caretaker",
  HEAD_SECURITY: "head_security",
  HEAD_GARDENER: "head_gardener",
  SECURITY_GUARD: "security_guard",
  GARDENER: "gardener",
  TENANT: "tenant"
};

export const MAINTENANCE_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  EMERGENCY: "emergency"
};

export const MAINTENANCE_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  REJECTED: "rejected"
};

export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
