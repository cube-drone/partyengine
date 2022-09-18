console.log('Party Engine Engaged...');

// DEPS
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const cors = require('cors');
const DateTime = require('luxon');
const blocked = require('blocked');
const compression = require('compression');
const uuid = require('crypto').randomUUID;
const testytesterson = require('testytesterson');

// REDIS
const Redis = require('ioredis');

// PROM
const prometheus = require('prom-client');

console.log('Loading config...');
const config = require('./config');
const {
    nodeEnv,
    nodeType,
    nodeName,
    port,
    redisUrl,
    cookieSecret,
    build,
    deployColor,
    discordWebhook,
    ciEnabled,
} = config;

const app = express();

async function main(){

    console.warn("WELCOME TO THE PARTY ENGINE");

    console.log(`Setting up prometheus metrics`);
    const collectDefaultMetrics = prometheus.collectDefaultMetrics;
    collectDefaultMetrics({
        labels: { COLOR: deployColor, NODE_NAME: nodeName, NODE_TYPE: nodeType },
    });
    const promMetrics = {};
    promMetrics.roomCounter = new prometheus.Counter({
        name: 'roomCounter',
        help: 'theNumberOfRoomsThereCurrentlyAre',
    });

    console.log("Setting up redis...");
    let redisClient = new Redis(redisUrl);
    
    let services = {
        redisClient,
        promMetrics,
    }

    let consolelog = console.log;
    let consolewarn = console.warn;
    let consoleerror = console.error;
    let standardLogLine = () => {
        return `${nodeName}-${nodeType}`;
    }
    console.log = (...log) => {
        consolelog(standardLogLine(), ...log);
    }
    console.warn = (...log) => {
        consolewarn(standardLogLine(), ...log);
    }
    console.error = (...log) => {
        consoleerror(standardLogLine(), ...log);
    }

    app.use(compression());

    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }));

    // parse application/json
    app.use(bodyParser.json());

    // cookies please
    app.use(cookieParser(cookieSecret));
    app.use(cors({
        "credentials": true,
    }));

    // METRICS & DEPLOYMENT
    console.log("Setting up /metrics endpoint...");
    app.get('/api/metrics', async (req, res) => {
        res.send(await prometheus.register.metrics());
    })
    
    // securiby
    app.disable('x-powered-by');

    console.log("Setting up routes...");

    // ROUTES
    app.get('/api/', async (req, res)=>{
        let counter = await redisClient.incrby('fun', 1);

        return res.json({
            'hello': 'world',
            nodeEnv,
            nodeType,
            nodeName,
            build,
            deployColor,
            counter,
        })
    });

    const uuidIsValid = (uuid) => {
        return true;
    }

    app.get('/api/identity', async(req, res)=> {
        // if you already have an identity, return that

        // if you don't already have an identity, create one
        let identityId;
        if(req.cookies.identityId && uuidIsValid(req.cookies.identityId)){
            identityId = req.cookies.identityId;
        }
        else{
            identityId = uuid();
        }
        
        let name = await redisClient.get(`identity_${identityId}_name`);
        if(!name){
            name = testytesterson.name();
        }
        await redisClient.set(`identity_${identityId}_name`, name, 'EX', 86400);
        
        let iconUrl = await redisClient.get(`identity_${identityId}_icon`);
        if(!iconUrl){
            iconUrl = testytesterson.imageUrl(64, name);
        }

        res.cookie('identityId', identityId, { maxAge: 900000, httpOnly: true })

        res.json({
            identityId,
            name,
            iconUrl,
        });
    });

    app.post('/api/identity', async(req, res)=>{
        // if the user posts an identity, that's theirs now, they've claimed it
        if(req.body.identityId && uuidIsValid(req.body.identityId)){
            res.cookie('identityId', req.body.identityId, { maxAge: 900000, httpOnly: true })
        }

        res.redirect('/api/identity');
    });

    app.delete('/api/identity', async(req, res)=>{
        res.clearCookie('identityId');

        res.json({
            "ok": "ok"
        })
    });

    app.use((req, res, next) => {
        res.status(404).json({
            error: "not found",
        })
    })

    let httpServer = require('http').createServer(app);

    blocked((ms)=>{
        console.error(`Event loop blocked for ${ms}ms!`);
    }, {threshold:20, interval: 1000})

    // GET THIS PARTY STARTED
    httpServer.listen(port, async function() {
        console.log(`Node ${nodeType}-${nodeName} running on port ${port}`);
    });
}

// fire ze cannons!
process.on('unhandledRejection', (reason, promise)=>{
    console.error('CRITICAL UNHANDLED REJECTION', reason, promise);
    process.exit(1);
});

process.on('uncaughtException', (err, origin)=>{
    console.error('CRITICAL UNCAUGHT EXCEPTION', err, origin);
    process.exit(1);
});

main().then(()=>{
    console.log("Setup complete!");
}).catch((err)=>{
    console.error("ERROR: Critical, unrecoverable error!", err);
})

