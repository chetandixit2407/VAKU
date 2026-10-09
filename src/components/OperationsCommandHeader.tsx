import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  UserCheck,
  DoorOpen,
  Coffee,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { Candidate, Interview, Room, PantryTask, Visitor } from '../types/index.ts';

interface OperationsCommandHeaderProps {
  candidates: Candidate[];
  interviews?: Interview[];
  rooms: Room[];
  pantryTasks?: PantryTask[];
  visitors?: Visitor[];
  userName?: string;
  userRole?: string;
  onSelectKpi?: (kpiId: string) => void;
}

// Counting number component
const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 650;
    const stepTime = 25;
    const steps = Math.ceil(duration / stepTime);
    const increment = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        start += increment;
        setDisplayValue(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span className="tabular-nums font-mono">{displayValue}</span>;
};

export const OperationsCommandHeader: React.FC<OperationsCommandHeaderProps> = ({
  candidates,
  interviews = [],
  rooms,
  pantryTasks = [],
  visitors = [],
  userName = 'Officer',
  userRole = 'Operations',
  onSelectKpi,
}) => {
  const [greeting, setGreeting] = useState<'Good Morning' | 'Good Afternoon' | 'Good Evening'>('Good Morning');
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      if (hours < 12) setGreeting('Good Morning');
      else if (hours < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');

      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute metrics from actual data
  const waitingCandidates = candidates.filter(
    (c) => c.status === 'ARRIVED' || c.status === 'WAITING' || c.status === 'With Kimmi Mam – Senior HR Interview'
  ).length;

  const inInterviewCandidates = candidates.filter((c) => c.status === 'IN_INTERVIEW').length;

  const operationalRooms = rooms.filter(
    (r) =>
      r.id !== 'room-lalit-cabin' &&
      r.id !== 'room-kimmi-cabin' &&
      r.name !== 'Lalit Sir Cabin' &&
      r.name !== 'Elegance Suite' &&
      !r.isReservedNextRound
  );
  const availableRoomsCount = operationalRooms.filter((r) => r.status === 'AVAILABLE').length;

  const pendingPantryCount = pantryTasks.filter(
    (t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS'
  ).length;

  const activeVisitorsCount = visitors.filter((v) => v.status !== 'CHECKED_OUT').length;

  const kpis = [
    {
      id: 'lobby',
      label: 'Waiting in Lobby',
      value: waitingCandidates,
      sublabel: 'Candidates awaiting escort',
      icon: Users,
      glow: 'from-amber-500/15 via-transparent to-transparent',
      accentColor: 'text-amber-400',
      dotColor: 'bg-amber-400',
    },
    {
      id: 'interviews',
      label: 'Interviews Today',
      value: interviews.length > 0 ? interviews.length : inInterviewCandidates,
      sublabel: 'Active candidate rounds',
      icon: UserCheck,
      glow: 'from-blue-500/15 via-transparent to-transparent',
      accentColor: 'text-blue-400',
      dotColor: 'bg-blue-400',
    },
    {
      id: 'rooms',
      label: 'Available Rooms',
      value: availableRoomsCount,
      sublabel: `Out of ${operationalRooms.length} operational`,
      icon: DoorOpen,
      glow: 'from-emerald-500/15 via-transparent to-transparent',
      accentColor: 'text-emerald-400',
      dotColor: 'bg-emerald-400',
    },
    {
      id: 'pantry',
      label: 'Hospitality Tasks',
      value: pendingPantryCount,
      sublabel: 'Beverages & room prep',
      icon: Coffee,
      glow: 'from-purple-500/15 via-transparent to-transparent',
      accentColor: 'text-purple-400',
      dotColor: 'bg-purple-400',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Editorial Heading Lockup */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#343A40] font-mono">
              Live Operations Deck
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111318] tracking-tight">
            {greeting}, <span className="text-[#111318]">{userName.split(' ')[0]}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#252A32] font-medium mt-0.5">
            White Collar Realty &mdash; Office Operations
          </p>
        </div>

        {/* Live Clock */}
        <div className="flex items-center gap-3">
          <div className="bg-[#17191D] text-white px-3.5 py-1.5 rounded-xl border border-white/10 shadow-md flex items-center gap-2.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-mono font-medium text-white tabular-nums">
              {timeString || '--:--:--'}
            </span>
          </div>
        </div>
      </div>

      {/* Staggered Animated KPI Row — Mixed Black & White Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          const isWhiteCard = idx % 2 === 0;

          return (
            <motion.div
              key={kpi.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectKpi && onSelectKpi(kpi.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (onSelectKpi) onSelectKpi(kpi.id);
                }
              }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.07, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3, scale: 1.01, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              className="card-dark bg-[#0B0B0D] border border-white/12 text-white relative group rounded-2xl p-4 shadow-xl overflow-hidden transition-all cursor-pointer select-none"
              title={`Click to view ${kpi.label} details`}
            >
              {/* Subtle Ambient Hover Glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${kpi.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              />

              <div className="relative z-10 flex items-center justify-between text-xs">
                <span className="font-semibold tracking-tight text-white">
                  {kpi.label}
                </span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 bg-white/5 border border-white/10">
                  <Icon className={`w-3.5 h-3.5 ${kpi.accentColor}`} />
                </div>
              </div>

              <div className="relative z-10 mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  <AnimatedNumber value={kpi.value} />
                </span>
                <span className={`w-2 h-2 rounded-full ${kpi.dotColor} shadow-sm`} />
              </div>

              <div className="relative z-10 flex items-center justify-between text-[11px] mt-1">
                <p className="truncate text-[#E0E0E0]">
                  {kpi.sublabel}
                </p>
                <span className="text-[10px] font-semibold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0 ml-1">
                  View &rarr;
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
