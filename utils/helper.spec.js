const axios = require('axios');
import { expect } from '@playwright/test';
import { monitorEventLoopDelay } from 'node:perf_hooks';

let apiUrl

export async function authenticateUser(username, password, { request }) {
    const apiUrl = await getApiBaseUrl();
    const headers = {
        'Content-Type': 'application/json',
    };

    const requestBody = {
        email: username,
        password: password,
    };

    const response = await request.post(`${apiUrl}/users/login`, {
        data: requestBody,
        headers,
    });
    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    const token = responseBody.token;
    return token;
}
export async function getApiBaseUrl(){
    apiUrl = process.env.API_BASE_URL;
    if(!apiUrl){
        apiUrl = "https://thinking-tester-contact-list.herokuapp.com";
    }
    return apiUrl;
}
export async function createEntity(userData, accessToken, module, { request }) {
    const apiUrl = await getApiBaseUrl();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'authorization': `Bearer ${accessToken}`,
    };

    const response = await request.post(apiUrl + module, {
        headers,
        data: JSON.stringify(userData),
    });

    const responseBody = await response.json();
    const statusCode = response.status();
    expect(statusCode).toBe(201);
    if(responseBody && responseBody._id){
        return responseBody._id;
    }else{
        return null;
    }
}

export async function addContact(contactData, accessToken, { request }) {
    const apiUrl = await getApiBaseUrl();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
    };

    const response = await request.post(`${apiUrl}/contacts`, {
        data: contactData,
        headers,
    });
    expect(response.status()).toBe(201);
    const responseBody = await response.json();
    return responseBody;
}

export async function deleteEntity(entityId, accessToken, module, { request }) {
        const apiUrl = await getApiBaseUrl();
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'authorization': "Bearer " + accessToken,
        };
        const response = await request.delete(`${apiUrl}${module}/${entityId}`, {
            headers,
        });
        const statusCode = response.status();
        expect(statusCode).toBe(200);
    }
    export async function validateEntity(accessToken, module, status, { request }) {
        const apiUrl = await getApiBaseUrl();
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'authorization': "Bearer " + accessToken,

        };
        const response = await request.get(apiUrl + module, {
            headers,
        });
        const statusCode = response.status();
        expect (statusCode).toBe(parseInt(status));     
    }    

   export async function getEntity(accessToken, module, status, { request }) {
    const apiUrl = await getApiBaseUrl();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'authorization': "Bearer " + accessToken,
    };
    const response = await request.get(apiUrl + module, {
        headers,
    });
    const statusCode = response.status();
    expect(statusCode).toBe(parseInt(status));
    const responseBody = await response.json();
    if (responseBody && responseBody[0] && responseBody[0]._id) {
        return responseBody[0]._id;
    } else {
        return null;
    }
}