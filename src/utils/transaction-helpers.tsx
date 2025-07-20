import React from "react";
import {
  Smartphone,
  Banknote,
  Building2,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Helper function to format date and time
 */
export const formatDateTime = (dateTime: string): { date: string; time: string } => {
  const dt = new Date(dateTime);
  return {
    date: dt.toLocaleDateString(),
    time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};

/**
 * Helper function to get payment method display info
 */
export const getPaymentMethodInfo = (method: string | null) => {
  switch (method) {
    case 'momo_pay':
      return { label: 'Mobile Money', icon: Smartphone, color: 'bg-blue-100 text-blue-800' };
    case 'cash':
      return { label: 'Cash', icon: Banknote, color: 'bg-green-100 text-green-800' };
    case 'bank_transfer':
      return { label: 'Bank Transfer', icon: Building2, color: 'bg-purple-100 text-purple-800' };
    default:
      return { label: 'Unknown', icon: CreditCard, color: 'bg-gray-100 text-gray-800' };
  }
};

/**
 * Helper function to get payment status display info
 */
export const getPaymentStatusInfo = (status: string) => {
  switch (status) {
    case 'paid':
      return { label: 'Paid', icon: CheckCircle2, color: 'bg-green-100 text-green-800' };
    case 'pending':
      return { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' };
    case 'partial':
      return { label: 'Partial', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' };
    default:
      return { label: 'Unknown', icon: AlertTriangle, color: 'bg-gray-100 text-gray-800' };
  }
};

/**
 * Helper function to get status badge component
 */
export const getStatusBadge = (status: string) => {
  return status === "completed" ? (
    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
      Completed
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">
      Pending
    </Badge>
  );
};

/**
 * Helper function to get deposit type badge component
 */
export const getDepositTypeBadge = (type: string) => {
  switch (type) {
    case "bank":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
          <Building2 className="h-3 w-3 mr-1" />
          Bank
        </Badge>
      );
    case "momo":
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
          <Smartphone className="h-3 w-3 mr-1" />
          MoMo
        </Badge>
      );
    case "boss":
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
          <Eye className="h-3 w-3 mr-1" />
          To
        </Badge>
      );
    case "handed_to_boss":
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
          <Eye className="h-3 w-3 mr-1" />
          Handed to Boss
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          Unknown
        </Badge>
      );
  }
};

/**
 * Helper function to get approval status badge component
 */
export const getApprovalStatusBadge = (approvalStatus: string) => {
  switch (approvalStatus) {
    case "accepted":
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          Unknown
        </Badge>
      );
  }
};
