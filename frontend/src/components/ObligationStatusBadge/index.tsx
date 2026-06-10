import { Badge } from 'antd';
import { ObligationStatus, OBLIGATION_STATUS_LABELS } from '@/models/obligation';

interface ObligationStatusBadgeProps {
  status: ObligationStatus;
}

const STATUS_COLORS: Record<ObligationStatus, string> = {
  [ObligationStatus.Pending]: '#F57F17',
  [ObligationStatus.Overdue]: '#C62828',
  [ObligationStatus.Delivered]: '#2E7D32',
  [ObligationStatus.NotApplicable]: '#90A4AE',
};

export function ObligationStatusBadge({ status }: ObligationStatusBadgeProps) {
  return <Badge color={STATUS_COLORS[status]} text={OBLIGATION_STATUS_LABELS[status]} />;
}
