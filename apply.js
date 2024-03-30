
const fs = require('fs');
const { TargetType } = require('puppeteer');
const puppeteer = require('puppeteer-extra');
//code is for testing purposes, i Need to test out the apply for each link!
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

global.isSubmitted = false;
async function apply() {

    //later: let appliedTo = 0, when we click on the submit button

    let error = false;
    try {
        const existingData = fs.readFileSync('applied.json', 'utf8');//rename to jobstoApply
        const existingLinks = JSON.parse(existingData);
        puppeteer.use(StealthPlugin())

        let browser = await puppeteer.launch({ headless: false });//"new"
        const page = await browser.newPage()



        /*load this data here
        for (const link of existingLinks) {
 
             if (link == 'Apply button not found') {
                 console.log('no application found');
                 continue
             }
 */


        //test link 2 = https://www.tesla.com/careers/search/job/internship-software-engineer-energy-engineering-fall-2024-217823

        const testLink = "https://www.tesla.com/careers/search/job/internship-software-engineer-energy-engineering-fall-2024-217823"
        console.log(testLink);

 
        
        await page.goto(testLink); 
                

        let iterations = 0;
        while (iterations <= 4 && !error) {
            if (!global.isSubmitted) {
                console.log('not submitted')
            }
            //to force us to run awaits before executing any future code ahead of this
            await applyButton(page);
            await clickSelectors(page);
            await enterInputs(page);
            await fillRadios(page); // Call fillRadios
            await nextPage(page);

            await findSubmissison(page);
            iterations += 1;

        }

        //await browser.close();

    }
    catch (error) {
        if (error.name == "TimeoutError " || (error.message && error.message.includes("Timed out after 30000 ms while waiting"))) {
            error = true;//stop future execution of current function while trying to get to the next
            apply();

        }
        else {
            console.log(error)
        }

    }
}

apply();




async function findSubmissison(page) {
    // final outcome of our project, we want to submit this!
    try {

        const submitKeyWords = ['submit', 'send', 'complete', 'apply'];//i hope that apply is after we have made to the actual job app and dosent get confused
        for (const submitWord of submitKeyWords) {
            const elements = await page.$x(`//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${submitWord.toLowerCase()}')]`);
            //gets an array of elements that gets every element that has keywords
            console.log(elements)
            if (elements.length < 1) {
                continue
            }
            else {
                for (const element of elements) {
                    if (!element) {
                        continue;
                    }
                    await page.evaluate((element) => {
                        element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
                    }, element);
                    global.isSubmitted = true;//we have found it
                    //await element.click();
                    console.log(element, "we have found the submission button!")

                }

            }
        }
    } catch (error) {
        if (error.message.includes('Node is either not clickable or not an Element')) {
            console.log("node element is not able to be clicked, continuing")
        }
    }

}
async function applyButton(page) {
    try {

        const getDomain = new URL(page.url());//get the domain

        const firstPageKeywords = ['apply', 'start', 'application',]

        const current_page = page.url();//current page to initiate application

        console.log(current_page);

        for (const keyword of firstPageKeywords) {
            const matchingElements = await page.$x(`//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${keyword.toLowerCase()}') and @href]`);
            //finds all elements with keyword and a href value...

            if (matchingElements.length == 0) {
                console.log("no links for keyword found")
                continue;
            }
            else {
                for (const element of matchingElements) {
                    console.log(element)
                    if (element.textContent == 'Apply With Indeed') {//handle external sites that we dont want to click on
                        continue;
                    }
                    const href = await page.evaluate(el => el.getAttribute('href'), element)//extract href
                    console.log(href)
                    //in the case of synchronicity, if we do an await page.goto or any await for that matter,
                    //then if the code after is an conditional or anything else, they may not run at all, 

                    if (!href.includes(getDomain.protocol)) {//check if the href has the domain, if not we can try adding it
                        console.log('checking to see if we can create a new link...');
                        await page.goto(getDomain.origin + href, { waitUntil: 'domcontentloaded', timeout: 10000 });
                        //treat page.goto as causing the function to break out...only use sparingly, dont use it in succession without a condition!
                    }
                    else {
                        await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 10000 });


                    }

                }
            }

            console.log('we have gone to the next page')
            console.log('Current URL:', page.url());
        }


        //most likely should add a error case if we dont get to the next page,should throw an error
        //probably via else statement
    } catch (error) {
        if (error.name === 'TimeoutError') {
            console.log('couldnt navigate to  the next page, check your link again, continue with the next steps?');
        }
    }
    //may need a try-catch here!

}




async function nextPage(page) {
    // in order to click something, we must get it to the view port first



    try {
        const transitionKeyWords = ['next', 'continue', 'proceed', 'advance', 'forward'];
        for (const transition of transitionKeyWords) {
            const elements = await page.$x(`//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${transition}')]`);

            //gets an array of elements that gets every element that has keywords
            console.log(elements)
            if (elements.length < 1) {
                continue
            }
            else {
                for (const element of elements) {
                    if (!element) {
                        continue;
                    }
                    console.log(element.textContent)
                    await page.evaluate((element) => {
                        element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
                    }, element);
                    await element.click();
                    console.log(element, "clicked")

                }

            }
        }
    }
    catch (error) {
        if (error.message && error.message.includes('Node is either not clickable or not an Element')) {
            console.log("node element is not able to be clicked, continuing")
        }
    }

}
async function getElementArea(element) {
    const getBounding = await element.boundingBox();
    return getBounding;
}


async function fillRadios(page) {
    //this is now for radios:
    // List of keywords to search for
    //huge problem: sometimes isnt accurate with xpath, make sure you fix this problem!!!!
    try {
        const radio_dict = {
            //we may want to handle gender: male, as it can detect female
            applying: 'yes', gender: 'male', 'race/ethnicity': 'east asian', ethnicity: 'chinese', race: 'asian', veteran: 'i am not', disability: 'no, i do not have', 'Do you need': 'no', 'thesis': 'no', 'previously': 'no', 'former': 'no', 'student': 'yes', 'consent': 'yes', 'relocate': 'yes'
        };

        //sometimes xPath gives less than accurate results when converting to lowercase(as it can affect which radios are chosen)


        //since theres a huge amount of lower case text, it may screw up the code a bit, so stick with concrete values
        // Store XPaths for radio buttons outside the loop
        const radios = await page.$$('input[type="checkbox"], input[type="radio"]');



        for (const [key, value] of Object.entries(radio_dict)) {

            const keyValue = value;//get value, else, dont...
            const keyword = key;
            console.log(keyValue)

            //for text content that should be next to radios

            const radioTexts = await page.$x(`//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${keyValue}')]`);


            //text content that should be for texts above radios(to identify them)
            const elements = await page.$x(`//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${keyword}')]`);

            let max_count = 0;
            //lets make at the most only 3 checks, saves us computation, this should give enough to check if the radio is sufficently clicked

            for (const element of elements) {

                if (max_count > 3) {//stop it from going out of control
                    break;
                }
                const elementBox = await getElementArea(element);

                if (!elementBox) {
                    continue; // Skip this element if it doesn't have a bounding box
                }

                //maybe to surround he radiosSorted witha  new promise to finish this before we continue to the next page
                //gets all radios that are below the text
                const elementsBelow = await Promise.all(radios.map(async (radio) => {
                    const radioBox = await getElementArea(radio);
                    if (!radioBox) {
                        return null;
                    }
                    const distance = radioBox.y - elementBox.y
                    if (distance >= 0) {
                        //handle negative values...(filter unneeded radios that are above(lower y pos ) the element)
                        return {
                            radio,
                            distance,
                            element,//we need this as we need to scroll to this value to avoid blocking of popup errors
                        };
                    }
                    else {
                        return null;
                    }
                })
                    //use a map to find the closest distance from the keyValue to the current radio(we wil click the closest radio)

                    //find closest distance from the element and the closest distance to the text of the radio
                );


                const filteredElementsBelow = elementsBelow.filter(radio => radio != null);//all the radios that are below the keys we want

                filteredElementsBelow.sort((a, b) => a.distance - b.distance);
                let final_result = [];
                for (const radioBelow of filteredElementsBelow) {
                    if (!radioBelow) {
                        continue;
                    }

                    let text_distances = [];
                    for (const text of radioTexts) {//all the texts needed for radio

                        const textBox = await getElementArea(text);
                        const radioBox = await getElementArea(radioBelow.radio);
                        if (!textBox || !radioBox) {//handle this
                            continue;
                        }
                        // console.log(textBox)

                        const x_distance = Math.abs(textBox.x - radioBox.x);
                        const y_distance = Math.abs(textBox.y - radioBox.y);

                        const total_distance = Math.sqrt(x_distance ** 2 + y_distance ** 2)
                        //we just want to make sure its closest value possible.
                        text_distances.push(total_distance)
                        console.log(total_distance)

                    }
                    text_distances.sort((a, b) => a - b);

                    final_result.push({ ...radioBelow, total_distance: text_distances[0] })//find the closet distance for each radio...


                }
                //sort the final distances to get the one closest to the radio with the value we want.
                if (!final_result || final_result.length == 0) {
                    continue;
                }
                else {
                    final_result.sort((a, b) => a.total_distance - b.total_distance)
                    max_count++;

                    await page.evaluate((element) => {
                        element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
                    }, final_result[0].element);
                    //  console.log(final_result)
                    // console.log(final_result[0].radio);
                    await final_result[0].radio.click();

                }


            };



        }

        await nextPage(page);
    }
    catch (error) {
        if (error.name === 'ProtocolError' && error.message.includes('Input.dispatchMouseEvent')) {
            console.error('ProtocolError occurred:', error.message);
            // Handle the error as needed
        }
    }

}

async function clickSelectors(page) {
    //a way to improve this would be able to do to the same process as radios, find the distance of the text and the selector, and base it off the text instead...
    try {
        const selectKeywords = { phone: 'mobile', country: 'united states', duration: '3 months', type: 'full time', dedicate: 'full time' }
        const selectElements = await page.$x('//select[@type="select"]');
        console.log("selectors", selectElements);
        for (const selectElement of selectElements) {
            // Get the attributes of the select element
            await page.evaluate((element) => {
                element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
            }, selectElement);
            const attributes = await page.evaluate(el => {
                const attrs = {};
                for (const attr of el.attributes) {
                    attrs[attr.name] = attr.value.toLowerCase();
                }
                return attrs;
            }, selectElement);
            console.log("attributes:", attributes);
            const matchingKey = Object.keys(selectKeywords).find(key => (Object.values(attributes).some(attribute => attribute.includes(key))));
            //finds if in the looped dictionary, theres a key that matches the value in attributes(we loop through and then we find values of the attributes that matches a key, and we get that dictionary...)



            if (matchingKey) {

                const matchingAttribute = Object.entries(attributes).find(([key, value]) => {
                    return value.includes(matchingKey);
                });

                console.log(matchingAttribute)
                const optionValue = selectKeywords[matchingKey];
                const optionElements = await selectElement.$$('option');//get all "option elements" in the child of select element
                for (const optionElement of optionElements) {//loop through the options in the option elements..
                    const optionText = await page.evaluate(el => el.textContent.trim(), optionElement);

                    if (optionText.toLowerCase().includes(optionValue)) {
                        const optionValue = await page.evaluate(option => option.value, optionElement);
                        //we are the correct text that has the value we want to select, so United states is the text content of it, we want to get it by value

                        if (attributes.id) {
                            await page.waitForSelector(`select[id="${attributes.id}"]`);
                            await new Promise(resolve => {
                                setTimeout(async () => {
                                    await page.select(`select[id="${attributes.id}"]`, optionValue)
                                    console.log('selected')
                                    resolve();
                                }, 3000)
                            });

                        }
                        else {
                            await page.waitForSelector(`select[${matchingAttribute[0]}="${matchingAttribute[1]}"]`);
                            await new Promise(resolve => {
                                setTimeout(async () => {
                                    await page.select(`select[${matchingAttribute[0]}="${matchingAttribute[1]}"]`, optionValue)
                                    console.log('selected')
                                    resolve();
                                }, 3000)
                            });
                        }
                    }
                }

            }
            else {
                throw ('selector has not been attended to, this will not allow you to get to the next page');
                //we cant get this selector...
            }

        }
    }
    catch (error) {
        console.log(error)
    }

}





async function enterInputs(page) {
   

 
    const inputKeywords = { first: 'Jack', last: 'John', full: 'Jack John', country: 'United States', location: 'Lewiston, Maine', residence: 'Lewiston, Maine', email: 'jackJohnson@gmail.com', phone: '4910392010', avaliab: '05/2024', start: '05/2024' };
    //some words are mispelled to take the case of plural
    const requiredWord = 'name'

    //check for page selectors that are usually "select" elements




    //page inputs:
    const matchingInputs = await page.$$('input');//perhaps x path is better
    //console.log(matchingInputs);
    try {
        for (const input of matchingInputs) {//get each individual input


            await page.evaluate((element) => {
                element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
            }, input);
            let inputFilled = false;
            //boolean for list selections:
            const attributes = await page.evaluate(el => {//el represent the input
                let attribute_dict = {};
                const attributeNames = el.getAttributeNames();//get all attributes of input

                for (const name of attributeNames) {
                    if (el.getAttribute('value')) {//if input is filled
                        inputFilled = true;
                        break;
                    }
                    console.log(name)
                    attribute_dict[name] = el.getAttribute(name)

                }
                return attribute_dict;
            }, input)

            if (inputFilled) {//check if input has been filled already by a previous iteration
                continue
            }




            console.log(attributes)
            let selector = false;
            let completed = false;



            for (const [attr, value] of Object.entries(attributes)) {//represents each key value for input
                const attrValue = value ? value.toLowerCase() : '';
                const key = attr ? attr.toLowerCase() : '';
                if (key.includes('aria') || key.includes('autocomplete')) {
                    selector = true;//is a selector(basically an input) that requires clicking(use bounding box)
                    console.log(attr)
                }
                const isLocationSelector = attrValue.includes('location') || attrValue.includes('residence');

                const getKey = Object.keys(inputKeywords).find(key => attrValue.includes(key));//if input is valid
                console.log(getKey)
                console.log(attrValue)


                switch (true) {
                    case attrValue.includes('file') && !completed:
                        await input.uploadFile('Career Resume.pdf')
                        //add stuff here
                        console.log('entered a file')
                        completed = true;
                        break;
                    case getKey && attrValue.includes(requiredWord) && !completed:
                        //for actual names(reduces chance of error)

                        await input.type(inputKeywords[getKey])

                        completed = true;
                        break;
                    case getKey && !completed && !selector://if its not a name, then this will come

                        await input.type(inputKeywords[getKey])
                        completed = true;
                        break;

                    //we need to edit here for more selectors, just in case, we might need to do it here..
                    case selector && isLocationSelector && !valueHandle:

                        await page.evaluate((element) => {//get into view
                            element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
                        }, input);

                        await input.type('Lewiston, Maine')
                        //console.log('selected city');
                        const inputBox = await input.boundingBox();
                        //console.log(inputBox)

                        await new Promise((resolve) =>
                            setTimeout(async () => {
                                await input.click();
                                await page.mouse.click(inputBox.x, inputBox.y + inputBox.height + 10);
                                resolve();//resolve after await is done...
                            }, 5000)

                        )



                        completed = true;

                        break;


                }





            }

        }
        await nextPage(page)
    } catch (error) {
        if (error.name === 'ProtocolError' && error.message.includes('Input.dispatchMouseEvent')) {
            console.error('ProtocolError occurred:', error.message);
            // Handle the error as needed
        }
    }
}





