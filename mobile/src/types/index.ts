export interface Site {
  site_id: string;
  site_name: string;
  active_upload_id: string | null;
}

export interface ActiveUpload {
  upload_id: string;
  site_id: string;
  status: 'INACTIVE' | 'ACTIVE' | 'COMPLETE';
  uploaded_at: string;
}

export interface Unit {
  upload_id: string;
  unit_id: string;
  site_id: string;
  unit_name: string;
  sequence: number;
  customer_name: string | null;
  customer_id: string | null;
  assignment_status: 'QUEUED' | 'SENT' | 'CONFLICT' | 'ERROR' | null;
  dev_eui_normalized: string | null;
  is_skipped: boolean;
}

export interface SkipReason {
  id: string;
  label: string;
  active: boolean;
}

export interface ConflictDetail {
  assignment_id: string;
  site_id: string;
  unit_id: string;
  dev_eui_normalized: string;
  technician_email: string;
  timestamp_local: string;
  timestamp_server: string;
}

export interface QueuedAssignment {
  id: string;
  upload_id: string;
  site_id: string;
  unit_id: string;
  dev_eui_raw: string;
  dev_eui_normalized: string;
  timestamp_local: string;
  status: 'PENDING' | 'SENT' | 'CONFLICT' | 'ERROR';
  retry_count: number;
  last_error: string | null;
}

export type AppMode = 'deployment' | 'guided' | 'adhoc';
