const User = require("../models/User");
const Transaction = require("../models/Transaction");
const {
  generateWalletAddress,
  validateAddress,
} = require("../utils/addressGenerator");

const walletController = {
  // Obtener dirección de billetera
  getWalletAddress: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: "Usuario no encontrado" });
      }

      if (!user.walletAddress) {
        user.walletAddress = await generateWalletAddress();
        await user.save();
      }

      res.json({ address: user.walletAddress });
    } catch (err) {
      console.error("Error en getWalletAddress:", err);
      res.status(500).json({ msg: "Error del servidor" });
    }
  },

  // Obtener historial de transacciones
  getTransactionHistory: async (req, res) => {
    try {
      const transactions = await Transaction.find({
        $or: [{ user: req.user.id }, { relatedUser: req.user.id }],
      })
        .sort({ date: -1 })
        .populate("relatedUser", "username walletAddress")
        .select("-__v");

      // Formatear las transacciones para la respuesta
      const formattedTransactions = transactions.map((tx) => ({
        _id: tx._id,
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        date: tx.date,
        description: tx.description,
        txHash: tx.txHash,
        counterparty: tx.relatedUser
          ? {
              username: tx.relatedUser.username,
              address: tx.relatedUser.walletAddress,
            }
          : null,
      }));

      res.json(formattedTransactions);
    } catch (err) {
      console.error("Error en getTransactionHistory:", err);
      res
        .status(500)
        .json({ msg: "Error al obtener el historial de transacciones" });
    }
  },

  // Realizar transferencia
  transfer: async (req, res) => {
    try {
      const { recipientAddress, amount, currency } = req.body;

      // Validaciones
      if (!validateAddress(recipientAddress)) {
        return res.status(400).json({ msg: "Dirección de billetera inválida" });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ msg: "Monto inválido" });
      }

      const sender = await User.findById(req.user.id);
      const recipient = await User.findOne({ walletAddress: recipientAddress });

      if (!recipient) {
        return res
          .status(404)
          .json({ msg: "Dirección de billetera no encontrada" });
      }

      const balanceField = `balance${currency}`;
      if (sender[balanceField] < amount) {
        return res.status(400).json({ msg: "Saldo insuficiente" });
      }

      // Crear las transacciones
      const txHash = await generateWalletAddress(); // Usar como ID de transacción

      const [sendTx, receiveTx] = await Promise.all([
        Transaction.create({
          user: sender._id,
          type: "send",
          amount,
          currency,
          status: "completed",
          senderAddress: sender.walletAddress,
          recipientAddress,
          relatedUser: recipient._id,
          txHash,
          description: `Transferencia enviada a ${recipient.username}`,
        }),
        Transaction.create({
          user: recipient._id,
          type: "receive",
          amount,
          currency,
          status: "completed",
          senderAddress: sender.walletAddress,
          recipientAddress,
          relatedUser: sender._id,
          txHash,
          description: `Transferencia recibida de ${sender.username}`,
        }),
      ]);

      // Actualizar balances
      sender[balanceField] -= amount;
      recipient[balanceField] = (recipient[balanceField] || 0) + amount;

      await Promise.all([sender.save(), recipient.save()]);

      res.json({
        msg: "Transferencia realizada con éxito",
        transactionId: txHash,
        newBalance: sender[balanceField],
      });
    } catch (err) {
      console.error("Error en transfer:", err);
      res.status(500).json({ msg: "Error al procesar la transferencia" });
    }
  },

  // Verificar balance
  checkBalance: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select(
        "balanceEUR balanceUSDT balanceBTC balanceETH"
      );
      if (!user) {
        return res.status(404).json({ msg: "Usuario no encontrado" });
      }

      res.json({
        EUR: user.balanceEUR || 0,
        USDT: user.balanceUSDT || 0,
        BTC: user.balanceBTC || 0,
        ETH: user.balanceETH || 0,
      });
    } catch (err) {
      console.error("Error en checkBalance:", err);
      res.status(500).json({ msg: "Error al consultar el balance" });
    }
  },
};

module.exports = walletController;
