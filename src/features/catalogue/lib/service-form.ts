import type { ServiceChange, ServiceInput } from '../api/catalogue.api';
import type { CatalogueCategory, Service, ServiceForm } from '../api/catalogue.schema';

export type ServiceDialogMode =
  | { kind: 'add'; category: CatalogueCategory }
  | { kind: 'edit'; service: Service; category: CatalogueCategory };

/** Form values for Add (empty, shown on the form, inherit) or Edit (the service as saved). */
export function serviceFormDefaults(mode: ServiceDialogMode): ServiceForm {
  if (mode.kind === 'add') {
    return {
      name: '',
      description: '',
      categoryId: mode.category.id,
      showOnClientForm: true,
      hasRooms: false,
      parameterMode: 'inherit',
      override: [],
    };
  }
  const { service } = mode;
  return {
    name: service.name,
    description: service.description ?? '',
    categoryId: service.categoryId,
    showOnClientForm: service.showOnClientForm,
    hasRooms: service.hasRooms,
    parameterMode: service.parametersOverride ? 'override' : 'inherit',
    override: service.parametersOverride ?? [],
  };
}

/** Form values → API body. "Inherit" sends `null`; the category is sent only when it changed (a move). */
export function serviceChangeFrom(values: ServiceForm): ServiceInput;
export function serviceChangeFrom(values: ServiceForm, current: Service): ServiceChange;
export function serviceChangeFrom(
  values: ServiceForm,
  current?: Service,
): ServiceInput | ServiceChange {
  const input: ServiceInput = {
    name: values.name.trim(),
    description: values.description.trim(),
    showOnClientForm: values.showOnClientForm,
    hasRooms: values.hasRooms,
    parametersOverride: values.parameterMode === 'override' ? values.override : null,
  };
  if (current && values.categoryId !== current.categoryId) {
    return { ...input, categoryId: values.categoryId };
  }
  return input;
}
