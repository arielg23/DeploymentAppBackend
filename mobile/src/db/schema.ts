import {appSchema, tableSchema} from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'queued_assignments',
      columns: [
        {name: 'upload_id', type: 'string'},
        {name: 'site_id', type: 'string'},
        {name: 'unit_id', type: 'string'},
        {name: 'dev_eui_raw', type: 'string'},
        {name: 'dev_eui_normalized', type: 'string'},
        {name: 'timestamp_local', type: 'string'},
        {name: 'status', type: 'string'},
        {name: 'retry_count', type: 'number'},
        {name: 'last_error', type: 'string', isOptional: true},
        {name: 'created_at', type: 'number'},
      ],
    }),
    tableSchema({
      name: 'queued_skips',
      columns: [
        {name: 'upload_id', type: 'string'},
        {name: 'site_id', type: 'string'},
        {name: 'unit_id', type: 'string'},
        {name: 'reason_id', type: 'string', isOptional: true},
        {name: 'timestamp_local', type: 'string'},
        {name: 'status', type: 'string'},
        {name: 'retry_count', type: 'number'},
        {name: 'created_at', type: 'number'},
      ],
    }),
  ],
});
