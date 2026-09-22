import {
  Bike,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  createIcons,
  LayoutDashboard,
  Map,
  MapPin,
  Menu,
  PackageCheck,
  Phone,
  Plus,
  Route,
  Search,
  Trash2,
  Users,
  Utensils,
  X
} from 'lucide';

const icons = {
  Bike,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  Map,
  MapPin,
  Menu,
  PackageCheck,
  Phone,
  Plus,
  Route,
  Search,
  Trash2,
  Users,
  Utensils,
  X
};

export function icon(name: string, size = 18): string {
  return `<i data-lucide="${name}" width="${size}" height="${size}"></i>`;
}

export function mountIcons(): void {
  createIcons({ icons });
}
