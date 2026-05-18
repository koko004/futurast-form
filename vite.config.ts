import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.resolve(__dirname, "inscritas.csv");

const customApiMiddleware = () => ({
  name: 'custom-api-middleware',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url === '/api/register' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
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
            
            const csvRow = row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
            
            if (!fs.existsSync(csvPath)) {
              const csvHeaders = headers.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
              fs.writeFileSync(csvPath, "\ufeff" + csvHeaders + "\n" + csvRow + "\n", 'utf8');
            } else {
              fs.appendFileSync(csvPath, csvRow + "\n", 'utf8');
            }
            
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      } else if (req.url === '/api/delete' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (fs.existsSync(csvPath)) {
              const fileContent = fs.readFileSync(csvPath, 'utf8');
              const lines = fileContent.split('\n');
              // Index + 1 because of the header line
              if (data.index >= 0 && data.index + 1 < lines.length) {
                lines.splice(data.index + 1, 1);
                fs.writeFileSync(csvPath, lines.join('\n'), 'utf8');
              }
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (err: any) {
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
         // Return json format for the admin panel UI if we want
         res.statusCode = 200;
         res.setHeader('Content-Type', 'application/json');
         // As simple fallback we return empty to not break the frontend which uses localStorage
         res.end(JSON.stringify([])); 
      } else {
        next();
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), customApiMiddleware()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
