export type Plan = {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  isPopular?: boolean;
  features: string[];
  description: string;
  icon: React.ComponentType<any>;
  badgeColor: string;
  borderColor: string;
};
