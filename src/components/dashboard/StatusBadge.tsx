import React from 'react';
import { cn } from '../../lib/utils';
import { ComplaintStatus } from '../../types';

interface StatusBadgeProps {
  status: ComplaintStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    'Pending': 'status-pending',
    'In Progress': 'status-progress',
    'Resolved': 'status-resolved',
  };

  return (
    <span className={cn(
      "status-chip",
      styles[status]
    )}>
      {status}
    </span>
  );
};
