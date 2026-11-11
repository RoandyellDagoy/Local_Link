// Single list of product categories (matches the `categories` table seed).
import produce from '../assets/img/cat_produce.jpg'
import food from '../assets/img/cat_food.jpg'
import crafts from '../assets/img/cat_crafts.jpg'
import home from '../assets/img/cat_home.jpg'
import fashion from '../assets/img/cat_fashion.jpg'
import other from '../assets/img/cat_other.jpg'

export const categories = [
  { slug: 'fresh-produce', name: 'Fresh Produce', image: produce },
  { slug: 'food-beverages', name: 'Food and Beverages', image: food },
  { slug: 'handmade-crafts', name: 'Handmade Crafts', image: crafts },
  { slug: 'home-living', name: 'Home and Living', image: home },
  { slug: 'fashion-accessories', name: 'Fashion and Accessories', image: fashion },
  { slug: 'other', name: 'Other Products', image: other }
]

export const fallbackImage = other
export const categoryImage = (slug) => categories.find((c) => c.slug === slug)?.image || other

