-- Cell Groups Phase 2: Enhanced Meeting-Based Attendance System
-- This migration enhances the existing cell_meeting and meeting_attendance tables

-- ============================================
-- STEP 1: Enhance cell_meeting table
-- ============================================

-- Add new columns to cell_meeting for richer meeting context
ALTER TABLE public.cell_meeting
  ADD COLUMN IF NOT EXISTS topic varchar(255),
  ADD COLUMN IF NOT EXISTS scripture_reference varchar(100),
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS end_time time,
  ADD COLUMN IF NOT EXISTS offering_amount decimal(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS offering_notes varchar(255),
  ADD COLUMN IF NOT EXISTS cancelled_reason varchar(255);

-- ============================================
-- STEP 2: Enhance meeting_attendance table
-- ============================================

-- Update the status constraint to include LATE and EXCUSED
ALTER TABLE public.meeting_attendance
  DROP CONSTRAINT IF EXISTS meeting_attendance_status_check;

ALTER TABLE public.meeting_attendance
  ADD CONSTRAINT meeting_attendance_status_check
  CHECK (status IN ('UNKNOWN', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'));

-- Add new columns for enhanced attendance tracking
ALTER TABLE public.meeting_attendance
  ADD COLUMN IF NOT EXISTS is_first_time boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS brought_visitor boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS visitor_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes varchar(255);

-- ============================================
-- STEP 3: Create cell_group_visitors table (optional)
-- ============================================

CREATE TABLE IF NOT EXISTS public.cell_group_visitor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.church(id) ON DELETE CASCADE,
  meeting_id uuid NOT NULL REFERENCES public.cell_meeting(id) ON DELETE CASCADE,

  -- Visitor Info
  name varchar(100) NOT NULL,
  phone varchar(20),
  email varchar(255),

  -- Follow-up tracking
  invited_by uuid REFERENCES public.member(id),
  follow_up_status text NOT NULL CHECK (follow_up_status IN ('PENDING', 'CONTACTED', 'CONVERTED', 'DECLINED')) DEFAULT 'PENDING',
  follow_up_notes text,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cell_group_visitor_meeting_idx ON public.cell_group_visitor(meeting_id);
CREATE INDEX IF NOT EXISTS cell_group_visitor_church_idx ON public.cell_group_visitor(church_id);

-- ============================================
-- STEP 4: Add helpful views for dashboard stats
-- ============================================

-- View for meeting attendance summary
CREATE OR REPLACE VIEW public.cell_meeting_attendance_summary AS
SELECT
  m.id as meeting_id,
  m.church_id,
  m.group_id,
  m.meeting_date,
  m.status as meeting_status,
  m.topic,
  COUNT(a.id) as total_members,
  COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as present_count,
  COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as absent_count,
  COUNT(CASE WHEN a.status = 'LATE' THEN 1 END) as late_count,
  COUNT(CASE WHEN a.status = 'EXCUSED' THEN 1 END) as excused_count,
  COUNT(CASE WHEN a.status = 'UNKNOWN' THEN 1 END) as unknown_count,
  COALESCE(m.visitor_count, 0) as visitor_count
FROM public.cell_meeting m
LEFT JOIN public.meeting_attendance a ON a.meeting_id = m.id
GROUP BY m.id, m.church_id, m.group_id, m.meeting_date, m.status, m.topic;

-- ============================================
-- COMMENTS for documentation
-- ============================================

COMMENT ON COLUMN public.cell_meeting.topic IS 'The topic or theme of the meeting (e.g., "The Parable of the Sower")';
COMMENT ON COLUMN public.cell_meeting.scripture_reference IS 'Scripture reference for the meeting (e.g., "Matthew 13:1-23")';
COMMENT ON COLUMN public.cell_meeting.start_time IS 'When the meeting started';
COMMENT ON COLUMN public.cell_meeting.end_time IS 'When the meeting ended';
COMMENT ON COLUMN public.cell_meeting.offering_amount IS 'Total offering collected during the meeting';
COMMENT ON COLUMN public.cell_meeting.offering_notes IS 'Notes about the offering';
COMMENT ON COLUMN public.cell_meeting.cancelled_reason IS 'Reason for cancellation if status is CANCELLED';

COMMENT ON COLUMN public.meeting_attendance.is_first_time IS 'Whether this is the member''s first time attending this cell group';
COMMENT ON COLUMN public.meeting_attendance.brought_visitor IS 'Whether the member brought a visitor to this meeting';
COMMENT ON COLUMN public.meeting_attendance.visitor_count IS 'Number of visitors brought by this member';
COMMENT ON COLUMN public.meeting_attendance.notes IS 'Notes about the attendance (e.g., "Shared testimony", "Requested prayer")';

COMMENT ON TABLE public.cell_group_visitor IS 'Tracks visitors (non-members) who attend cell group meetings';
