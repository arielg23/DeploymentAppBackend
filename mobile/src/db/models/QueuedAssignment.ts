import {Model} from '@nozbe/watermelondb';
import {field, text, date} from '@nozbe/watermelondb/decorators';

export default class QueuedAssignment extends Model {
  static table = 'queued_assignments';

  @text('upload_id') uploadId!: string;
  @text('site_id') siteId!: string;
  @text('unit_id') unitId!: string;
  @text('dev_eui_raw') devEuiRaw!: string;
  @text('dev_eui_normalized') devEuiNormalized!: string;
  @text('timestamp_local') timestampLocal!: string;
  @text('status') status!: string;
  @field('retry_count') retryCount!: number;
  @text('last_error') lastError!: string | null;
  @date('created_at') createdAt!: Date;
}
