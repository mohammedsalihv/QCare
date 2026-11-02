import { createElement } from 'react';
import { Search, Filter, ArrowDownUp, ListFilter, Rows3, UsersRound, CircleCheck, Building2, MapPin, Tags, CalendarDays, Stethoscope, Download, RefreshCw, SlidersHorizontal } from 'lucide-react';

// One semantic icon mapping for list toolbars, Select and action controls.
export function ListControlIcon({ label, ...props }) {
  const rules = [
    [/search/i, Search], [/refresh|reload/i, RefreshCw], [/export|download/i, Download],
    [/order|direction/i, ArrowDownUp], [/sort/i, ListFilter], [/rows|per page|page size|limit/i, Rows3],
    [/profession|staff|people|owner/i, UsersRound], [/status|verification/i, CircleCheck],
    [/department/i, Building2], [/location|ward/i, MapPin], [/specialt/i, Stethoscope],
    [/category|categories|type/i, Tags], [/year|month|date|period/i, CalendarDays],
    [/criteria|advanced/i, SlidersHorizontal],
  ];
  return createElement(rules.find(([pattern]) => pattern.test(label))?.[1] || Filter, props);
}
