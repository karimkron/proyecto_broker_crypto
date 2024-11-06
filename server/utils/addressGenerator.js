const crypto = require("crypto");

const addressGenerator = {
  // Generar nueva dirección de billetera
  generateWalletAddress: async () => {
    // Generar bytes aleatorios
    const randomBytes = crypto.randomBytes(32);

    // Crear un hash SHA256
    const hash = crypto.createHash("sha256");
    hash.update(randomBytes);

    // Obtener el hash en hexadecimal
    const address = hash.digest("hex");

    // Añadir un prefijo para identificar el tipo de dirección
    return `wx${address}`;
  },

  // Validar formato de dirección
  validateAddress: (address) => {
    // Verificar el formato básico: prefijo 'wx' seguido de 64 caracteres hexadecimales
    const addressRegex = /^wx[0-9a-f]{64}$/i;
    return addressRegex.test(address);
  },
};

module.exports = addressGenerator;
