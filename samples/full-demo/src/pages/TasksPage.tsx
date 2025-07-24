
import TaskMonitor from '../components/TaskMonitor';

function TasksPage() {
  return (
    <div className="h-full bg-gray-900 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Tasks</h1>
          <p className="text-gray-400">
            Monitor and manage your running tasks and workflows.
          </p>
        </div>
        
        <TaskMonitor />
      </div>
    </div>
  );
}

export default TasksPage;