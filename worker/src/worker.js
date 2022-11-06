// let throng = require('throng');
const throng = require('throng');
const Queue = require('bull');
const fs = require('fs');

// Connect to a local redis instance locally, and the Heroku-provided URL in production
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Spin up multiple processes to handle jobs to take advantage of more CPU cores
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
let workers = process.env.WEB_CONCURRENCY || 2;

// console.log({ workers });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function start(id) {
  // Connect to the named work queue
  const imageQueue = new Queue('files-processing', REDIS_URL);

  console.log(`Worker ${id} started`);

  imageQueue.process(async (job) => {
    let progress = 0;

    while (progress < 100) {
      await sleep(140);

      progress++;

      job.progress(progress);
    }

    done(null, { status: 'Completed' });
  });
}

// Initialize the clustered worker process
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
throng({ workers, start });
