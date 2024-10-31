const express = require("express");
const router = express.Router();
const multer = require("multer");
const nodemailer = require("nodemailer");
const auth = require("../middleware/auth");
const User = require("../models/User");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

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

      if (user.kycStatus === "verified") {
        return res.status(400).json({ msg: "KYC ya está verificado" });
      }

      // Cambiar de not_submitted a pending
      user.kycStatus = "pending";
      user.kycSubmissionDate = new Date();
      user.kycRejectionReason = null;
      await user.save();

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.KYC_RECIPIENT,
        subject: `Nueva solicitud de KYC de ${fullName}`,
        text: `
          Detalles del usuario:
          ID: ${user._id}
          Email: ${user.email}
          
          Información KYC:
          Nombre completo: ${fullName}
          Fecha de nacimiento: ${dateOfBirth}
          Dirección: ${address}
          Número de DNI/NIE: ${idNumber}
          Fecha de envío: ${new Date().toLocaleString()}
          
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
          console.error("Error al enviar el correo KYC:", error);
          return res.status(500).json({ msg: "Error al enviar el correo" });
        }
        res.json({
          msg: "Documentación KYC enviada con éxito. En proceso de verificación.",
          kycStatus: "pending",
          kycSubmissionDate: user.kycSubmissionDate,
        });
      });
    } catch (err) {
      console.error("Error en el procesamiento de KYC:", err);
      res.status(500).json({
        msg: "Error del servidor al procesar KYC",
        error: err.message,
      });
    }
  }
);

// Obtener estado de KYC del usuario
router.get("/status", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "kycStatus kycSubmissionDate kycVerificationDate kycRejectionReason"
    );
    res.json(user);
  } catch (err) {
    console.error("Error al obtener estado KYC:", err);
    res.status(500).json({ msg: "Error al obtener estado KYC" });
  }
});

module.exports = router;
