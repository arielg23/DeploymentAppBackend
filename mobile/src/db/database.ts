import {Database} from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import {schema} from './schema';
import QueuedAssignment from './models/QueuedAssignment';
import QueuedSkip from './models/QueuedSkip';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'smartlock',
  jsi: true,
  migrationEvents: {
    onSuccess: () => console.log('DB migrations ran'),
    onError: e => console.error('DB migration error', e),
  },
});

export const database = new Database({
  adapter,
  modelClasses: [QueuedAssignment, QueuedSkip],
});
