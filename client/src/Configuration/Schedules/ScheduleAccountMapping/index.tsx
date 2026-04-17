import type { output } from 'zod';
import type ScheduleAccountMappingSchema from '@shared/schema/ScheduleAccountMapping';

export default function ScheduleAccountMapping({
  data,
  onChange,
}: {
  data: output<typeof ScheduleAccountMappingSchema>[];
  onChange: (value: output<typeof ScheduleAccountMappingSchema>[]) => void;
}) {
  return 'TODO:';
}
