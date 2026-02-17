import { LeaseClause, LeaseClauseType } from './types';

interface ClauseTemplate {
  type: LeaseClauseType;
  text: string;
  editable: boolean;
  risk_weight: number;
}

const CLAUSE_TEMPLATES: ClauseTemplate[] = [
  {
    type: 'rent',
    text: 'The Tenant shall pay a monthly rent of KES {rent_amount} to the Landlord, due on or before the 5th day of each calendar month. Late payments shall attract a penalty of 10% of the monthly rent for each week of delay.',
    editable: true,
    risk_weight: 5,
  },
  {
    type: 'rent',
    text: 'A refundable security deposit of KES {deposit_amount} has been paid by the Tenant. This deposit shall be refunded within 30 days of lease termination, subject to deductions for any damages beyond normal wear and tear.',
    editable: true,
    risk_weight: 4,
  },
  {
    type: 'termination',
    text: 'Either party may terminate this lease by providing a minimum of one (1) month written notice to the other party. Early termination without notice shall result in forfeiture of the security deposit.',
    editable: true,
    risk_weight: 4,
  },
  {
    type: 'maintenance',
    text: 'The Landlord shall be responsible for structural repairs and maintenance of common areas. The Tenant shall be responsible for minor repairs within the unit and shall report any maintenance issues promptly.',
    editable: true,
    risk_weight: 3,
  },
  {
    type: 'pets',
    text: 'No pets are allowed on the premises without prior written consent from the Landlord. Where pets are permitted, the Tenant shall be liable for any damages caused by the pet.',
    editable: true,
    risk_weight: 2,
  },
  {
    type: 'utilities',
    text: 'The Tenant shall be responsible for payment of all utility bills including water, electricity, and internet services. The Landlord shall ensure uninterrupted supply of these utilities to the premises.',
    editable: true,
    risk_weight: 3,
  },
];

export function generateClauseId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'clause-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

export function generateClausesFromTemplates(
  rentAmount: number,
  depositAmount: number
): LeaseClause[] {
  return CLAUSE_TEMPLATES.map((template) => ({
    id: generateClauseId(),
    type: template.type,
    text: template.text
      .replace('{rent_amount}', rentAmount.toLocaleString())
      .replace('{deposit_amount}', depositAmount.toLocaleString()),
    editable: template.editable,
    risk_weight: template.risk_weight,
  }));
}

export function createCustomClause(text: string = ''): LeaseClause {
  return {
    id: generateClauseId(),
    type: 'custom',
    text,
    editable: true,
    risk_weight: 1,
  };
}
