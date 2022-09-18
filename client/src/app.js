console.log("Starting up app.js!");
console.log(`ENVIRONMENT:`, ENVIRONMENT);
console.log(`API_ENDPOINT:`, API_ENDPOINT);

import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from "react-router-dom";

import Startup from './components/startup/Startup';

const IMAGINARY_LOAD_TIME_MS = ENVIRONMENT === 'production' ? 0 : 1000;

async function main(){
    console.log(window.location);
    if(`${window.location}`.startsWith("http://localhost")){
        window.location = "http://groovelet.local:60000/home/";
    }

    ReactDOM.render(
        <React.StrictMode>
            <HashRouter>
                <Startup />
            </HashRouter>
        </React.StrictMode>,
        document.body
    )
}

setTimeout(main, IMAGINARY_LOAD_TIME_MS);