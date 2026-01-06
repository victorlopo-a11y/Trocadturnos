import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyixhyugrcyapwvqfyet.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5aXhoeXVncmN5YXB3dnFmeWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMDIwNjYsImV4cCI6MjA3OTY3ODA2Nn0.Cm9YmysjXaEX14yqPPbpGBVquFqpVnd-9M_DZg9kyI0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
