"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Activity as ActivityIcon
} from "lucide-react";

interface Activity {
  id: string;
  action_id: string;
  stage: string;
  status: 'executed' | 'rejected' | 'pending_hitl' | 'error';
  session_id: string;
  created_at: string;
}

interface ActivitiesResponse {
  activities: Activity[];
  total: number;
  page: number;
  hasMore: boolean;
}

const statusConfig: Record<string, { 
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  bgColor: string;
}> = {
  executed: { icon: CheckCircle, color: 'var(--success)', bgColor: 'var(--success-bg)' },
  rejected: { icon: XCircle, color: 'var(--error)', bgColor: 'var(--error-bg)' },
  pending_hitl: { icon: Clock, color: 'var(--warning)', bgColor: 'var(--warning-bg)' },
  error: { icon: XCircle, color: 'var(--error)', bgColor: 'var(--error-bg)' },
};

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch(`/api/activity?limit=50&page=1`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: ActivitiesResponse = await res.json();
        setActivities(data.activities);
        setError(false);
      } catch (err) {
        if (!activities) {
          setError(true);
        }
      }
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--error)' }}>
        <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Failed to load activities</p>
      </div>
    );
  }

  if (!activities) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="h-16 mx-4 my-2 rounded-lg"
            style={{ backgroundColor: 'var(--card-elevated)' }}
          />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
        <ActivityIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No activities logged yet</p>
      </div>
    );
  }

  return (
    <div>
      {activities.map((activity) => {
        const status = statusConfig[activity.status] || { icon: Zap, color: 'var(--text-secondary)', bgColor: 'var(--card-elevated)' };
        const StatusIcon = status.icon;

        return (
          <div
            key={activity.id}
            className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 transition-colors cursor-pointer"
            style={{ 
              borderRadius: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card-elevated)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Status Icon */}
            <div 
              className="w-7 h-7 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: status.bgColor }}
            >
              <StatusIcon className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" style={{ color: status.color }} />
            </div>

            {/* Content gap-1.5 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 md:gap-2 mb-0.5">
                <span 
                  className="text-[10px] md:text-xs font-semibold uppercase"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {activity.action_id}
                </span>
                <span 
                  className="badge text-[10px] md:text-xs py-0.5 px-1.5 md:px-2 hidden sm:inline-block outline outline-1"
                  style={{ 
                    color: 'var(--text-secondary)',
                    outlineColor: 'var(--border)'
                  }}
                >
                  {activity.stage}
                </span>
                <span 
                  className="badge text-[10px] md:text-xs py-0.5 px-1.5 md:px-2"
                  style={{ 
                    backgroundColor: status.bgColor,
                    color: status.color,
                  }}
                >
                  {activity.status}
                </span>
              </div>
              <div
                className="text-xs md:text-sm truncate"
                style={{ color: 'var(--text-secondary)' }}
              >
                Session: {activity.session_id.substring(0, 8)}...
              </div>
            </div>

            {/* Time */}
            <time 
              className="text-[10px] md:text-xs whitespace-nowrap flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
            >
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: false })}
            </time>
          </div>
        );
      })}
    </div>
  );
}
