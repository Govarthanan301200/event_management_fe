import { describe, expect, it } from 'vitest';
import { moveBy, moveTo, sortByIds, withArchivedLast } from './order';

describe('moveTo', () => {
  it('moves an item down onto another', () => {
    expect(moveTo(['a', 'b', 'c', 'd'], 'a', 'c')).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves an item up onto another', () => {
    expect(moveTo(['a', 'b', 'c', 'd'], 'd', 'b')).toEqual(['a', 'd', 'b', 'c']);
  });

  it('leaves the order alone for unknown ids or the same id', () => {
    expect(moveTo(['a', 'b'], 'x', 'a')).toEqual(['a', 'b']);
    expect(moveTo(['a', 'b'], 'a', 'a')).toEqual(['a', 'b']);
  });
});

describe('moveBy', () => {
  it('moves up and down by one', () => {
    expect(moveBy(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(moveBy(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'c', 'b']);
  });

  it('does nothing at either end', () => {
    expect(moveBy(['a', 'b'], 'a', -1)).toEqual(['a', 'b']);
    expect(moveBy(['a', 'b'], 'b', 1)).toEqual(['a', 'b']);
  });
});

describe('withArchivedLast', () => {
  it('appends archived ids in their existing order', () => {
    const items = [
      { id: 'a', archivedAt: null },
      { id: 'x', archivedAt: new Date() },
      { id: 'b', archivedAt: null },
      { id: 'y', archivedAt: new Date() },
    ];
    expect(withArchivedLast(['b', 'a'], items)).toEqual(['b', 'a', 'x', 'y']);
  });
});

describe('sortByIds', () => {
  it('orders items by the given ids, unknown ones last', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'z' }, { id: 'c' }];
    expect(sortByIds(items, ['c', 'a', 'b']).map((item) => item.id)).toEqual(['c', 'a', 'b', 'z']);
  });
});
