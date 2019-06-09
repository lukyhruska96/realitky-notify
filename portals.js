const request = require('request');
const $ = require('cheerio');

/*
*   transform object format:
*   {
*       url: string - url of offer to then be able to reply
*       id: number
*       name: string - name of offer
*       img_url: string - url of image preview
*       msg: string - full description of offer
*       price: string
*       location: location_object
*       table: object - specific information per portal
*   }
*
*   location_object:
*   {
*       lat: number
*       lon: number
*       text: string - text description of location
*   }
*/

module.exports = [
    {
        name: "BezRealitky.cz",
        url: "https://www.bezrealitky.cz/api/record/markers?offerType=pronajem&estateType=byt&priceTo=11%20000&boundary=%5B%5B%7B%22lat%22%3A50.171436864513%2C%22lng%22%3A14.506905276796942%7D%2C%7B%22lat%22%3A50.154133576294%2C%22lng%22%3A14.599004629591036%7D%2C%7B%22lat%22%3A50.14524430128%2C%22lng%22%3A14.58773054712799%7D%2C%7B%22lat%22%3A50.129307131988%2C%22lng%22%3A14.60087568578706%7D%2C%7B%22lat%22%3A50.122604734575%2C%22lng%22%3A14.659116306376973%7D%2C%7B%22lat%22%3A50.106512499343%2C%22lng%22%3A14.657434650206028%7D%2C%7B%22lat%22%3A50.090685542974%2C%22lng%22%3A14.705099547441932%7D%2C%7B%22lat%22%3A50.072175921973%2C%22lng%22%3A14.700004206235008%7D%2C%7B%22lat%22%3A50.056898491904%2C%22lng%22%3A14.640206899053055%7D%2C%7B%22lat%22%3A50.038528576841%2C%22lng%22%3A14.666852728301023%7D%2C%7B%22lat%22%3A50.030955909657%2C%22lng%22%3A14.656128752460972%7D%2C%7B%22lat%22%3A50.013435368522%2C%22lng%22%3A14.66854956530301%7D%2C%7B%22lat%22%3A49.99444182116%2C%22lng%22%3A14.640153080292066%7D%2C%7B%22lat%22%3A50.010839032542%2C%22lng%22%3A14.527474219359988%7D%2C%7B%22lat%22%3A49.970771602447%2C%22lng%22%3A14.46224174052395%7D%2C%7B%22lat%22%3A49.970669964027%2C%22lng%22%3A14.400648545303966%7D%2C%7B%22lat%22%3A49.941901176098%2C%22lng%22%3A14.395563234671044%7D%2C%7B%22lat%22%3A49.948384148423%2C%22lng%22%3A14.337635637038034%7D%2C%7B%22lat%22%3A49.958376114735%2C%22lng%22%3A14.324977842107955%7D%2C%7B%22lat%22%3A49.9676286223%2C%22lng%22%3A14.34491711110104%7D%2C%7B%22lat%22%3A49.971859099005%2C%22lng%22%3A14.326815050839059%7D%2C%7B%22lat%22%3A49.990608728081%2C%22lng%22%3A14.342731259186962%7D%2C%7B%22lat%22%3A50.002211140429%2C%22lng%22%3A14.29483886971002%7D%2C%7B%22lat%22%3A50.023596577558%2C%22lng%22%3A14.315872285282012%7D%2C%7B%22lat%22%3A50.058309376419%2C%22lng%22%3A14.248086830069042%7D%2C%7B%22lat%22%3A50.073179111%2C%22lng%22%3A14.290193274400963%7D%2C%7B%22lat%22%3A50.102973823639%2C%22lng%22%3A14.224439442359994%7D%2C%7B%22lat%22%3A50.130060800171%2C%22lng%22%3A14.302396419107936%7D%2C%7B%22lat%22%3A50.116019827009%2C%22lng%22%3A14.360785349547996%7D%2C%7B%22lat%22%3A50.148005694843%2C%22lng%22%3A14.365662825877052%7D%2C%7B%22lat%22%3A50.14142969454%2C%22lng%22%3A14.394903042943952%7D%2C%7B%22lat%22%3A50.171436864513%2C%22lng%22%3A14.506905276796942%7D%2C%7B%22lat%22%3A50.171436864513%2C%22lng%22%3A14.506905276796942%7D%5D%5D&hasDrawnBoundary=true&locationInput=praha",
        keyValue: (obj) => parseInt(obj.id),
        transform: async (data) => {
            let output = [];
            let promises = [];
            for(obj of data) {
                    let local = obj;
                    promises.push(new Promise((resolve, reject) => request.get("https://www.bezrealitky.cz/nemovitosti-byty-domy/"+local.uri, (err, res, body) => {
                        let finObj = {};
                        finObj.url = "https://www.bezrealitky.cz/nemovitosti-byty-domy/"+local.uri;
                        finObj.id = parseInt(local.id);
                        finObj.name = $(".heading__title", body).children().last().text().trim();
                        finObj.img_url = $('main .main__container .b-gallery', body).first().find('img').first().attr('src').trim();
                        finObj.msg = $(".b-desc__info", body).last().text().trim();
                        finObj.price = $('.b-fixed__text', body).last().text().trim();
                        finObj.location = {};
                        finObj.location.text = $('.heading__perex', body).last().text().trim();
                        finObj.table = {};
                        output.push(finObj);
                        resolve(finObj);
                })));
            };
            await Promise.all(promises);
            return output;
        },
        reply: (url, name, mail, phone, msg) => {
            
        }
    }
];