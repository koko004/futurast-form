import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import fs from "fs";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const csvPath = path.resolve(dataDir, "inscritas.csv");
const settingsPath = path.resolve(dataDir, "settings.json");

const sendConfirmationEmail = async (data: any) => {
  if (!fs.existsSync(settingsPath)) return;
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  
  if (!settings.user || !settings.password) return;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: settings.user,
      pass: settings.password,
    },
  });

  const mailOptions = {
    from: `"Objetivo FuturAST" <${settings.user}>`,
    to: data.emailTutor,
    subject: "Confirmación de inscripción - Objetivo FuturAST",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #0055A4;">¡Inscripción Confirmada!</h2>
        <p>Hola <strong>${data.nombreTutor}</strong>,</p>
        <p>Te confirmamos que la inscripción de <strong>${data.nombreNina} ${data.apellidosNina}</strong> para la jornada de promoción del fútbol femenino base "Objetivo FuturAST" se ha completado correctamente.</p>
        
        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0055A4;">Detalles de la Jornada</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 10px;">📅 <strong>Fecha:</strong> 6 de Junio</li>
            <li style="margin-bottom: 10px;">⏰ <strong>Horario:</strong> 10:00 a 14:00 horas</li>
            <li style="margin-bottom: 10px;">💶 <strong>Precio:</strong> Gratuito</li>
          </ul>
        </div>
        
        <p>Te recordamos que la niña está inscrita con la talla de camiseta: <strong>${data.talla}</strong>.</p>
        <p>Si tienes alguna duda, puedes contactar con la Real Federación de Fútbol del Principado de Asturias en el correo electrónico <a href="mailto:itziar@asturfutbol.es" style="color: #0055A4; text-decoration: none;">itziar@asturfutbol.es</a>.</p>
        
        <br>
        <p>Un saludo,</p>
        <p><strong>El equipo de Objetivo FuturAST</strong></p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to", data.emailTutor);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

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
            
            const csvRow = row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(";");
            
            if (!fs.existsSync(csvPath)) {
              const csvHeaders = headers.map(field => `"${String(field).replace(/"/g, '""')}"`).join(";");
              fs.writeFileSync(csvPath, "\ufeff" + csvHeaders + "\r\n" + csvRow + "\r\n", 'utf8');
            } else {
              fs.appendFileSync(csvPath, csvRow + "\r\n", 'utf8');
            }

            // Send email
            sendConfirmationEmail(data).catch(console.error);
            
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      } else if (req.url === '/api/settings' && req.method === 'GET') {
        if (fs.existsSync(settingsPath)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(fs.readFileSync(settingsPath, 'utf8'));
        } else {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({}));
        }
      } else if (req.url === '/api/settings' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf8');
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
              const lines = fileContent.split('\r\n').filter(line => line.trim() !== '');
              if (data.index >= 0 && data.index + 1 < lines.length) {
                lines.splice(data.index + 1, 1);
                fs.writeFileSync(csvPath, lines.join('\r\n') + '\r\n', 'utf8');
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