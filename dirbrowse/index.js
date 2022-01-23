const http = require('http')
const { Client: HyperspaceClient } = require('hyperspace')
const hyperdrive = require('hyperdrive')

async function main(drivekeyStr) {
    const key = Buffer.from(drivekeyStr,'hex')
    const client = new HyperspaceClient()
    const drive = new hyperdrive(client.corestore(), key)
    
    //await drive.promises.ready()
    //console.log(drive.key)

    //If the drive is not in the local cache, need to replicate the metadata core
    //of the hyperdrive over the network.  Metadata has all the information for each file.
    //The contents of the file are in the content hypercore.
    //For a hyperbee you would replicate bee.feed
    client.replicate(drive.metadata)

    http.createServer( async (req, res) => {
        serveDrive(drive, req, res)    
    }).listen(8080)
    
    console.log('Open web browser to http://localhost:8080')
}

async function getvaultadrs(drivekeyStr, userpick) {
    const key = Buffer.from(drivekeyStr,'hex')
    const client = new HyperspaceClient()
    const drive = new hyperdrive(client.corestore(), key)
    
    //await drive.promises.ready()
    //console.log(drive.key)

    //If the drive is not in the local cache, need to replicate the metadata core
    //of the hyperdrive over the network.  Metadata has all the information for each file.
    //The contents of the file are in the content hypercore.
    //For a hyperbee you would replicate bee.feed
    client.replicate(drive.metadata)

    var vaultadrs=drivekeyStr   //default vault if not overriden below

    //readdir() will await ready() before it runs
    const dirlist = await drive.promises.readdir('/')
    ix=-1
    for (i=0; i<dirlist.length; i++)
    {
        if (dirlist[i]==="vault.json")
        {    ix=i
             break
        }
    }
    if (ix >= 0)
    {
        const vaults = await drive.promises.readFile("/vault.json")
        console.log("File contents:",vaults.toString())
        
        try
        {
            const vdata = JSON.parse(vaults.toString())
            //console.log(vdata)
            console.log("Vaults found in JSON file:")
            for (i=0; i<vdata.vaults.length; i++)
            {
                console.log(i,":",vdata.vaults[i])
            }

            const userdata=vdata.vaults[userpick]
            console.log("User selected: ",userdata)
            console.log("vname",userdata.vname)
            console.log("vadrs",userdata.vadrs)
            vaultadrs = userdata.vadrs
            
        }
        catch (e)
        {
            console.log("JSON Parse Exception",e)
        }

        main(vaultadrs)
    }
}

// Load user's selected vault from a hyperdrive that has vault.json
// 2nd parameter is which vault from the file to choose: 0,1,2,3 or 4
//Todo: querystring variable to select vault
getvaultadrs(
    '27091469efe686137e6a54adc4378e9a866721f93821ad9c490a7e349c0dbca3',0)

//The following can now be accessed using the command above
//main('63a37d55e81f975f3fc0ca36a1ee458436e90da13236eba259aba51ee72a69e1')
//main('27091469efe686137e6a54adc4378e9a866721f93821ad9c490a7e349c0dbca3')
//main('d488a3a3b8d66e7504170ebd61d9c0e62794d6dea15da2db24371aa460eaa8b2')
//main('ac8a1643d1d4553ad869cfaf60d15fb86ed1b95f1d8354b16b7cf06108e29723')
//main('b24c0ccfed0d3e8543a4779afd4a5351dd63dea6ad105d4247369b43078630af')

async function serveDrive (drive, req, res)
{
    const path = req.url
    console.log('Path:',path)
    unencpath = decodeURI(path)
    console.log("Decoded:",unencpath)
    
    try
    {
        //const needed to be changed to var for st to be hoisted
        var st = await drive.promises.stat(unencpath)
    }
    catch (e)
    {
        res.writeHead(404).end('404: File not found (check for special characters) - click BACK button')
        return
    }

    //console.log(st)
    //console.log('File?',st.isFile())
    //console.log('Dir?',st.isDirectory())

    if (st.isDirectory())
    {
        if (!unencpath.endsWith('/'))
        {
            return res.writeHead(303, {Location: unencpath + '/' }).end()
        }
        const subfiles = await drive.promises.readdir(unencpath)

        //console.log('Directory of: ',unencpath)
        //console.log(subfiles.join('\n'))
        
        const html = `<html><body>
            ${unencpath !== '/' ? `
                <div><a href="..">..</a></div>
            ` : ''}
            ${subfiles.map( file => {
            return `
            <div><a href="${file}">${file}</a></div>
            `}).join('')  
            }
        </body></html>`

        res.writeHead(200,{'Content-Type' : 'text/html'}).end(html)
    }
    else if (st.isFile())
    {      
        //console.log('Is a file')
        //res.writeHead(200).end('ToDo')

        res.writeHead(200)
        
        //The following reads the whole file before
        //sending it to the response stream:
        //const content = await drive.promises.readFile(path)
        //res.end(content)

        //Every time a chunk is read from the drive
        //it gets piped to the response stream:
        drive.createReadStream(unencpath).pipe(res)
    }

    //const files = await drive.promises.readdir('/')
    //res.writeHead(200).end('<b>dZeZ Rocks!</b><pre>'+files.join('\n')+'</pre>')
}