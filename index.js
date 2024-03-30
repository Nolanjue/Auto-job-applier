
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')
const fs = require('fs');


// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin())

// puppeteer usage as normal
puppeteer.launch({ headless: true }).then(async browser => {


    console.log('Running bypass tests..')
    const page = await browser.newPage()
    await page.goto('https://www.indeed.com/jobs?q=computer+science+intern&l=Santa+Clara%2C+CA&sc=0kf%3Aattr%28Q5R8A%29explvl%28ENTRY_LEVEL%29%3B&radius=50&sort=date&vjk=69769103aed31b4c')
    await page.waitForTimeout(5000)

    const extractedData = await page.evaluate(() => {

        const getHeader = document.querySelectorAll('.jcs-JobTitle');
        const getLocation = document.querySelectorAll('.company_location');
        const data = [];
        getHeader.forEach((element, index) => {
            const title = element.querySelector('span').textContent;
            const location = getLocation[index].textContent;
            const link = element.href;

            data.push({ title, location, link });
        });

        return data;//return value of extracted data
    });



    for (const data of extractedData) {
        await page.goto(data.link, { waitUntil: ['domcontentloaded', 'networkidle2'] });
        await page.waitForTimeout(5000);

        const applyButton = await page.$('.css-1oxck4n.e8ju0x51');
        let button_link;
        if (applyButton) {
            const hrefAttribute = await page.$eval('.css-1oxck4n.e8ju0x51', element => element.getAttribute('href'));
            button_link = hrefAttribute;


        } else {
            button_link = data.link;//usually if failed, we can fetch the original link
        }
        const qualifications = await page.$$eval('#jobDescriptionText div ul', qualificationElements => {
            return qualificationElements.map(qual => qual.textContent.trim());
        });
      

        data.qualifications = qualifications;
        data.applyLink = button_link;
        console.log(button_link)
        console.log(data);
    }
    console.log(extractedData);


    let link_data = [];
    for(const link of extractedData)
    {
        link_data.push(link.applyLink)
    }

    fs.appendFileSync('applied.json', JSON.stringify(link_data), (err)=>{
        if(err)throw err
        console.log('data now saved in applied.json')
    })





    //very end when we have applied to the job: 
   /*   let existingData = [];
        if (fs.existsSync('applied.json')) {

            const existingDataRaw = fs.readFileSync('data.json', 'utf8');
            
            existingData = JSON.parse(existingDataRaw);

            const mergedData = [...existingData, ...(array data here)] //already an array of dictionaries..

            mergedData.forEach((data) => {
                getSheet.addRow(data);
              });
            }
            else{
              fs.appendFileSync('data.json', JSON.stringify(videos), (err)=>{
                if(err)throw err
                console.log('data now saved in data.json')
            })
        }
        */
    await browser.close();
    console.log(`Data recieved. ✨`)
})