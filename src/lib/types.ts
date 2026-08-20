export interface EventRow {
  id: string;
  name: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  orderCounter: number;
  createdAt: string;
}

export interface EventListRow extends EventRow {
  orderCount: number;
}

export interface OrderRow {
  id: string;
  eventId: string;
  seq: number;
  createdAt: string;
  item: string;
  temp: string;
  milk: string | null;
  shotsAdded: number;
  syrup: string | null;
  decaf: boolean;
  boastStyle: boolean;
  abbreviation: string;
  deleted: boolean;
}

export interface SummaryCount {
  key: string | null;
  count: number;
}

export interface SummaryResponse {
  event: EventRow;
  total: number;
  decafCount: number;
  boastStyleCount: number;
  shotsCount: number;
  byItem: SummaryCount[];
  byMilk: SummaryCount[];
  bySyrup: SummaryCount[];
  byTemp: SummaryCount[];
}
