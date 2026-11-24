import type { VendorInput } from '../api/vendors.api';
import type { VendorDetail, VendorForm, VendorServiceRow } from '../api/vendors.schema';
import type { IndexedService } from './catalogue-index';

const emptyServiceRow = (serviceId: string): VendorServiceRow => ({
  serviceId,
  rateAmount: '',
  rateBasis: '',
  rateNote: '',
});

/** A new vendor; `serviceId` pre-selects a service (from "No vendors offer X yet"). */
export function emptyVendorForm(serviceId?: string | null): VendorForm {
  return {
    name: '',
    contactPerson: '',
    phone: '',
    altPhone: '',
    city: '',
    address: '',
    portfolioUrl: '',
    notes: '',
    contacts: [],
    services: serviceId ? [emptyServiceRow(serviceId)] : [],
  };
}

export function toFormValues(vendor: VendorDetail): VendorForm {
  return {
    name: vendor.name,
    contactPerson: vendor.contactPerson ?? '',
    phone: vendor.phone,
    altPhone: vendor.altPhone ?? '',
    city: vendor.city ?? '',
    address: vendor.address ?? '',
    portfolioUrl: vendor.portfolioUrl ?? '',
    notes: vendor.notes ?? '',
    contacts: vendor.contacts.map((contact) => ({
      name: contact.name,
      role: contact.role ?? '',
      phone: contact.phone,
    })),
    services: vendor.services.map((service) => ({
      serviceId: service.serviceId,
      rateAmount: service.rateAmount === null ? '' : String(service.rateAmount),
      rateBasis: service.rateBasis ?? '',
      rateNote: service.rateNote ?? '',
    })),
  };
}

/** "8,000" → 8000; empty → null. The form schema has already checked the shape. */
export function parseRupees(text: string): number | null {
  const digits = text.replace(/,/g, '').trim();
  return digits === '' ? null : Number(digits);
}

/** The request body. Empty optional text is sent as "" and stored as "none" by the server. */
export function toVendorInput(values: VendorForm): VendorInput {
  return {
    ...values,
    services: values.services.map((row) => {
      const rateAmount = parseRupees(row.rateAmount);
      return {
        serviceId: row.serviceId,
        rateAmount,
        rateBasis: rateAmount === null || row.rateBasis === '' ? null : row.rateBasis,
        rateNote: row.rateNote,
      };
    }),
  };
}

/**
 * The service rows after the picker closes: rows still selected keep their rates, new picks get
 * empty rows, unticked ones go. Rows the picker can't show (archived links) always stay.
 * The result is in catalogue order, which is how the form groups them.
 */
export function applyServiceSelection(
  rows: readonly VendorServiceRow[],
  selectedIds: ReadonlySet<string>,
  index: ReadonlyMap<string, IndexedService>,
): VendorServiceRow[] {
  const kept = rows.filter(
    (row) => selectedIds.has(row.serviceId) || index.get(row.serviceId)?.archived !== false,
  );
  const present = new Set(kept.map((row) => row.serviceId));
  const added = [...selectedIds].filter((id) => !present.has(id)).map(emptyServiceRow);
  const position = (row: VendorServiceRow) =>
    index.get(row.serviceId)?.position ?? Number.MAX_SAFE_INTEGER;
  return [...kept, ...added].sort((a, b) => position(a) - position(b));
}
