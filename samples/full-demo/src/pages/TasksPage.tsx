
import TaskMonitor from '../components/TaskMonitor';

function TasksPage() {
  return (

    <main className="flex-1 flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="h-full max-w-6xl">
        <TaskMonitor />
      </div>
    </main>
  );
}

export default TasksPage;