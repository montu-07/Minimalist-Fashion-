const categories = ['Electronics', 'Fashion', 'Home', 'Sports', 'Beauty'];
const brands = ['Levis', 'Ralph Lauren', 'U S Polo', 'Luis Vuitton', 'Dior','Rolex'];
const colors = ['Red', 'Blue', 'Black', 'White', 'Green'];
const sizes = ['XS', 'S', 'M', 'L', 'XL'];

const products = Array.from({ length: 60 }).map((_, i) => {
  const category = categories[i % categories.length];
  const brand = brands[(i + 1) % brands.length];
  const color = colors[(i + 2) % colors.length];
  const size = sizes[(i + 3) % sizes.length];
  const tags = [];
  if (i % 4 === 0) tags.push('new');
  return {
    id: i + 1,
    title: `${brand} ${category} Item ${i + 1}`,
    price: Math.round((Math.random() * 90 + 10) * 100) / 100,
    rating: Math.round((Math.random() * 4 + 1) * 2) / 2,
    description: 'This is a great product with awesome features that customers love.',
    category,
    brand,
    color,
    size,
    tags,
    createdAt: Date.now() - i * 86400000,
  };
});

export const facets = {
  categories,
  brands,
  colors,
  sizes,
};

export default products;
