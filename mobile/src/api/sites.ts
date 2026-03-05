import {apiClient} from './client';
import type {ActiveUpload, Site, SkipReason, Unit} from '../types';

export const getSites = () => apiClient.get<Site[]>('/technician/sites').then(r => r.data);

export const getActiveUpload = (siteId: string) =>
  apiClient.get<ActiveUpload>(`/site/${siteId}/active-upload`).then(r => r.data);

export const getUnits = (uploadId: string) =>
  apiClient.get<Unit[]>(`/upload/${uploadId}/units`).then(r => r.data);

export const getSkipReasons = () =>
  apiClient.get<SkipReason[]>('/admin/skip-reasons-public').then(r => r.data);

export const submitAssignment = (uploadId: string, payload: {
  site_id: string;
  unit_id: string;
  dev_eui_raw: string;
  timestamp_local: string;
}) => apiClient.post(`/upload/${uploadId}/assign`, payload);

export const submitSkip = (uploadId: string, payload: {
  site_id: string;
  unit_id: string;
  reason_id?: string;
}) => apiClient.post(`/upload/${uploadId}/skip`, payload);

export const submitValidation = (payload: {
  site_id: string;
  dev_eui_normalized: string;
}) => apiClient.post('/validation', payload).then(r => r.data);
