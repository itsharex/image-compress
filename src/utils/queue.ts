// 实现一个简单的任务队列，支持添加任务，执行任务，任务执行完自动从队列中移除，并继续执行下一个任务

// 最大并发数
const maxConcurrent = navigator.hardwareConcurrency * 2;
class TaskQueue {
    private tasks: (() => Promise<void>)[] = [];
    private runningCount: number = 0;

    public addTask(task: () => Promise<void>): void {
        this.tasks.push(task);
    }

    private async runTask(task: () => Promise<void>, finishCb: VoidFunction): Promise<void> {
        this.runningCount++;
        try {
            await task();
        } finally {
            this.runningCount--;
        }
        if (this.tasks.length) {
          const nextTask = this.tasks.shift();
          if (nextTask) {
            this.runTask(nextTask, finishCb);
          }
        } else if (this.runningCount === 0) {
          finishCb();
        }
    }

    public async run(cb: VoidFunction): Promise<void> {
        if (!this.tasks.length) {
            return;
        }
        const tasksToRun = this.tasks.splice(0, maxConcurrent);
        tasksToRun.forEach(task => this.runTask(task, cb))
    }
}

export default TaskQueue;
