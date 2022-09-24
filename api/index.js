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

    // from this point on the identity is required
    const identityRequired = async (req, res, next) => {
        
        if(req.cookies.identityId && uuidIsValid(req.cookies.identityId)){
            let identityId = req.cookies.identityId;
            
            req.identityId = identityId;
            next();
        }
        else{
            throw new Error("No auth provided; Get an identity");
        }
    }
    app.use(identityRequired);

    const generateRoomId = (length) => {
        return uuid().replace('-', '').slice(0, length);
    }

    const getUniqueRoomId = async () => {
        let lengths = [4,5,6,7,8,9,10,11,12];
        for(let length of lengths){
            let id = generateRoomId(length);
            let existsAlready = await redisClient.get(`room_${id}_claim`);
            if(!existsAlready){
                return id;
            }
        }
        throw new Error("Unique roomspace is completely jammed up, what the hell");
    }

    const getAndClaimRoomId = async ({counter = 0}={}) => {
        if(counter > 10){
            throw new Error("CRITICAL CLAIM ERROR");
        }
        let roomId = await getUniqueRoomId();
        let noncyDrew = uuid();
        await redisClient.set(`room_${roomId}_claim`, noncyDrew, 'EX', 86400);
        let roomOwner = await redisClient.get(`room_${roomId}_claim`);
        if(roomOwner === noncyDrew){
            return roomId;
        } 
        else{
            console.error("Claim lock failure! Wow, I thought these would be unlikely!");
            return getAndClaimRoomId({counter: counter + 1});
        }
    }

    app.post('/api/room', async(req, res)=>{
        let roomType = req.body.type;
        if(!['chat'].includes(roomType)){
            console.warn(`invalid roomType: ${roomType}`);
            throw new Error("that's not a valid room type chump");
        }
        
        let roomId = await getAndClaimRoomId(); 

        await redisClient.set(`room_${roomId}_type`, roomType, 'EX', 86400);

        res.json({
            roomId,
            initialState: {},
        })
    });

    let validateTimestamp = (timestamp) => {
        return true;
    }

    let validateRoomId = (roomId) => {
        return true;
    }

    app.get('/api/room/:roomId', async(req, res)=>{
        await validateRoomId(req.params.roomId);
        let stream = await redisClient.xrange(`room_${req.params.roomId}_stream`, '-', '+');
        res.status(200).send(stream)
    });

    const incrementTimestamp = (redisTimestamp) => {
        let [ts, i] = redisTimestamp.split("-");
        return `${ts}-${parseInt(i)+1}`
    }
    
    app.get('/api/room/:roomId/:timestamp', async(req, res)=>{
        await validateTimestamp(req.params.timestamp);
        await validateRoomId(req.params.roomId);
        let incrementStamp = incrementTimestamp(req.params.timestamp);
        let stream = await redisClient.xrange(`room_${req.params.roomId}_stream`, incrementStamp, '+');
        res.status(200).send(stream)
    });

    let validateEvent = async ({event, roomId}) => {
        return true;
    }

    app.post('/api/room/:roomId', async(req, res)=>{
        await validateRoomId(req.params.roomId);
        await validateEvent({event: req.body, roomId: req.params.roomId});

        let event = req.body;
        let id;
        if(event.id){
            id = event.id;
            delete event.id;
        }
        else{
            id = uuid();
        }

        await redisClient.xadd(`room_${req.params.roomId}_stream`, '*', id, JSON.stringify(event));
        await redisClient.expire(`room_${req.params.roomId}_stream`, 86400); 
        res.json({ok: 'ok'});
    });


    app.use((req, res, next) => {
        // fallthrough, default 404
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

