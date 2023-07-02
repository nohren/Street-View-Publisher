export const isNil = value =>
  value === undefined || value === null || value === Number.isNaN;

export const isEmpty = value => {
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.length === 0;
    } else {
      return Object.keys(value).length === 0;
    }
  }
  return isNil(value);
};
