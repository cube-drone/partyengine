let { task, desc } = require('jake');
let { run, pipe, runBg } = require('./automations/run');
let fs = require('fs');
let delay = require('delay');


desc('List all of the stuff that jake can do.');
task('default', async function () {
    await run(`jake -t`);
});

const install = async() => {
    await run(`cd api && npm install`);
    await run(`cd client && npm install`);
}

desc('Make sure that we\'re ready to roll');
task('install', install);

desc('Start running the dev client');
task('start', async function () {
    await run(`docker compose up -d`);
    let runlist = [];
    let env = {
        NODE_TYPE: "api", 
        PORT: 43001, 
        REDIS_URL: 'redis://localhost:41001'
    };
    runlist.push(runBg(`cd api && node index.js`, env));
    runlist.push(runBg(`cd client && webpack serve`));
    let subprocesses = await Promise.all(runlist);
    
    process.on('SIGINT', function() {
        console.log("Caught interrupt signal");
    
        subprocesses.map(proc => proc.kill());
        process.exit(1);
    });

    while(true){
        console.log(":)");
        await delay(10000);
    }
});

desc('Clean up after yourself');
task('clean', async function(){
    await run(`docker compose down`);
})

desc('Run tests');
task('test', async function(specificSuite){
    let specificTest = '';
    if(specificSuite){
        specificTest = `./test/${specificSuite}`;
    }
    await run(`cd api && npx mocha ${specificTest} --recursive`);
})

desc('Run CI tests');
task('ci_test', async function(){
    await run(`docker-compose up -d`);
    let procs = [];
    procs.push(runBg(`cd api && node index.js`, env));
    await delay(8000);
    await run(`cd api && npx mocha`);

    procs.forEach(proc => {
        proc.kill();
    });

    // clean up after
    await run('docker-compose down')
})

desc('Find the stuff you said you would fix');
task('todo', async function(){
    await run(`rg TODO`);
});