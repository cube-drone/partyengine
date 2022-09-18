import {React, useState, useEffect} from 'react';
import {get, put, post} from '../../services/http';
import { css, jsx } from '@emotion/react';
import {Routes, Route, useNavigate, Link} from 'react-router-dom';
import Home from './Home';


export default ({clearIdentity, identity}) => {

    let navigate = useNavigate();

    const openRoom = (roomId) => {
        navigate(`/room/${roomId}`);
    }

    return <div css={css`

        .main{
            background-color: #EFEFEF;
            width: 600px;
            margin: 10px auto;
            padding: 10px;
            border: 2px solid black;
            border-radius: 10px;
        }

        .footer{
            background-color: #EFEFEF;
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 40px;
            border-top: 2px solid black;
        }
        
        .footer button{
            margin: 10px;
        }
    `}>
        <div className="main">
            <Routes>
                <Route path="/" element={<Home />}/>
            </Routes>
        </div>
        <div className="footer">
            {identity.identityId}:{identity.name}

            <button onClick={clearIdentity}> Leave Forever </button>
        </div>
    </div>

}
