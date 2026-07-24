import { Clock, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface BusinessProfileData {
  tagline?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  logoUrl?: string | null;
  cuisineTypes?: string[];
  priceRange?: string | null;
  openingHours?: any;
  rating?: number | null;
}

interface HospitalityHeroProps {
  restaurantName: string;
  profile: BusinessProfileData | null;
  city?: string | null;
  address?: string | null;
  tableNumber?: string | null;
  tableCapacity?: number | null;
  serverName?: string | null;
  isRemote?: boolean;
}

function evaluateOpeningHours(openingHours: any): { isOpen: boolean; closesAt?: string; opensAt?: string; todayHours?: string } {
  if (!openingHours) return { isOpen: true };

  try {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = dayNames[now.getDay()];
    const todayLower = today.toLowerCase();

    let todaySchedule: any = null;

    if (Array.isArray(openingHours)) {
      todaySchedule = openingHours.find((d: any) => {
        const day = (d.day || d.name || '').toLowerCase();
        return day === todayLower;
      });
    } else if (typeof openingHours === 'object') {
      todaySchedule = openingHours[todayLower] || openingHours[today] || openingHours[todayLower.charAt(0).toUpperCase() + todayLower.slice(1)];
    }

    if (!todaySchedule) return { isOpen: true };

    const openTime = todaySchedule.open || todaySchedule.opens || todaySchedule.start;
    const closeTime = todaySchedule.close || todaySchedule.closes || todaySchedule.end;

    if (!openTime || !closeTime) {
      if (todaySchedule.closed === true || todaySchedule.isOpen === false) {
        return { isOpen: false, opensAt: undefined, todayHours: 'Closed today' };
      }
      return { isOpen: true };
    }

    const formatTime = (t: string) => {
      if (!t) return '';
      const parts = t.split(':');
      let h = parseInt(parts[0]);
      const m = parts[1] ? parseInt(parts[1]) : 0;
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
    };

    const todayHoursStr = `${formatTime(openTime)} – ${formatTime(closeTime)}`;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const parseTime = (t: string) => {
      const parts = t.split(':');
      return parseInt(parts[0]) * 60 + (parts[1] ? parseInt(parts[1]) : 0);
    };

    const openMinutes = parseTime(openTime);
    const closeMinutes = parseTime(closeTime);

    const isOpen = nowMinutes >= openMinutes && nowMinutes < closeMinutes;

    return {
      isOpen,
      closesAt: formatTime(closeTime),
      opensAt: formatTime(openTime),
      todayHours: todayHoursStr,
    };
  } catch {
    return { isOpen: true };
  }
}

export default function HospitalityHero({
  restaurantName,
  profile,
  city,
  address,
  tableNumber,
  tableCapacity,
  serverName,
  isRemote = false,
}: HospitalityHeroProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const hours = evaluateOpeningHours(profile?.openingHours);
  const coverImage = profile?.coverImageUrl;
  const logo = profile?.logoUrl;
  const tagline = profile?.tagline;

  return (
    <>
      {/* Hero Section */}
      <div className="relative w-full h-[42dvh] min-h-[280px] max-h-[420px] overflow-hidden">
        {/* Cover Image */}
        {coverImage ? (
          <img
            src={coverImage}
            alt={`${restaurantName} cover`}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out ${scrolled ? 'scale-105' : 'scale-100'}`}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            fetchPriority="high"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-imboni-blue via-imboni-dark to-accent" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end items-center text-center px-4 pb-8">
          {/* Logo */}
          {logo && (
            <div className="mb-3 animate-fade-in">
              <img
                src={logo}
                alt={`${restaurantName} logo`}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/80 shadow-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}

          {/* Restaurant Name */}
          <h1 className="text-white text-2xl sm:text-3xl font-bold tracking-tight animate-fade-in drop-shadow-lg">
            {restaurantName}
          </h1>

          {/* Tagline */}
          {tagline && (
            <p className="text-white/90 text-sm sm:text-base mt-1 max-w-md italic animate-fade-in">
              {tagline}
            </p>
          )}

          {/* Open/Closed + Hours */}
          <div className="flex items-center gap-3 mt-3 animate-fade-in" role="status" aria-live="polite">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              hours.isOpen
                ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                : 'bg-red-500/20 text-red-300 border border-red-400/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${hours.isOpen ? 'bg-green-400' : 'bg-red-400'} ${hours.isOpen ? 'animate-pulse' : ''}`} />
              {hours.isOpen ? 'Open Now' : 'Closed'}
            </div>
            {hours.todayHours && (
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <Clock className="w-3 h-3" />
                {hours.todayHours}
              </div>
            )}
          </div>

          {/* Closed message */}
          {!hours.isOpen && hours.todayHours && (
            <p className="text-white/70 text-xs mt-2 max-w-sm">
              We'd love to serve you between {hours.todayHours}
            </p>
          )}
        </div>
      </div>

      {/* Welcome Bar — Table & Server Acknowledgment */}
      <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-5 border border-gray-100" role="region" aria-label="Table and server information">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Table Info */}
            {tableNumber && !isRemote ? (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">You're seated at</p>
                <p className="text-lg font-bold text-imboni-dark">Table {tableNumber}</p>
                {serverName ? (
                  <p className="text-sm text-gray-500 mt-0.5">
                    Your server tonight is <span className="font-medium text-imboni-dark">{serverName}</span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 mt-0.5">Your server will be with you shortly</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Welcome to</p>
                <p className="text-lg font-bold text-imboni-dark">{restaurantName}</p>
              </div>
            )}

            {/* Location */}
            {(city || address) && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{[city, address].filter(Boolean).join(', ')}</span>
              </div>
            )}

            {/* Rating */}
            {profile?.rating && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-amber-500">★</span>
                <span className="font-medium text-imboni-dark">{profile.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
