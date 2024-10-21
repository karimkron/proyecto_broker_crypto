const express = require("express");
const router = express.Router();
const multer = require("multer");
const nodemailer = require("nodemailer");
const auth = require("../middleware/auth");
const User = require("../models/User");

// Configurar multer para el almacenamiento de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Configurar el transporter de nodemailer (ajusta esto con tu proveedor de correo)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post(
  "/",
  auth,
  upload.fields([
    { name: "frontId", maxCount: 1 },
    { name: "backId", maxCount: 1 },
    { name: "selfieWithId", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { fullName, dateOfBirth, address, idNumber } = req.body;
      const user = await User.findById(req.user.id);

      // Actualizar el estado de KYC del usuario
      user.kycStatus = "pending";
      await user.save();

      // Preparar y enviar el correo
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.KYC_RECIPIENT,
        subject: `Nueva solicitud de KYC de ${fullName}`,
        text: `
                Nombre completo: ${fullName}
                Fecha de nacimiento: ${dateOfBirth}
                Dirección: ${address}
                Número de DNI/NIE: ${idNumber}
                
                Los archivos adjuntos incluyen:
                - Frente del DNI/NIE
                - Reverso del DNI/NIE
                - Selfie con DNI/NIE
                - Comprobante de domicilio
            `,
        attachments: [
          {
            filename: req.files["frontId"][0].filename,
            path: req.files["frontId"][0].path,
          },
          {
            filename: req.files["backId"][0].filename,
            path: req.files["backId"][0].path,
          },
          {
            filename: req.files["selfieWithId"][0].filename,
            path: req.files["selfieWithId"][0].path,
          },
          {
            filename: req.files["addressProof"][0].filename,
            path: req.files["addressProof"][0].path,
          },
        ],
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return res.status(500).json({ msg: "Error al enviar el correo" });
        }
        res.json({ msg: "Información de KYC enviada con éxito" });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Error del servidor");
    }
  }
);

module.exports = router;
