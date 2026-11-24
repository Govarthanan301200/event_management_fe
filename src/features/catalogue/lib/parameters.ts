import { PARAMETER_LABEL, type ParameterKey } from '../api/catalogue.schema';

/** "Pax, Hours" for tables and helper text. */
export function parameterList(keys: readonly ParameterKey[]): string {
  return keys.length === 0 ? 'None' : keys.map((key) => PARAMETER_LABEL[key]).join(', ');
}
