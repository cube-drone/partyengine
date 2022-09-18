import delay from 'delay';

let failureCount = 0;

async function _get(endpoint){
    console.log(`GET /api/${endpoint}`);
    let resp = await fetch(`${API_ENDPOINT}/${endpoint}`, {
        method: "GET",
        credentials: 'include',
        headers: {
            'Content-Type': "application/json"
        },
    })

    console.log(resp);
    if(resp.status.toString() !== "200"){
        throw new Error(`${resp.status} - ${resp.statusText}`)
    }
    let respJson = await resp.json();
    console.log(`GET /api/${endpoint}`, resp.status, respJson);
    if(respJson.error != null){
        console.error(respJson.error);
        throw new Error(respJson.error);
    }
    else{
        return respJson;
    }
}

export async function get(endpoint){
    try{
        let returnval = await _get(endpoint);
        failureCount = 0;

        return returnval;
    }
    catch(err){
        failureCount += 1;
        if(failureCount > 5){
            console.error("Seems like we might be disconnected.")
            window.location = "/home/";
        }
        console.warn("Retrying ", endpoint);
        await delay(Math.floor(Math.random() * 1500));

        return _get(endpoint);
    }
}

export async function put(endpoint, body){
    console.log(`PUT /api/${endpoint}`);
    let resp = await fetch(`${API_ENDPOINT}/${endpoint}`, {
        method: "PUT",
        credentials: 'include',
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify(body),
    })

    let respJson = await resp.json();
    console.log(`PUT /api/${endpoint}`, resp.status, respJson);
    if(respJson.error != null){
        console.error(respJson.error);
        throw new Error(`ERROR FROM SERVER: ${respJson.error}`);
    }
    else{
        return respJson;
    }
}

export async function post(endpoint, body){
    console.log(`POST /api/${endpoint}`);
    let resp = await fetch(`${API_ENDPOINT}/${endpoint}`, {
        method: "POST",
        credentials: 'include',
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify(body),
    })

    let respJson = await resp.json();
    console.log(`POST /api/${endpoint}`, resp.status, respJson);
    if(respJson.error != null){
        console.error(respJson.error);
        throw new Error(respJson.error);
    }
    else{
        return respJson;
    }
}

export async function del(endpoint, body){
    console.log(`DELETE /api/${endpoint}`);
    let resp = await fetch(`${API_ENDPOINT}/${endpoint}`, {
        method: "DELETE",
        credentials: 'include',
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify(body),
    })

    let respJson = await resp.json();
    console.log(`DELETE /api/${endpoint}`, resp.status, respJson);
    if(respJson.error != null){
        console.error(respJson.error);
        throw new Error(respJson.error);
    }
    else{
        return respJson;
    }
}
