-- =====================================================
-- Worker Tasks Table Schema
-- Manages individual worker task assignments and progress
-- =====================================================

-- Worker tasks table for task assignments and progress tracking
CREATE TABLE IF NOT EXISTS worker_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_title VARCHAR(200) NOT NULL,
    sub_tasks JSONB, -- JSON array of sub-tasks or text description
    assigned_to UUID NOT NULL REFERENCES workers(worker_id),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments for documentation
COMMENT ON TABLE worker_tasks IS 'Manages individual worker task assignments and progress';
COMMENT ON COLUMN worker_tasks.task_id IS 'Unique identifier for each task';
COMMENT ON COLUMN worker_tasks.task_title IS 'Task title/name';
COMMENT ON COLUMN worker_tasks.sub_tasks IS 'JSON array of sub-tasks or text description';
COMMENT ON COLUMN worker_tasks.assigned_to IS 'Worker ID assigned to this task';
COMMENT ON COLUMN worker_tasks.priority IS 'Task priority level (low, medium, high)';
COMMENT ON COLUMN worker_tasks.due_date_time IS 'Task due date and time';
COMMENT ON COLUMN worker_tasks.status IS 'Current task status (pending, in_progress, completed, overdue)';
COMMENT ON COLUMN worker_tasks.progress_percentage IS 'Task completion percentage (0-100)';
COMMENT ON COLUMN worker_tasks.created_at IS 'Timestamp when task was created';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_tasks_assigned_to ON worker_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_worker_tasks_status ON worker_tasks(status);
CREATE INDEX IF NOT EXISTS idx_worker_tasks_priority ON worker_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_worker_tasks_due_date ON worker_tasks(due_date_time);
CREATE INDEX IF NOT EXISTS idx_worker_tasks_progress ON worker_tasks(progress_percentage);

-- Row Level Security (RLS) policies
ALTER TABLE worker_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Business owners can view all tasks
CREATE POLICY worker_tasks_select_all ON worker_tasks
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can insert tasks
CREATE POLICY worker_tasks_insert_owner ON worker_tasks
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Business owners can update tasks
CREATE POLICY worker_tasks_update_owner ON worker_tasks
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Policy: Business owners can delete tasks
CREATE POLICY worker_tasks_delete_owner ON worker_tasks
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Function to automatically update overdue tasks
CREATE OR REPLACE FUNCTION update_overdue_tasks()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status to overdue if due date has passed and task is not completed
    IF NEW.due_date_time < CURRENT_TIMESTAMP AND NEW.status IN ('pending', 'in_progress') THEN
        NEW.status := 'overdue';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for overdue task updates
CREATE TRIGGER update_overdue_tasks_trigger
    BEFORE UPDATE ON worker_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_overdue_tasks();

-- Sample data for development
-- Note: These will need actual worker_id values from the workers table
-- INSERT INTO worker_tasks (task_title, sub_tasks, assigned_to, priority, due_date_time, status, progress_percentage) VALUES
-- ('Clean fish storage area', '["Sweep floor", "Sanitize surfaces", "Check temperature"]', 'worker-uuid-here', 'high', CURRENT_TIMESTAMP + INTERVAL '2 days', 'pending', 0),
-- ('Update inventory records', '["Count stock", "Update system", "Generate report"]', 'worker-uuid-here', 'medium', CURRENT_TIMESTAMP + INTERVAL '1 week', 'in_progress', 25);
