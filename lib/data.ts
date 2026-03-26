import { Service, Package, MembershipPlan, Banner, NavigationItem, Testimonial } from './types';


// Empty services array since we're now fetching from backend
export const services: Service[] = [];

// Static data for packages and promotions
export const packages: Package[] = [
  {
    id: 'pkg-1',
    title: 'Basic Cleaning',
    description: 'Essential cleaning services',
    benefits: ['Surface cleaning', 'Dust removal', 'Basic sanitization'],
    price: 19.99,
    duration: 'one-time',
    icon: 'broom'
  },
  {
    id: 'pkg-2',
    title: 'Premium Clean',
    description: 'Thorough cleaning and maintenance',
    benefits: ['Deep cleaning', 'Sanitization', 'Deodorizing', 'Surface protection'],
    price: 49.99,
    duration: 'one-time',
    icon: 'sparkles'
  },
  {
    id: 'pkg-3',
    title: 'Complete Care',
    description: 'Full-service cleaning solution',
    benefits: ['Deep cleaning', 'Sanitization', 'Gardening', 'Window cleaning', 'Interior care'],
    price: 79.99,
    duration: 'one-time',
    icon: 'home'
  }
];

// Static data for membership plans
export const membershipPlans: MembershipPlan[] = [
  {
    id: 'silver',
    planName: 'Silver Clean',
    benefits: ['10% discount on ALL services', 'Standard priority booking', 'Free cancellation up to 4 hours', 'Basic service access', 'Loyalty points multiplier (1.2x)'],
    price: 89,
    billingCycle: 'monthly',
    discount_percentage: 10,
    duration_months: 1,
    features: ['10% discount on all services', 'Standard priority booking']
  },
  {
    id: 'gold',
    planName: 'Gold Clean',
    benefits: ['20% discount on ALL services', 'High priority booking', 'Free cancellation up to 2 hours', 'Extended service access', 'Loyalty points multiplier (1.5x)', 'Complimentary basic add-ons'],
    price: 149,
    billingCycle: 'monthly',
    discount_percentage: 20,
    duration_months: 1,
    features: ['20% discount on all services', 'High priority booking']
  },
  {
    id: 'platinum',
    planName: 'Platinum Clean',
    benefits: ['30% discount on ALL services', 'Highest priority booking', 'Free cancellation anytime', 'Premium service access', 'Loyalty points multiplier (2x)', 'Complimentary premium add-ons', 'Quarterly service assessments', 'Early access to new services', 'Personal service advisor'],
    price: 199,
    billingCycle: 'monthly',
    discount_percentage: 30,
    duration_months: 1,
    features: ['30% discount on all services', 'Highest priority booking']
  }
];

// Static data for banners
export const banners: Banner[] = [
  {
    id: 'banner-1',
    title: 'Premium Cleaning Special',
    subtitle: 'Get 20% off premium cleaning services',
    imageUrl: '/images/premium-wash.jpg',
    videoUrl: '/videos/premium-wash.mp4',
    ctaText: 'Book Now',
    ctaLink: '/book',
    isActive: true,
    order: 1
  },
  {
    id: 'banner-2',
    title: 'New Customer Deal',
    subtitle: 'First cleaning service 40% off for new customers',
    imageUrl: '/images/new-customer-deal.jpg',
    videoUrl: '/videos/new-customer-deal.mp4',
    ctaText: 'Get Deal',
    ctaLink: '/offers',
    isActive: true,
    order: 2
  },
  {
    id: 'banner-3',
    title: 'VIP Membership',
    subtitle: 'Unlimited cleanings with our VIP package',
    imageUrl: '/images/vip-membership.jpg',
    videoUrl: '/videos/vip-membership.mp4',
    ctaText: 'Join Now',
    ctaLink: '/membership',
    isActive: true,
    order: 3
  }
];

// Static data for testimonials
export const testimonials: Testimonial[] = [
  {
    id: 'testimonial-1',
    name: 'Ahmed S.',
    nameAr: 'أحمد س.',
    rating: 5,
    comment: 'Amazing service! My car has never looked better. The attention to detail is incredible.',
    commentAr: 'خدمة مذهلة! سيارتي لم تكن أبداً بهذا الجمال. الاهتمام بالتفاصيل لا يصدق!',
    date: '2024-01-15',
    avatar: 'https://testingbot.com/free-online-tools/random-avatar/200?img=1',
    images: ['/images/testimonial-ahmed-before.jpg', '/images/testimonial-ahmed-after.jpg']
  },
  {
    id: 'testimonial-2',
    name: 'Fatima A.',
    nameAr: 'فاطمة أ.',
    rating: 5,
    comment: 'Professional team and excellent results. Will definitely book again!',
    commentAr: 'فريق محترف ونتائج ممتازة. سأحجز بالتأكيد مرة أخرى!',
    date: '2024-01-10',
    avatar: 'https://testingbot.com/free-online-tools/random-avatar/200?img=2',
    images: ['/images/testimonial-fatima-car.jpg']
  },
  {
    id: 'testimonial-3',
    name: 'Mohammed K.',
    nameAr: 'محمد ك.',
    rating: 5,
    comment: 'Fast, reliable, and affordable. The best car wash service in town!',
    commentAr: 'سريع، موثوق، وبسعر معقول. أفضل خدمة غسيل سيارات في المدينة!',
    date: '2024-01-05',
    avatar: 'https://testingbot.com/free-online-tools/random-avatar/200?img=3',
    images: ['/images/testimonial-mohammed-sedan-before.jpg', '/images/testimonial-mohammed-sedan-after.jpg', '/images/testimonial-mohammed-sedan-detail.jpg']
  },
  {
    id: 'testimonial-4',
    name: 'Aisha M.',
    nameAr: 'عائشة م.',
    rating: 4,
    comment: 'Great experience overall. The car detailers were very thorough and professional.',
    commentAr: 'تجربة رائعة بشكل عام. عمال التفصيل كانوا دقيقين ومحترفين جداً.',
    date: '2024-01-01',
    avatar: 'https://testingbot.com/free-online-tools/random-avatar/200?img=4',
    images: ['/images/testimonial-aisha-suv.jpg']
  },
  {
    id: 'testimonial-5',
    name: 'Omar T.',
    nameAr: 'عمر ت.',
    rating: 5,
    comment: 'Outstanding service! My vehicle looked brand new after the detailing. Highly recommend!',
    commentAr: 'خدمة استثنائية! بدت سيارتي جديدة كلياً بعد التفصيل. أوصي بها بشدة!',
    date: '2023-12-28',
    avatar: 'https://testingbot.com/free-online-tools/random-avatar/200?img=5',
    images: ['/images/testimonial-omar-luxury-before.jpg', '/images/testimonial-omar-luxury-after.jpg']
  }
];

// Static data for navigation items
export const navigationItems: NavigationItem[] = [
  {
    id: 'nav-home',
    icon: 'home',
    label: 'Home',
    href: '/',
    route: '/',
    isActive: true,
    order: 1
  },
  {
    id: 'nav-bookings',
    icon: 'calendar',
    label: 'Bookings',
    href: '/bookings',
    route: '/bookings',
    isActive: false,
    order: 2
  },
  {
    id: 'nav-action',
    icon: 'broom',
    label: 'Book',
    href: '/book',
    route: '/book',
    isActive: false,
    order: 3
  },
  {
    id: 'nav-membership',
    icon: 'membership',
    label: 'Membership',
    href: '/membership',
    route: '/membership',
    isActive: false,
    order: 4
  },
  {
    id: 'nav-profile',
    icon: 'user',
    label: 'Profile',
    href: '/profile',
    route: '/profile',
    isActive: false,
    order: 5
  }
];