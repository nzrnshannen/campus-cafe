export const PRODUCT_IMAGES = {
  'Caramel Macchiato': '/images/caramel_macchiato.jpg',
  'Iced Americano': '/images/iced_americano.jpg',
  'Oat Iced Latte': '/images/oat_latte.jpg',
  'Spanish Latte': '/images/spanish_latte.jpg',
  'Ceremonial Matcha Latte': '/images/matcha_latte.jpg',
  'Chocolate Chip Cookie': '/images/chocolate_cookie.jpg',
  'Egg & Cheese Croissant': '/images/croissant.jpg',
  'Chicken Pesto Sandwich': '/images/pesto_sandwich.jpg',
};

export const getProductImage = (productName) => {
  return PRODUCT_IMAGES[productName] || '/images/caramel_macchiato.jpg';
};
