#!/usr/bin/env node
const token = process.env.SLACK_BOT_TOKEN;
const channel = process.env.SLACK_CHANNEL_ID;
const request = require('request');
const util = require('util');
const chalk = require('chalk');
const $ = require('cheerio');
const { WebClient } = require('@slack/web-api');

const portals = require('./portals.js');
const web = new WebClient(token);
let hashData = {};

const init = async (val) => {
    let options = {};
    options.channel = channel;
    if(val) options.cursor = val;
    await web.conversations.history({channel}).then(data => {
        data.messages.forEach(el => {
            let found = !el.attachments || el.attachments == null ? undefined : el.attachments.find(x => !x.fields || x.fields == null ? undefined : x.fields.find(y => y.title == "Portal name"));
            if(found) {
                let id = parseInt(found.fields.find(x => x.title == "ID").value);
                let portalName = found.fields.find(x => x.title == "Portal name").value;
                if(portalName[0] == '<' && portalName[portalName.length-1] == '>' && portalName.split('|').length > 1) {
                    let tmp = portalName.split('|');
                    tmp.splice(0, 1);
                    tmp = tmp.join('|');
                    portalName = tmp.substring(0, tmp.length-1);
                }
                if(!hashData.hasOwnProperty(portalName) || hashData[portalName] < id) hashData[portalName] = id;
            }
        })
        if(data.has_more) init(data.response_metadata.next_cursor);
    })
}


const callAPI = (URL) => {
    return new Promise((resolve, reject) => request.get(URL, {json: true}, (err, res, body) => {
        if(err) reject(err);
        else resolve(body);
    }));
}

const sendNormalized = async (from, data) => {
    data.sort((a,b) => b.id - a.id);
    for(let i = 0; i < data.length; ++i) {
        let el = data[i];
        let attachments = [];
        attachments.push({
            title: el.name,
            author_name: el.location.text,
            fields: [
                {
                    title: "Price",
                    value: el.price
                },
                {
                    title: "URL",
                    value: el.url
                },
                {
                    title: "ID",
                    value: el.id,
                    short: true
                },
                {
                    title: "Portal name",
                    value: from,
                    short: true
                }
            ],
            image_url: el.img_url,
            color: "#C9B1FF"
        });
        attachments.push({
            title: "Description",
            text: el.msg,
            color: "#FFCAF2"
        });
        var table = Object.keys(el.table).map(key => { return {
            title: key,
            value: el.table[key]
        }});
        if(table.length != 0) {
            attachments.push({
                title: "Parameters",
                fields: table,
                color: "#FFB2B1"
            });
        }
        await web.chat.postMessage({
            channel,
            attachments,
            text: ":tada::tada::tada:",
            icon_emoji: ":bed:",
            as_user: false,
            username: "realitky-notify"
        });
    }
}

const loop = () => portals.forEach(async val => {
    process.stdout.write(util.format('%s: ',val.name));
    await callAPI(val.url).then(async (body) => {
            let maxVal = 0;
            let data = [];
            body.forEach(el => {
                let keyValue = val.keyValue(el);
                if(maxVal < keyValue) maxVal = keyValue;
                if(hashData.hasOwnProperty(val.name) && keyValue <= hashData[val.name]) return;
                data.push(el);
            });
            hashData[val.name] = maxVal;
            data = await val.transform(data); // normalized data
            sendNormalized(val.name, data);
    }).catch(err => console.error(err));
    process.stdout.write(util.format('%s\n', chalk.green('OK')));
});

init().then(loop).then(() => setInterval(loop, 30000));

