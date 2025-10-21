const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8080;

const server = http.createServer((req, res) => {
    // Serve the HTML page
    if (req.url === '/' && req.method === 'GET') {
        const htmlPath = path.join(__dirname, 'generator.html');
        fs.readFile(htmlPath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    }
    // Handle the generation request
    else if (req.url === '/generate' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { requestCode, schoolName, expiresAt, plan } = JSON.parse(body);

                if (!requestCode || !expiresAt) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Request code and expiration date are required.' }));
                    return;
                }

                // Construct the command
                let command = `node "${path.join(__dirname, 'generate_license.js')}" --request "${requestCode}" --expires "${expiresAt}" --plan "${plan || 'standard'}"`;
                if (schoolName) {
                    command += ` --school "${schoolName}"`;
                }

                // Execute the script
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: stderr || 'Failed to generate license.' }));
                        return;
                    }

                    // Extract the license key from the script's output
                    const licenseKeyMatch = stdout.match(/--- LİSANS ANAHTARI ---\n\n([\s\S]*?)\n\n-----------------------/);
                    if (licenseKeyMatch && licenseKeyMatch[1]) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ licenseKey: licenseKeyMatch[1].trim() }));
                    } else {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Could not parse license key from script output.' }));
                    }
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON body.' }));
            }
        });
    }
    // Not Found
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`Lisans üretici arayüzü çalışıyor.`);
    console.log(`Adres: ${url}`);

    // Tarayıcıyı otomatik olarak aç (Windows için)
    const { exec } = require('child_process');
    exec(`start ${url}`);
});