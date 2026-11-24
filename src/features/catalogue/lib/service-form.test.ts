import { describe, expect, it } from 'vitest';
import type { CatalogueCategory, Service } from '../api/catalogue.schema';
import { serviceChangeFrom, serviceFormDefaults } from './service-form';

const drone: Service = {
  id: 's-drone',
  categoryId: 'c-photo',
  name: 'Drone Coverage',
  description: null,
  showOnClientForm: true,
  parametersOverride: ['hours'],
  effectiveParameters: ['hours'],
  sortOrder: 0,
  archivedAt: null,
};
const photo: CatalogueCategory = {
  id: 'c-photo',
  name: 'Photography and Videography',
  sortOrder: 0,
  parameters: ['pax', 'hours'],
  paxPrefill: false,
  sizeLabels: [],
  archivedAt: null,
  services: [drone],
};

describe('serviceFormDefaults', () => {
  it('starts a new service shown on the form and inheriting', () => {
    expect(serviceFormDefaults({ kind: 'add', category: photo })).toMatchObject({
      categoryId: 'c-photo',
      showOnClientForm: true,
      parameterMode: 'inherit',
      override: [],
    });
  });

  it('starts an edit from the saved override', () => {
    expect(serviceFormDefaults({ kind: 'edit', service: drone, category: photo })).toMatchObject({
      description: '',
      parameterMode: 'override',
      override: ['hours'],
    });
  });
});

describe('serviceChangeFrom', () => {
  const values = serviceFormDefaults({ kind: 'edit', service: drone, category: photo });

  it('sends null to inherit, discarding any chips left selected', () => {
    expect(
      serviceChangeFrom({ ...values, parameterMode: 'inherit' }, drone).parametersOverride,
    ).toBeNull();
  });

  it('sends the override when choosing for the service', () => {
    expect(
      serviceChangeFrom({ ...values, override: ['hours', 'work'] }, drone).parametersOverride,
    ).toEqual(['hours', 'work']);
  });

  it('includes the category only when the service moves', () => {
    expect(serviceChangeFrom(values, drone)).not.toHaveProperty('categoryId');
    expect(serviceChangeFrom({ ...values, categoryId: 'c-decor' }, drone)).toHaveProperty(
      'categoryId',
      'c-decor',
    );
  });

  it('trims the name and description', () => {
    expect(
      serviceChangeFrom({ ...values, name: '  Drone  ', description: ' Aerial ' }),
    ).toMatchObject({
      name: 'Drone',
      description: 'Aerial',
    });
  });
});
