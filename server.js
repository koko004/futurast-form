import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const csvPath = path.resolve(dataDir, "inscritas.csv");
const distPath = path.resolve(__dirname, "dist");

const PORT = process.env.PORT || 8080;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  if (req.url === '/api/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const headers = [
          "Fecha Inscripcion",
          "Nombre y Apellidos Niña",
          "Fecha Nacimiento Niña",
          "DNI Niña",
          "Nombre Padre/Madre",
          "Apellidos Padre/Madre",
          "Email",
          "Telefono",
          "Federada",
          "Club",
          "Categoria",
          "Talla Camiseta",
          "Intolerancias Alimenticias",
          "Observaciones"
        ];
        
        const row = [
          data.fechaInscripcion,
          `${data.nombreNina} ${data.apellidosNina}`,
          data.fechaNacimiento,
          data.dniNina,
          data.nombreTutor,
          data.apellidosTutor,
          data.emailTutor,
          data.telefonoTutor,
          data.federada,
          data.club || "-",
          data.categoria || "-",
          data.talla,
          data.intolerancias || "-",
          data.observaciones || "-"
        ];
        
        const csvRow = row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(";");
        
        if (!fs.existsSync(csvPath)) {
          const csvHeaders = headers.map(field => `"${String(field).replace(/"/g, '""')}"`).join(";");
          fs.writeFileSync(csvPath, "\ufeff" + csvHeaders + "\r\n" + csvRow + "\r\n", 'utf8');
        } else {
          fs.appendFileSync(csvPath, csvRow + "\r\n", 'utf8');
        }
        
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else if (req.url === '/api/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (fs.existsSync(csvPath)) {
          const fileContent = fs.readFileSync(csvPath, 'utf8');
          const lines = fileContent.split('\r\n').filter(line => line.trim() !== '');
          if (data.index >= 0 && data.index + 1 < lines.length) {
            lines.splice(data.index + 1, 1);
            fs.writeFileSync(csvPath, lines.join('\r\n') + '\r\n', 'utf8');
          }
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else if (req.url === '/api/inscritas.csv' && req.method === 'GET') {
    if (fs.existsSync(csvPath)) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="inscritas.csv"');
      const readStream = fs.createReadStream(csvPath);
      readStream.pipe(res);
    } else {
      res.statusCode = 404;
      res.end('File not found');
    }
  } else if (req.url === '/api/inscritas' && req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify([])); 
  } else {
    // Serve Static Files
    let reqUrl = req.url === '/' ? '/index.html' : req.url;
    // Remove query strings
    reqUrl = reqUrl.split('?')[0];
    
    let filePath = path.join(distPath, reqUrl);
    
    // Prevent directory traversal
    if (!filePath.startsWith(distPath)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback to index.html for SPA routing
        fs.readFile(path.join(distPath, 'index.html'), (error, content) => {
          if (error) {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
        return;
      }

      const extname = String(path.extname(filePath)).toLowerCase();
      const contentType = MIME_TYPES[extname] || 'application/octet-stream';

      fs.readFile(filePath, (error, content) => {
        if (error) {
          res.writeHead(500);
          res.end('Server Error');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
});
