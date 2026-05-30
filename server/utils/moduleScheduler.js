import LearningModule from '../models/LearningModule.js';

export function startModuleScheduler() {
  console.log('⏰ AI Learning Module Scheduler initialized.');

  // Run a check every hour
  setInterval(async () => {
    try {
      const now = new Date();
      // Find active learning modules that haven't been completed yet
      const activeModules = await LearningModule.find({ status: 'active' });

      for (const module of activeModules) {
        let allCompletedForEveryone = true;

        for (const progressItem of module.progress) {
          // If a member has completed fewer quizzes than the total count, the module is not completed for them
          if (progressItem.completedQuizzes.length < module.totalQuizzes) {
            allCompletedForEveryone = false;
            break;
          }
        }

        // If everyone has completed all quizzes, mark the module as completed
        if (allCompletedForEveryone && module.progress.length > 0) {
          module.status = 'completed';
          await module.save();
          console.log(`🎉 Learning Module "${module.title}" has been completed by all members!`);
        }
      }
    } catch (error) {
      console.error('❌ Error in Learning Module Scheduler:', error);
    }
  }, 60 * 60 * 1000); // 1 hour
}
