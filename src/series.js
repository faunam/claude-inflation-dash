// FRED series shown on the dashboard. All are monthly and seasonally adjusted.
export const HEADLINE = [
  {
    id: 'CPIAUCSL',
    label: 'CPI',
    name: 'Consumer Price Index',
    definition:
      'What urban households pay out of pocket for a fixed basket of goods and services, such as food, rent, gas and medical care. Published monthly by the Bureau of Labor Statistics, it is the most widely quoted inflation measure.',
  },
  {
    id: 'PCEPI',
    label: 'PCE',
    name: 'Personal Consumption Expenditures Price Index',
    definition:
      'Prices of everything consumed by or on behalf of households, including costs paid by employers and government, such as health insurance. Its basket updates as people switch what they buy. Published by the Bureau of Economic Analysis, it is the Federal Reserve’s preferred measure for its 2% target.',
  },
  {
    id: 'PPIFIS',
    label: 'PPI',
    name: 'Producer Price Index, final demand',
    definition:
      'Prices that domestic producers receive for the goods, services and construction they sell, before retail markups and taxes. Published by the Bureau of Labor Statistics, it often signals price pressure before it reaches consumers.',
  },
];

// The eight major expenditure groups that make up the CPI basket.
export const CPI_CATEGORIES = [
  { id: 'CPIHOSSL', label: 'Housing' },
  { id: 'CPITRNSL', label: 'Transportation' },
  { id: 'CPIFABSL', label: 'Food & beverages' },
  { id: 'CPIMEDSL', label: 'Medical care' },
  { id: 'CPIEDUSL', label: 'Education & communication' },
  { id: 'CPIRECSL', label: 'Recreation' },
  { id: 'CPIAPPSL', label: 'Apparel' },
  { id: 'CPIOGSSL', label: 'Other goods & services' },
];

export const SERIES = [...HEADLINE, ...CPI_CATEGORIES];

// Average retail prices (U.S. city average, BLS) for a few everyday items.
// These are dollar prices, not indexes, and are not seasonally adjusted.
export const PRICES = [
  { id: 'APU000074714', label: 'Gasoline', unit: 'gallon', detail: 'Unleaded regular, per gallon', icon: 'gas' },
  { id: 'APU0000702111', label: 'Bread', unit: 'lb', detail: 'White pan bread, per pound', icon: 'bread' },
  { id: 'APU0000711211', label: 'Bananas', unit: 'lb', detail: 'Per pound', icon: 'banana' },
];

export const PRICE_YEARS = 20;
