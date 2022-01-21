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
//main('5e150713fef8552e7ebb79a5b7b1f97dbadcb320c2e51bcc93cca48e3ed991ad')
