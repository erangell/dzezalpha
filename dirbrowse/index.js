const http = require('http')
const { Client: HyperspaceClient } = require('hyperspace')
const hyperdrive = require('hyperdrive')

async function main(drivekeyStr) {
    const key = Buffer.from(drivekeyStr,'hex')
    const client = new HyperspaceClient()
    const drive = new hyperdrive(client.corestore(), key)
    
    //await drive.promises.ready()
    //console.log(drive.key)

    //readdir() will await ready() before it runs
    //const dirlist = await drive.promises.readdir('/')
    //console.log(dirlist)

    http.createServer( async (req, res) => {
        const path = req.url

        const st = await drive.promises.stat(path)
        //console.log(st)
        //console.log('File?',st.isFile())
        //console.log('Dir?',st.isDirectory())

        if (st.isDirectory())
        {
            if (!path.endsWith('/'))
            {
                return res.writeHead(303, {Location: path + '/' }).end()
            }
            const subfiles = await drive.promises.readdir(path)

            //console.log('Directory of: ',path)
            //console.log(subfiles.join('\n'))
            
            const html = `<html><body>
                ${path !== '/' ? `
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
            drive.createReadStream(path).pipe(res)
        }

        //const files = await drive.promises.readdir('/')
        //res.writeHead(200).end('<b>dZeZ Rocks!</b><pre>'+files.join('\n')+'</pre>')

    }).listen(8080)
    
    console.log('Open web browser to http://localhost:8080')
}

main('63a37d55e81f975f3fc0ca36a1ee458436e90da13236eba259aba51ee72a69e1')
//main('27091469efe686137e6a54adc4378e9a866721f93821ad9c490a7e349c0dbca3')
//main('d488a3a3b8d66e7504170ebd61d9c0e62794d6dea15da2db24371aa460eaa8b2')
//main('ac8a1643d1d4553ad869cfaf60d15fb86ed1b95f1d8354b16b7cf06108e29723')
//main('b24c0ccfed0d3e8543a4779afd4a5351dd63dea6ad105d4247369b43078630af')
