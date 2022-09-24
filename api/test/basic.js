const assert = require('assert');
const { json } = require('body-parser');
const fetch = require('node-fetch');

let endpoint = `http://localhost:60000`

describe('Hello', function () {
    it('it should say hello to the world', async function () {
        const response = await fetch(`${endpoint}/api`);
        assert(response.ok);
        assert.strictEqual(response.status, 200);
        const data = await response.json();
        assert(data.hello, "world");
    });

    it('it should allow me to create a new identity', async function (){
        const response = await fetch(`${endpoint}/api/identity`);
        assert(response.ok);
        const data = await response.json();
        assert(data.identityId);
        assert(data.name);
    });

    it('it should allow me to use that identity with a cookie', async function (){
        let response = await fetch(`${endpoint}/api/identity`);
        assert(response.ok);
        let data = await response.json();
        assert(data.identityId);

        response = await fetch(`${endpoint}/api/identity`, {
            headers: {
                Cookie: `identityId=${data.identityId}`,
            },
        })
        
        let newdata = await response.json();
        assert.strictEqual(data.identityId, newdata.identityId);
    });

    const getIdentity = async () => {
        let response = await fetch(`${endpoint}/api/identity`);
        assert(response.ok);
        let data = await response.json();
        assert(data.identityId);

        return data;
    }

    const authHeaders = async (identity) => {
        if(identity == null){
            identity = await getIdentity();
        }
        return {
            Cookie: `identityId=${identity.identityId}`
        }
    }

    it('it should allow me to create a room', async function() {
        let auth = await authHeaders();

        let response = await fetch(`${endpoint}/api/room`, { 
            method: 'POST',
            body: JSON.stringify({
                type: 'chat'
            }),
            headers: {
                'Content-Type': 'application/json',
                ...auth, 
            },
        });
        assert(response.ok);
        
        let data = await response.json();
        assert(data.roomId);
        assert(data.initialState);
    });

    const createRoom = async(auth)=>{
        let response = await fetch(`${endpoint}/api/room`, { 
            method: 'POST',
            body: JSON.stringify({
                type: 'chat'
            }),
            headers: {
                'Content-Type': 'application/json',
                ...auth, 
            },
        });
        assert(response.ok);
        
        let data = await response.json();
        assert(data.roomId);
        assert(data.roomId.length >= 4);
        assert(data.roomId.length <= 10);
        assert(data.initialState);
        return data;
    }
    
    it('it should allow me to post data to a room', async function() {
        let auth = await authHeaders();
        let room = await createRoom(auth);

        let response = await fetch(`${endpoint}/api/room/${room.roomId}`, { 
            method: 'POST',
            body: JSON.stringify({
                arbitrary: "whatever"
            }),
            headers: {
                'Content-Type': 'application/json',
                ...auth, 
            },
        });
        assert(response.ok);
    });
    
    const postToRoom = async ({auth, room, data})=> {
        let response = await fetch(`${endpoint}/api/room/${room.roomId}`, { 
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                ...auth, 
            },
        });
        assert(response.ok);
    }
    const dumpStream = (streamData) => {
        let stringBuilder = [];
        streamData.forEach(([timestamp, [id, data]]) => {
            stringBuilder.push(`${timestamp}: ${id.slice(0,4)} - ${data}`);
        })
        console.warn(stringBuilder.join("\n"));
    }
    it('it should allow me to read data from a room', async function() {
        let auth = await authHeaders();
        let room = await createRoom(auth);
        await postToRoom({auth, room, data: {
            arbitrary: "whatever",
        }})
        await postToRoom({auth, room, data: {
            toots: "mcgoots",
        }})
        await postToRoom({auth, room, data: {
            totes: "mcgoats",
        }})

        // get all of the data from a room
        let response = await fetch(`${endpoint}/api/room/${room.roomId}`, { 
            headers: {
                'Content-Type': 'application/json',
                ...auth, 
            },
        });
        assert(response.ok);
        let streamData = await response.json();
        
        let streamedObjects = [];
        let firstTimestamp, lastTimestamp;
        streamData.forEach(([timestamp, [id, data]]) => {
            lastTimestamp = timestamp;
            if(firstTimestamp == null){ firstTimestamp = timestamp; }

            streamedObjects.push(JSON.parse(data));
        })
        assert(streamedObjects[0].arbitrary == "whatever");
        assert(streamedObjects[1].toots == "mcgoots");
        assert(streamedObjects[2].totes == "mcgoats");
        
        // get all of the data from a room
        response = await fetch(`${endpoint}/api/room/${room.roomId}/${lastTimestamp}`, { 
            headers: {
                'Content-Type': 'application/json',
                ...auth, 
            },
        });
        assert(response.ok);
        streamData = await response.json();
        assert(streamData.length === 0);
        
        // get all of the data from a room
        response = await fetch(`${endpoint}/api/room/${room.roomId}/${firstTimestamp}`, { 
            headers: {
                'Content-Type': 'application/json',
                ...auth, 
            },
        });
        assert(response.ok);
        streamData = await response.json();
        assert(streamData.length === 2);
    });
});
