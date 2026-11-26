import { useQuery } from '@tanstack/react-query';
import { dashboardOptions } from '../api/dashboard.api';

export function useDashboard() {
  return useQuery(dashboardOptions());
}
