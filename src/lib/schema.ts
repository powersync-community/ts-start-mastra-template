import { column, Schema, Table } from '@powersync/web'

const messages = new Table({
  role: column.text,
  content: column.text,
  conversation_id: column.text,
  created_at: column.text,
})

export const AppSchema = new Schema({ messages })
export type Database = (typeof AppSchema)['types']
export type Message = Database['messages']
