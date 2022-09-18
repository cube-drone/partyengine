import {React, useState, useEffect} from 'react';
import {get, post, del} from '../../services/http';
import { css, jsx } from '@emotion/react';
import Application from "../application/Application";

export default () => {
    // check if I have a valid session - if so, move along to whatever is defined in the hash
    // otherwise, stay here and do a hashcash check;

    let [identity, setIdentity] = useState(null);
    let [error, setError] = useState(null);

    useEffect(async ()=>{
        console.log("Trying to get an identity!");

        try{
            let identityAlreadyExists = localStorage.getItem("identityId");
            let identity;
            if(identityAlreadyExists){
                identity = await post('identity', {identityId: identityAlreadyExists});
            }
            else{
                identity = await get('identity');
                localStorage.setItem("identityId", identity.identityId);
            }
            console.log(identity);
            setIdentity(identity);
        }
        catch(err){
            console.log("Oops, no session available.");
            if(err.message.indexOf("403") === -1 && err.message.indexOf("401") === -1){
                setError(err.message);
                return;
            }
            console.log(err.message);
            //console.error(err);
        }
    }, []);

    const clearIdentity = async () => {
        await del('identity');
        localStorage.clear();
        window.location = "/";
    }

    if(identity){
        return <div>
            <Application clearIdentity={clearIdentity} identity={identity} />
        </div>
    }
    if(error){
        return <div className="startup startup-error">Startup Error: {error}</div>
    }
    return <div className="startup startup-loading">
        Loading...
    </div>
}