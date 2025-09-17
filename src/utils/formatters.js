/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: 'USD')
 * @param {Object} options - Additional options for Intl.NumberFormat
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (
  amount,
  currency = 'USD',
  options = {}
) => {
  if (typeof amount !== 'number') {
    return '';
  }

  const defaultOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };

  return new Intl.NumberFormat('en-US', defaultOptions).format(amount);
};

/**
 * Format a date string or timestamp
 * @param {string|number|Date} date - The date to format
 * @param {Object} options - Options for Intl.DateTimeFormat
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
};

/**
 * Format a number as a percentage
 * @param {number} value - The value to format (0-1)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 0) => {
  if (typeof value !== 'number') return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Truncate text to a specified length and add ellipsis
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @param {string} ellipsis - The ellipsis character(s) to use
 * @returns {string} Truncated text with ellipsis if needed
 */
export const truncateText = (text = '', maxLength = 100, ellipsis = '...') => {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}${ellipsis}`;
};

/**
 * Format a number with commas as thousand separators
 * @param {number|string} number - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined) return '0';
  return Number(number).toLocaleString('en-US');
};

/**
 * Format a product's stock status
 * @param {string} status - The stock status code
 * @returns {Object} Object with display text and color
 */
export const formatStockStatus = (status) => {
  const statusMap = {
    in_stock: { text: 'In Stock', color: 'success' },
    out_of_stock: { text: 'Out of Stock', color: 'error' },
    pre_order: { text: 'Pre-order', color: 'info' },
    backorder: { text: 'Backorder', color: 'warning' },
    discontinued: { text: 'Discontinued', color: 'default' },
  };

  return statusMap[status] || { text: status, color: 'default' };
};

/**
 * Format a product's weight
 * @param {number} weight - The weight value
 * @param {string} unit - The weight unit (g, kg, lb, oz)
 * @returns {string} Formatted weight string
 */
export const formatWeight = (weight, unit = 'g') => {
  if (typeof weight !== 'number') return '';
  
  const units = {
    g: 'g',
    kg: 'kg',
    lb: 'lb',
    oz: 'oz',
  };
  
  return `${weight} ${units[unit] || unit}`;
};

/**
 * Format a product's dimensions
 * @param {Object} dimensions - Object with length, width, height
 * @param {string} unit - The unit of measurement (cm, in)
 * @returns {string} Formatted dimensions string
 */
export const formatDimensions = (dimensions = {}, unit = 'cm') => {
  const { length, width, height } = dimensions;
  if (!length || !width || !height) return '';
  return `${length} × ${width} × ${height} ${unit}`;
};
