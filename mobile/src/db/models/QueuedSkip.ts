import {Model} from '@nozbe/watermelondb';
import {field, text, date} from '@nozbe/watermelondb/decorators';

export default class QueuedSkip extends Model {
  static table = 'queued_skips';

  @text('upload_id') uploadId!: string;
  @text('site_id') siteId!: string;
  @text('unit_id') unitId!: string;
  @text('reason_id') reasonId!: string | null;
  @text('timestamp_local') timestampLocal!: string;
  @text('status') status!: string;
  @field('retry_count') retryCount!: number;
  @date('created_at') createdAt!: Date;
}
